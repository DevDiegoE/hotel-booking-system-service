import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.ts';
import { bookingSchema } from '../validators/bookingValidator.ts';
import { BookingController } from '../controllers/bookingController.ts';

export const bookingRoutes = Router();
const bookingController = container.resolve(BookingController);

bookingRoutes.post('/', authMiddleware, validateRequest(bookingSchema), bookingController.create);
bookingRoutes.get('/', authMiddleware, requireRole('admin'), bookingController.getAll);
bookingRoutes.get('/user/:userId', authMiddleware, bookingController.getByUserId);
bookingRoutes.get('/user/:userId/details', authMiddleware, bookingController.getUserBookingsWithDetails);
bookingRoutes.get('/hotel/:hotelId', authMiddleware, requireRole('admin'), bookingController.getByHotelId);
bookingRoutes.get('/room-type/:roomType', authMiddleware, requireRole('admin'), bookingController.getByRoomType);
bookingRoutes.get('/status/:status', authMiddleware, requireRole('admin'), bookingController.getByStatus);
bookingRoutes.get('/date-range', authMiddleware, requireRole('admin'), bookingController.getByDateRange);
bookingRoutes.get('/availability/:hotelId', bookingController.checkAvailability);
bookingRoutes.get('/:id/can-cancel', authMiddleware, bookingController.canCancelBooking);
bookingRoutes.patch('/:id/cancel', authMiddleware, bookingController.cancelBooking);
bookingRoutes.get('/:id', authMiddleware, bookingController.getById);
bookingRoutes.put(
    '/:id',
    authMiddleware,
    validateRequest(bookingSchema.partial()),
    bookingController.update
);
bookingRoutes.delete('/:id', authMiddleware, bookingController.deleteById);
