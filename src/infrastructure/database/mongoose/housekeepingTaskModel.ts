import { Schema, model, Document } from 'mongoose';

export type HousekeepingStatus = 'open' | 'in-progress' | 'done' | 'blocked';

export interface HousekeepingTaskDocument extends Document {
    hotelId: string;
    physicalRoomId: string;
    title: string;
    status: HousekeepingStatus;
    priority: 'low' | 'normal' | 'high';
    assignedTo?: string;
    dueDate?: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const housekeepingTaskSchema = new Schema<HousekeepingTaskDocument>(
    {
        hotelId: { type: String, required: true, index: true },
        physicalRoomId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        status: {
            type: String,
            enum: ['open', 'in-progress', 'done', 'blocked'],
            default: 'open',
        },
        priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
        assignedTo: { type: String },
        dueDate: { type: Date },
        notes: { type: String },
    },
    { timestamps: true, versionKey: false }
);

export const HousekeepingTaskModel = model<HousekeepingTaskDocument>(
    'HousekeepingTask',
    housekeepingTaskSchema
);
