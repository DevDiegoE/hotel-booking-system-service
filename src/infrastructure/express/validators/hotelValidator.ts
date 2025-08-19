import { z } from 'zod';

export const hotelSchema = z.object({
    name: z.string().min(1, 'Hotel name is required'),
    location: z.string().min(1, 'Hotel location is required'),
    description: z.string().optional(),
    rating: z.number().min(0, 'Rating must be at least 0').max(5, 'Rating must not exceed 5').optional(),
    imageUrl: z.url('Image URL must be a valid URL').optional(),
});
