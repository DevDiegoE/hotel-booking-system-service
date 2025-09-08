import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { bookingSchema } from '../validators/bookingValidator.ts';
import { BookingController } from '../controllers/bookingController.ts';

export const bookingRoutes = Router();
const bookingController = container.resolve(BookingController);

bookingRoutes.post('/', authMiddleware, validateRequest(bookingSchema), bookingController.create);
bookingRoutes.get('/', bookingController.getAll);
bookingRoutes.get('/:id', bookingController.getById);
bookingRoutes.put(
    '/:id',
    authMiddleware,
    validateRequest(bookingSchema.optional()),
    bookingController.update
);
bookingRoutes.delete('/:id', authMiddleware, bookingController.deleteById);

bookingRoutes.get('/user/:userId', bookingController.getByUserId);
bookingRoutes.get('/user/:userId/details', bookingController.getUserBookingsWithDetails);
bookingRoutes.get('/:id/can-cancel', bookingController.canCancelBooking);
bookingRoutes.patch('/:id/cancel', authMiddleware, bookingController.cancelBooking);
bookingRoutes.get('/hotel/:hotelId', bookingController.getByHotelId);
bookingRoutes.get('/room-type/:roomType', bookingController.getByRoomType);
bookingRoutes.get('/status/:status', bookingController.getByStatus);
bookingRoutes.get('/date-range', bookingController.getByDateRange);
bookingRoutes.get('/availability/:hotelId', bookingController.checkAvailability);
