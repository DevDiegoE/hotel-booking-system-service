import { inject, injectable } from 'tsyringe';
import { IBookingRepository } from '../repositories/IBookingRepository.ts';
import { IHotelRepository } from '../repositories/IHotelRepository.ts';
import { IRoomRepository } from '../repositories/IRoomRepository.ts';
import { Booking } from '../entities/booking.ts';
import { BookingValidator } from '../validators/BookingValidator.ts';
import { NotFoundException, BusinessRuleException } from '../exceptions/DomainException.ts';
import { Room } from '../entities/room.ts';

export interface CreateBookingRequest {
    userId: string;
    hotelId: string;
    roomId: string;
    checkInDate: Date;
    checkOutDate: Date;
    totalPrice: number;
    guests: {
        type: 'adult' | 'child';
        count: number;
    };
}

export interface CreateBookingResponse {
    id: string;
    userId: string;
    hotelId: string;
    roomId: string;
    checkInDate: Date;
    checkOutDate: Date;
    totalPrice: number;
    guests: {
        type: 'adult' | 'child';
        count: number;
    };
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

@injectable()
export class CreateBookingUseCase {
    constructor(
        @inject('BookingRepository') private readonly bookingRepository: IBookingRepository,
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository,
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository
    ) {}

    async execute(request: CreateBookingRequest): Promise<CreateBookingResponse> {
        const booking: Booking = {
            userId: request.userId,
            hotelId: request.hotelId,
            roomId: request.roomId,
            checkInDate: request.checkInDate,
            checkOutDate: request.checkOutDate,
            totalPrice: request.totalPrice,
            guests: { type: request.guests.type, count: request.guests.count },
            status: 'pending',
        };

        BookingValidator.validateCreate(booking);

        const hotel = await this.hotelRepository.findById(request.hotelId);
        if (!hotel) {
            throw new NotFoundException('Hotel', request.hotelId);
        }

        const room = (await this.roomRepository.findById(request.roomId)) as Room | null;
        if (!room) {
            throw new NotFoundException('Room', request.roomId);
        }
        if (room.hotelId !== request.hotelId) {
            throw new BusinessRuleException('Room does not belong to the specified hotel');
        }

        const conflictingBookings = await this.bookingRepository.findByDateRange(
            request.checkInDate,
            request.checkOutDate
        );
        const roomBookings = conflictingBookings.filter(
            (b) => b.roomId === request.roomId && b.status !== 'cancelled'
        );
        if (roomBookings.length > 0) {
            throw new BusinessRuleException('Room is not available for the selected dates');
        }

        const stayDuration = request.checkOutDate.getTime() - request.checkInDate.getTime();
        const days = Math.ceil(stayDuration / (1000 * 60 * 60 * 24));
        const expectedPrice = room.basePrice * days;
        if (Math.abs(request.totalPrice - expectedPrice) > 1) {
            throw new BusinessRuleException(
                `Total price should be ${expectedPrice} for ${days} days`
            );
        }

        const createdBooking = await this.bookingRepository.create(booking);
        return createdBooking as unknown as CreateBookingResponse;
    }
}
