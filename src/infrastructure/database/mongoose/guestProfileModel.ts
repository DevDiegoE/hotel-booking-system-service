import { Schema, model, Document } from 'mongoose';

export interface GuestProfileDocument extends Document {
    userId?: string;
    fullName: string;
    email: string;
    phone?: string;
    documentId?: string;
    country?: string;
    preferences?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const guestProfileSchema = new Schema<GuestProfileDocument>(
    {
        userId: { type: String, index: true },
        fullName: { type: String, required: true },
        email: { type: String, required: true, index: true },
        phone: { type: String },
        documentId: { type: String },
        country: { type: String },
        preferences: { type: String },
        notes: { type: String },
    },
    { timestamps: true, versionKey: false }
);

export const GuestProfileModel = model<GuestProfileDocument>(
    'GuestProfile',
    guestProfileSchema
);
