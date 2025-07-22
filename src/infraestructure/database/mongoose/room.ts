import { Schema, model, Document } from 'mongoose';
import { Room } from '../../../domain/entities/room.ts';

export interface RoomDocument extends Room, Document {}

const roomSchema = new Schema<RoomDocument>({
    type: {
        type: String,
        required: true,
        enum: ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'],
    },
    basePrice: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const RoomModel = model<RoomDocument>('Room', roomSchema);
