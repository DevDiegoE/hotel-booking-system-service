import { Request, Response } from 'express';

export function errorHandler(err: any, _req: Request, res: Response) {
    const status = err.status || 500;
    res.status(status).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
}
