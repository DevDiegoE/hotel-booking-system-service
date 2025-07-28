import { ICrudRepository } from './ICrudRepository.ts';
import { Booking } from '../entities/booking.ts';

export interface IBookingRepository extends ICrudRepository<Booking> {
    findByUserId(userId: string): Promise<Booking[]>;
    findByHotelId(hotelId: string): Promise<Booking[]>;
    findByRoomId(roomId: string): Promise<Booking[]>;
    findByStatus(status: string): Promise<Booking[]>;
    findByDateRange(checkInDate: Date, checkOutDate: Date): Promise<Booking[]>;
}
