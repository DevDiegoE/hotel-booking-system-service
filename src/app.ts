import 'reflect-metadata';
import '../config/container.ts';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import { swaggerDocs } from '../config/swagger.ts';
import { connectToDatabase } from '../config/mongoose.ts';
import passport from '../config/passport.ts';
import { allowedCorsOrigins, port } from '../config/env.ts';

import { logger } from './infrastructure/express/middlewares/logger.ts';
import { errorHandler } from './infrastructure/express/middlewares/errorHandler.ts';

import { hotelRoutes } from './infrastructure/express/routes/hotelRoutes.ts';
import { roomRoutes } from './infrastructure/express/routes/roomRoutes.ts';
import { bookingRoutes } from './infrastructure/express/routes/bookingRoutes.ts';
import { promotionRoutes } from './infrastructure/express/routes/promotionRoutes.ts';
import { authRoutes } from './infrastructure/express/routes/authRoutes.ts'
import { operationsRoutes } from './infrastructure/express/routes/operationsRoutes.ts';

const app = express();
const routes = express.Router();

const API_PREFIX = '/api/v1';
const corsOrigins = allowedCorsOrigins();

app.use(
    express.json({
        limit: '1mb',
        verify: (req, _res, buffer) => {
            const request = req as express.Request & { rawBody?: Buffer };
            if (request.originalUrl === `${API_PREFIX}/operations/payments/webhook`) {
                request.rawBody = Buffer.from(buffer);
            }
        },
    })
);
app.use(passport.initialize());
app.use(
    cors({
        origin:
            corsOrigins === '*'
                ? '*'
                : (origin, callback) => {
                      if (!origin || corsOrigins.includes(origin)) {
                          callback(null, true);
                          return;
                      }
                      callback(new Error('Not allowed by CORS'));
                  },
        credentials: corsOrigins !== '*',
    })
);

app.use(logger);

app.get('/', (req, res) => {
    res.send('Welcome to the Hotel Booking System!');
});

const health = (_req: express.Request, res: express.Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    const healthy = dbState === 1;

    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        database: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};

app.get('/health', health);

routes.use('/auth', authRoutes)
routes.use('/hotels', hotelRoutes);
routes.use('/rooms', roomRoutes);
routes.use('/bookings', bookingRoutes);
routes.use('/promotions', promotionRoutes);
routes.use('/operations', operationsRoutes);
routes.get('/health', health);

app.use(API_PREFIX, routes);

app.use(errorHandler);

const startServer = async () => {
    try {
        await connectToDatabase();
        swaggerDocs(app);
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
};

startServer();
