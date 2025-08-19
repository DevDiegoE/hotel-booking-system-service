import { Schema, model, Document } from 'mongoose';
import { Hotel } from '../../../domain/entities/hotel.ts';

export interface HotelDocument extends Hotel, Document {}

const hotelSchema = new Schema<HotelDocument>(
    {
        name: { type: String, required: true },
        location: { type: String, required: true },
        description: { type: String, default: '' },
        rating : { type: Number, min: 0, max: 5, default: 0 },
        imageUrl: { type: String, default: '' },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const HotelModel = model<HotelDocument>('Hotel', hotelSchema);
