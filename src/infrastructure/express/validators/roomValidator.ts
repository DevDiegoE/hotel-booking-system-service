import { z } from 'zod';

export const roomSchema = z.object({
    hotelId: z.string().min(1, 'hotelId is required'),
    type: z.enum(['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family']),
    basePrice: z.number().min(0, 'basePrice must be a positive number'),
    amenities: z.array(z.string()).optional(),
    capacity: z.number().int().min(1, 'capacity must be at least 1'),
    totalRooms: z.number().int().min(1, 'totalRooms must be at least 1'),
});
