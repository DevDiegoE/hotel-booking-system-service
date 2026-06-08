import { Schema, model, Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partial' | 'refunded' | 'failed';

export interface PaymentDocument extends Document {
    bookingId: string;
    amount: number;
    currency: string;
    method: 'cash' | 'card' | 'bank-transfer' | 'online' | 'pay-link';
    status: PaymentStatus;
    provider?: 'mock' | 'stripe';
    providerPaymentIntentId?: string;
    clientSecret?: string;
    transactionRef?: string;
    cardLast4?: string;
    failureReason?: string;
    metadata?: Record<string, unknown>;
    paidAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
    {
        bookingId: { type: String, required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'USD' },
        method: {
            type: String,
            enum: ['cash', 'card', 'bank-transfer', 'online', 'pay-link'],
            default: 'card',
        },
        status: {
            type: String,
            enum: ['pending', 'authorized', 'paid', 'partial', 'refunded', 'failed'],
            default: 'pending',
        },
        provider: { type: String, enum: ['mock', 'stripe'], default: 'mock' },
        providerPaymentIntentId: { type: String, index: true },
        clientSecret: { type: String },
        transactionRef: { type: String },
        cardLast4: { type: String },
        failureReason: { type: String },
        metadata: { type: Schema.Types.Mixed },
        paidAt: { type: Date },
    },
    { timestamps: true, versionKey: false }
);

export const PaymentModel = model<PaymentDocument>('Payment', paymentSchema);
