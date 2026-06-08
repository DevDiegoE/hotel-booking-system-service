import { Schema, model, Document } from 'mongoose';

export interface NotificationOutboxDocument extends Document {
    bookingId: string;
    userId?: string;
    email: string;
    type: 'booking-confirmation' | 'payment-receipt' | 'payment-pending';
    subject: string;
    body: string;
    status: 'queued' | 'sent' | 'failed';
    provider?: 'mock-email' | 'smtp';
    sentAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const notificationOutboxSchema = new Schema<NotificationOutboxDocument>(
    {
        bookingId: { type: String, required: true, index: true },
        userId: { type: String, index: true },
        email: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: ['booking-confirmation', 'payment-receipt', 'payment-pending'],
            required: true,
        },
        subject: { type: String, required: true },
        body: { type: String, required: true },
        status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
        provider: { type: String, enum: ['mock-email', 'smtp'], default: 'mock-email' },
        sentAt: { type: Date },
    },
    { timestamps: true, versionKey: false }
);

export const NotificationOutboxModel = model<NotificationOutboxDocument>(
    'NotificationOutbox',
    notificationOutboxSchema
);
