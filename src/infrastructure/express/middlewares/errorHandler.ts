import { Request, Response, NextFunction } from 'express';
import {
    ValidationException,
    NotFoundException,
    BusinessRuleException,
    DomainException,
} from '../../../domain/exceptions/DomainException.ts';

export const errorHandler = (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Error:', error);

    res.locals.errorMessage = error.message;

    if (error instanceof ValidationException) {
        res.status(400).json({
            message: 'Validation Error',
            error: error.message,
            type: 'VALIDATION_ERROR',
        });
        return;
    }

    if (error instanceof NotFoundException) {
        res.status(404).json({
            message: 'Not Found',
            error: error.message,
            type: 'NOT_FOUND',
        });
        return;
    }

    if (error instanceof BusinessRuleException) {
        res.status(400).json({
            message: 'Business Rule Violation',
            error: error.message,
            type: 'BUSINESS_RULE_VIOLATION',
        });
        return;
    }

    if (error instanceof DomainException) {
        res.status(400).json({
            message: 'Domain Error',
            error: error.message,
            type: 'DOMAIN_ERROR',
        });
        return;
    }

    if (error.name === 'ValidationError') {
        res.status(400).json({
            message: 'Validation Error',
            error: error.message,
            type: 'MONGOOSE_VALIDATION_ERROR',
        });
        return;
    }

    if (error.name === 'CastError') {
        res.status(400).json({
            message: 'Invalid ID format',
            error: 'The provided ID is not valid',
            type: 'INVALID_ID_FORMAT',
        });
        return;
    }

    if (error.name === 'MongoError' && (error as any).code === 11000) {
        res.status(409).json({
            message: 'Duplicate Entry',
            error: 'A record with this information already exists',
            type: 'DUPLICATE_ENTRY',
        });
        return;
    }

    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            message: 'Invalid Token',
            error: 'The provided token is invalid',
            type: 'INVALID_TOKEN',
        });
        return;
    }

    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            message: 'Token Expired',
            error: 'The provided token has expired',
            type: 'TOKEN_EXPIRED',
        });
        return;
    }

    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
        type: 'INTERNAL_SERVER_ERROR',
    });
};
