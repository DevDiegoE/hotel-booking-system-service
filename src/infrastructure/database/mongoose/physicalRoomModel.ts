import { Schema, model, Document } from 'mongoose';

export type PhysicalRoomStatus = 'available' | 'occupied' | 'dirty' | 'clean' | 'maintenance';

export interface PhysicalRoomDocument extends Document {
    hotelId: string;
    roomType: 'single-1' | 'single-2' | 'single-3' | 'suite-2' | 'suite-family';
    roomNumber: string;
    floor: number;
    status: PhysicalRoomStatus;
    notes?: string;
    currentBookingId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const physicalRoomSchema = new Schema<PhysicalRoomDocument>(
    {
        hotelId: { type: String, required: true, index: true },
        roomType: {
            type: String,
            required: true,
            enum: ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'],
        },
        roomNumber: { type: String, required: true },
        floor: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ['available', 'occupied', 'dirty', 'clean', 'maintenance'],
            default: 'available',
        },
        notes: { type: String },
        currentBookingId: { type: String },
    },
    { timestamps: true, versionKey: false }
);

physicalRoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
physicalRoomSchema.index({ hotelId: 1, roomType: 1, status: 1 });

export const PhysicalRoomModel = model<PhysicalRoomDocument>(
    'PhysicalRoom',
    physicalRoomSchema
);
