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
import { Room } from '../entities/room.ts';

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

        if (data.roomId) {
            const room = (await this.roomRepository.findById(data.roomId)) as Room | null;
            if (!room) throw new NotFoundException('Room', data.roomId);
            const targetHotelId = data.hotelId ?? existing.hotelId;
            if (room.hotelId !== targetHotelId) {
                throw new BusinessRuleException('Room does not belong to the specified hotel');
            }
        }

        BookingValidator.validateUpdate(data);

        const roomIdToCheck = data.roomId ?? existing.roomId;
        const checkIn = data.checkInDate ?? existing.checkInDate;
        const checkOut = data.checkOutDate ?? existing.checkOutDate;

        if (roomIdToCheck && checkIn && checkOut) {
            const overlapping = await this.bookingRepository.findByDateRange(checkIn, checkOut);
            const others = overlapping.filter(
                (b) =>
                    b.roomId === roomIdToCheck &&
                    b.status !== 'cancelled' &&
                    (b as any)._id?.toString() !== (existing as any)._id?.toString()
            );
            if (others.length > 0) {
                throw new BusinessRuleException('Room is not available for the selected dates');
            }
        }

        return this.bookingRepository.update(id, data);
    }
}
