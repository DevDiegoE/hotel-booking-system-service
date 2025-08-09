import { z } from 'zod';

export const authSchema = z.object({
    email: z.email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'admin']).optional(),
});
