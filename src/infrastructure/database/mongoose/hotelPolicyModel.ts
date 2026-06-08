import { Schema, model, Document } from 'mongoose';

export interface HotelPolicyDocument extends Document {
    hotelId: string;
    checkInTime: string;
    checkOutTime: string;
    cancellationHours: number;
    cancellationFeePercentage: number;
    childrenPolicy: string;
    petPolicy: string;
    taxPercentage: number;
    extraGuestFee: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const hotelPolicySchema = new Schema<HotelPolicyDocument>(
    {
        hotelId: { type: String, required: true, unique: true },
        checkInTime: { type: String, default: '15:00' },
        checkOutTime: { type: String, default: '11:00' },
        cancellationHours: { type: Number, default: 48 },
        cancellationFeePercentage: { type: Number, default: 50 },
        childrenPolicy: { type: String, default: 'Children are welcome with adult supervision.' },
        petPolicy: { type: String, default: 'Pets are not allowed unless approved by the property.' },
        taxPercentage: { type: Number, default: 13 },
        extraGuestFee: { type: Number, default: 0 },
    },
    { timestamps: true, versionKey: false }
);

export const HotelPolicyModel = model<HotelPolicyDocument>('HotelPolicy', hotelPolicySchema);
