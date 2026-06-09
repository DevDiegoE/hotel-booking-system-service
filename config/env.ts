import dotenv from 'dotenv';

dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';
export const port = process.env.PORT || 3000;

export const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.trim().length > 0) {
        return secret;
    }

    if (isProduction) {
        throw new Error('JWT_SECRET is required in production');
    }

    return 'development-secret';
};

export const allowedCorsOrigins = (): string[] | '*' => {
    const raw = process.env.CORS_ORIGIN?.trim();

    if (!raw) {
        return isProduction ? [] : '*';
    }

    if (raw === '*') {
        if (isProduction) {
            throw new Error('CORS_ORIGIN cannot be "*" in production');
        }
        return '*';
    }

    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
};

export const requireStripeConfig = (): void => {
    if (process.env.PAYMENT_PROVIDER !== 'stripe') {
        return;
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER=stripe');
    }

    if (isProduction && !process.env.PAYMENT_WEBHOOK_SECRET) {
        throw new Error('PAYMENT_WEBHOOK_SECRET is required for Stripe in production');
    }
};
