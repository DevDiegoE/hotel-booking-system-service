import { z } from 'zod';

export const promotionsSchema = z.object({
    name: z.string().min(1, 'Promotion name is required'),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['age-discount', 'family-discount'], 'Type is required'),
    rules: z.object({
        minAdults: z.number().int().min(0).optional(),
        freeChildrenUnderAge: z.number().int().min(0).optional(),
    }),
    startDate: z.coerce.date('Start date is required'),
    endDate: z.coerce.date('End date is required'),

    discountPercentage: z
        .number()
        .min(0, 'Discount must be at least 0%')
        .max(100, 'Discount cannot exceed 100%'),
});
