/* global process */

process.env.NODE_ENV = 'test';
process.env.PAYMENT_PROVIDER = 'mock';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
