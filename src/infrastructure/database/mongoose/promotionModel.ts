import { Schema, model, Document } from 'mongoose';
import { Promotion } from '../../../domain/entities/promotion.ts';

export interface PromotionDocument extends Promotion, Document {}

const promotionSchema = new Schema<PromotionDocument>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: ['age-discount', 'family-discount'],
            required: true,
        },
        rules: {
            minAdults: { type: Number, default: 0 },
            freeChildrenUnderAge: { type: Number, default: 0 },
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        discountPercentage: { type: Number, required: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const PromotionModel = model<PromotionDocument>('Promotion', promotionSchema);
