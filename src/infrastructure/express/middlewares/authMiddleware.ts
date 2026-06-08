import passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = passport.authenticate('jwt', { session: false });

export const requireRole = (role: 'admin' | 'user') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user as { role?: string } | undefined;

        if (!user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        if (user.role !== role) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }

        next();
    };
};
