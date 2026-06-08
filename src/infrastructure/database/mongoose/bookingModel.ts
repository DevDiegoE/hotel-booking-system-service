import { Schema, model, Document } from 'mongoose';
import { Booking } from '../../../domain/entities/booking.ts';

export interface BookingDocument extends Omit<Booking, '_id'>, Document {}

const bookingSchema = new Schema<BookingDocument>(
    {
        userId: { type: String, required: true },
        hotelId: { type: String, required: true, ref: 'Hotel' },
        roomSelections: [
            {
                roomType: {
                    type: String,
                    required: true,
                    enum: ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'],
                },
                quantity: { type: Number, required: true, min: 1 },
            },
        ],
        checkInDate: { type: Date, required: true },
        checkOutDate: { type: Date, required: true },
        totalPrice: { type: Number, required: true },
        guests: {
            type: {
                type: String,
                enum: ['adult', 'child'],
            },
            count: { type: Number, required: true },
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'checked-in', 'completed', 'no-show'],
            default: 'pending',
        },
        assignedRoomIds: { type: [String], default: [] },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'partial', 'paid', 'refunded'],
            default: 'unpaid',
        },
        source: {
            type: String,
            enum: ['direct', 'walk-in', 'booking.com', 'expedia', 'airbnb', 'other'],
            default: 'direct',
        },
        guestProfileId: { type: String },
        ratePlanId: { type: String },
        checkInAt: { type: Date },
        checkOutAt: { type: Date },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const BookingModel = model<BookingDocument>('Booking', bookingSchema);
