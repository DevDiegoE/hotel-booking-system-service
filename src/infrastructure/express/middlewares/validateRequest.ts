import { Request, Response, NextFunction } from 'express';
import { z, ZodType } from 'zod';

export const validateRequest =
    <T extends ZodType<any, any, any>>(schema: T) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: 'Validation Error',
                errors: z.treeifyError(result.error),
            });
        }

        req.body = result.data;
        next();
    };
