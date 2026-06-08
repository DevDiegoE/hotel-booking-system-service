import { z } from 'zod';

export const bookingSchema = z.object({
    userId: z.string().min(1, 'userId is required').optional(),
    hotelId: z.string().min(1, 'hotelId is required'),
    roomSelections: z
        .array(
            z.object({
                roomType: z.enum(['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family']),
                quantity: z.number().int().min(1, 'Room quantity must be at least 1'),
            })
        )
        .min(1, 'At least one room selection is required'),
    checkInDate: z.coerce.date('checkInDate is required'),
    checkOutDate: z.coerce.date('checkOutDate is required'),
    totalPrice: z.number().min(0, 'totalPrice must be a positive number'),

    guests: z.object({
        type: z.enum(['adult', 'child']),
        count: z.number().int().min(1, 'At least one guest is required'),
    }),

    appliedPromotions: z.array(z.string()).optional(),

    status: z
        .enum(['pending', 'confirmed', 'cancelled', 'checked-in', 'completed', 'no-show'])
        .optional(),
});
