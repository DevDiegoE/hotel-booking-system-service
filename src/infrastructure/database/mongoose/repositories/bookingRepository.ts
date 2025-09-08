import { injectable } from 'tsyringe';

import { IBookingRepository } from '../../../../domain/repositories/IBookingRepository.ts';
import { Booking } from '../../../../domain/entities/booking.ts';
import { BookingModel } from '../bookingModel.ts';

@injectable()
export class BookingRepository implements IBookingRepository {
    async create(booking: Booking): Promise<Booking> {
        const created = await BookingModel.create(booking);
        return created.toObject() as Booking;
    }

    async findAll(): Promise<Booking[]> {
        const bookings = await BookingModel.find();
        return bookings.map((booking) => booking.toObject() as Booking);
    }

    async findById(id: string): Promise<Booking | null> {
        const booking = await BookingModel.findById(id);
        return booking ? (booking.toObject() as Booking) : null;
    }

    async update(id: string, booking: Partial<Booking>): Promise<Booking | null> {
        const updated = await BookingModel.findByIdAndUpdate(id, booking, { new: true });
        return updated ? (updated.toObject() as Booking) : null;
    }

    async delete(id: string): Promise<void> {
        await BookingModel.findByIdAndDelete(id);
    }

    async findByUserId(userId: string): Promise<Booking[]> {
        const bookings = await BookingModel.find({ userId });
        return bookings.map((booking) => booking.toObject() as Booking);
    }

    async findByHotelId(hotelId: string): Promise<Booking[]> {
        const bookings = await BookingModel.find({ hotelId });
        return bookings.map((booking) => booking.toObject() as Booking);
    }

    async findByRoomType(roomType: string): Promise<Booking[]> {
        const bookings = await BookingModel.find({ roomType });
        return bookings.map((booking) => booking.toObject() as Booking);
    }

    async findByStatus(status: string): Promise<Booking[]> {
        const bookings = await BookingModel.find({ status });
        return bookings.map((booking) => booking.toObject() as Booking);
    }

    async findByDateRange(checkInDate: Date, checkOutDate: Date): Promise<Booking[]> {
        const bookings = await BookingModel.find({
            $or: [
                {
                    checkInDate: { $lt: checkOutDate },
                    checkOutDate: { $gt: checkInDate },
                },
            ],
        });
        return bookings.map((booking) => booking.toObject() as Booking);
    }
}
