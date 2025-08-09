import morgan from 'morgan';
import type { Request, Response } from 'express';

morgan.token('status-level', (_req: Request, res: Response) => {
    const status = res.statusCode;
    if (status >= 500) return 'error';
    if (status >= 400) return 'fail';
    return 'success';
});

morgan.token('error-message', (_req: Request, res: Response) => {
    return (res.locals && res.locals.errorMessage) || '-';
});

morgan.token('user', (req: any) => {
    const user = (req as any).user;
    return user && (user.id || user._id) ? String(user.id || user._id) : '-';
});

const format =
    ':remote-addr - :method :url :status (:status-level) :response-time ms - :res[content-length] user=:user :error-message';

export const logger = morgan(format);
