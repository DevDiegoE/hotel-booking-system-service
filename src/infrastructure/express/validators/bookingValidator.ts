import { z } from 'zod';

export const bookingSchema = z.object({
    userId: z.string().min(1, 'userId is required'),
    hotelId: z.string().min(1, 'hotelId is required'),
    roomId: z.string().min(1, 'roomId is required'),
    checkInDate: z.coerce.date('checkInDate is required'),
    checkOutDate: z.coerce.date('checkOutDate is required' ),
    totalPrice: z.number().min(0, 'totalPrice must be a positive number'),

    guests: z.object({
        type: z.enum(['adult', 'child'], ),
        count: z.number().int().min(1, 'At least one guest is required'),
    }),

    status: z.enum(['pending', 'confirmed', 'cancelled'], 'Status is required').default('pending'),
});
