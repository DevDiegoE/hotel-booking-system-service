import { inject, injectable } from 'tsyringe';

import { IBookingRepository } from '../../domain/repositories/IBookingRepository.ts';
import { Booking } from '../../domain/entities/booking.ts';

@injectable()
export class BookingService {
    constructor(
        @inject('BookingRepository') private readonly bookingRepository: IBookingRepository
    ) {}

    async create(booking: Booking): Promise<Booking> {
        return this.bookingRepository.create(booking);
    }

    async findAll(): Promise<Booking[]> {
        return this.bookingRepository.findAll();
    }

    async findById(id: string): Promise<Booking | null> {
        return this.bookingRepository.findById(id);
    }

    async updateById(id: string, booking: Partial<Booking>): Promise<Booking | null> {
        return this.bookingRepository.update(id, booking);
    }

    async deleteById(id: string): Promise<void> {
        return this.bookingRepository.delete(id);
    }

    async findByUserId(userId: string): Promise<Booking[]> {
        return this.bookingRepository.findByUserId(userId);
    }

    async findByHotelId(hotelId: string): Promise<Booking[]> {
        return this.bookingRepository.findByHotelId(hotelId);
    }

    async findByRoomId(roomId: string): Promise<Booking[]> {
        return this.bookingRepository.findByRoomId(roomId);
    }

    async findByStatus(status: string): Promise<Booking[]> {
        return this.bookingRepository.findByStatus(status);
    }

    async findByDateRange(checkInDate: Date, checkOutDate: Date): Promise<Booking[]> {
        return this.bookingRepository.findByDateRange(checkInDate, checkOutDate);
    }
}
