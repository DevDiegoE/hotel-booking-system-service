import { z } from 'zod';

export const hotelSchema = z.object({
    name: z.string().min(1, 'Hotel name is required'),
    location: z.string().min(1, 'Hotel location is required'),
    description: z.string().optional(),
});
