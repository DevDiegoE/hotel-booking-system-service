import { Schema, model, Document } from 'mongoose';
import { Room } from '../../../domain/entities/room.ts';

export interface RoomDocument extends Room, Document {}

const roomSchema = new Schema<RoomDocument>(
    {
        hotelId: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'],
        },
        basePrice: { type: Number, required: true },
        amenities: { type: [String], default: [] },
        capacity: { type: Number, required: true, min: 1 },
        totalRooms: { type: Number, required: true, min: 1 },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

roomSchema.index({ hotelId: 1 });
roomSchema.index({ basePrice: 1 });
roomSchema.index({ capacity: 1 });
roomSchema.index({ type: 1 });

export const RoomModel = model<RoomDocument>('Room', roomSchema);
