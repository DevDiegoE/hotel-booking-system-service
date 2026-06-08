import { inject, injectable } from 'tsyringe';
import { IBookingRepository } from '../repositories/IBookingRepository.ts';
import { IHotelRepository } from '../repositories/IHotelRepository.ts';
import { IRoomRepository } from '../repositories/IRoomRepository.ts';
import { Booking } from '../entities/booking.ts';
import { BookingValidator } from '../validators/BookingValidator.ts';
import {
    NotFoundException,
    BusinessRuleException,
    ValidationException,
} from '../exceptions/DomainException.ts';

export interface UpdateBookingRequest {
    id: string;
    data: Partial<Booking>;
}

@injectable()
export class UpdateBookingUseCase {
    constructor(
        @inject('BookingRepository') private readonly bookingRepository: IBookingRepository,
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository,
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository
    ) {}

    async execute(request: UpdateBookingRequest): Promise<Booking | null> {
        const { id, data } = request;
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }

        const existing = await this.bookingRepository.findById(id);
        if (!existing) {
            throw new NotFoundException('Booking', id);
        }

        if (data.hotelId) {
            const hotel = await this.hotelRepository.findById(data.hotelId);
            if (!hotel) throw new NotFoundException('Hotel', data.hotelId);
        }

        BookingValidator.validateUpdate(data);

        const checkIn = data.checkInDate ?? existing.checkInDate;
        const checkOut = data.checkOutDate ?? existing.checkOutDate;
        const targetHotelId = data.hotelId ?? existing.hotelId;
        const targetSelections = data.roomSelections ?? existing.roomSelections;

        if (targetSelections?.length && checkIn && checkOut) {
            const hotelRooms = await this.roomRepository.findByHotelId(targetHotelId);
            const overlapping = await this.bookingRepository.findByDateRange(checkIn, checkOut);

            for (const selection of targetSelections) {
                const roomType = hotelRooms.find((room) => room.type === selection.roomType);
                if (!roomType) {
                    throw new BusinessRuleException(
                        `No rooms of type ${selection.roomType} available in this hotel`
                    );
                }

                const occupiedCount = overlapping
                    .filter(
                        (booking) =>
                            booking.status !== 'cancelled' &&
                            booking.hotelId === targetHotelId &&
                            booking._id?.toString() !== existing._id?.toString()
                    )
                    .reduce((total, booking) => {
                        const matchedSelection = booking.roomSelections.find(
                            (roomSelection) => roomSelection.roomType === selection.roomType
                        );
                        return total + (matchedSelection?.quantity || 0);
                    }, 0);

                if (roomType.totalRooms - occupiedCount < selection.quantity) {
                    throw new BusinessRuleException(
                        `Only ${Math.max(
                            0,
                            roomType.totalRooms - occupiedCount
                        )} rooms of type ${selection.roomType} available for the selected dates.`
                    );
                }
            }
        }

        return this.bookingRepository.update(id, data);
    }
}
