import 'reflect-metadata';
import '../config/container.ts';

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { swaggerDocs } from '../config/swagger.ts';
import { connectToDatabase } from '../config/mongoose.ts';
import passport from '../config/passport.ts';

import { logger } from './infrastructure/express/middlewares/logger.ts';
import { errorHandler } from './infrastructure/express/middlewares/errorHandler.ts';

import { hotelRoutes } from './infrastructure/express/routes/hotelRoutes.ts';
import { roomRoutes } from './infrastructure/express/routes/roomRoutes.ts';
import { bookingRoutes } from './infrastructure/express/routes/bookingRoutes.ts';
import { promotionRoutes } from './infrastructure/express/routes/promotionRoutes.ts';
import { authRoutes } from './infrastructure/express/routes/authRoutes.ts'


dotenv.config();

const app = express();
const routes = express.Router();

const PORT = process.env.PORT || 3000;
const API_PREFIX = '/api/v1';

app.use(express.json());
app.use(passport.initialize());
app.use(cors({ origin: '*' }));

app.use(logger);

app.get('/', (req, res) => {
    res.send('Welcome to the Hotel Booking System!');
});

routes.use('/auth', authRoutes)
routes.use('/hotels', hotelRoutes);
routes.use('/rooms', roomRoutes);
routes.use('/bookings', bookingRoutes);
routes.use('/promotions', promotionRoutes);

app.use(API_PREFIX, routes);

app.use(errorHandler);

const startServer = async () => {
    try {
        await connectToDatabase();
        swaggerDocs(app);
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
};

startServer();
