import { Schema, model, Document } from 'mongoose';
import { Booking } from '../../../domain/entities/booking.ts';

export interface BookingDocument extends Booking, Document {}

const bookingSchema = new Schema<BookingDocument>({
    userId: { type: String, required: true },
    hotelId: { type: String, required: true, ref: 'Hotel' },
    roomId: { type: String, required: true, ref: 'Room' },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    guests: {
        type: {
            type: String,
            enum: ['adult', 'child'],
            required: true,
        },
        count: { type: Number, required: true },
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const BookingModel = model<BookingDocument>('Booking', bookingSchema);
