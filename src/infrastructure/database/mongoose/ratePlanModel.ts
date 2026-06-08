import { Schema, model, Document } from 'mongoose';

export interface RatePlanDocument extends Document {
    hotelId: string;
    name: string;
    roomType?: 'single-1' | 'single-2' | 'single-3' | 'suite-2' | 'suite-family';
    refundable: boolean;
    breakfastIncluded: boolean;
    weekdayMultiplier: number;
    weekendMultiplier: number;
    minNights: number;
    startDate?: Date;
    endDate?: Date;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const ratePlanSchema = new Schema<RatePlanDocument>(
    {
        hotelId: { type: String, required: true, index: true },
        name: { type: String, required: true },
        roomType: {
            type: String,
            enum: ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'],
        },
        refundable: { type: Boolean, default: true },
        breakfastIncluded: { type: Boolean, default: false },
        weekdayMultiplier: { type: Number, default: 1 },
        weekendMultiplier: { type: Number, default: 1.15 },
        minNights: { type: Number, default: 1 },
        startDate: { type: Date },
        endDate: { type: Date },
        active: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false }
);

export const RatePlanModel = model<RatePlanDocument>('RatePlan', ratePlanSchema);
