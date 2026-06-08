import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.ts';
import { roomSchema } from '../validators/roomValidator.ts';
import { RoomController } from '../controllers/roomController.ts';

export const roomRoutes = Router();
const roomController = container.resolve(RoomController);

roomRoutes.post(
    '/',
    authMiddleware,
    requireRole('admin'),
    validateRequest(roomSchema),
    roomController.create
);
roomRoutes.get('/', roomController.getAll);
roomRoutes.get('/search', roomController.search);
roomRoutes.get('/available', roomController.findAvailableRooms);
roomRoutes.get('/by-type', roomController.findByTypeAndHotelId);
roomRoutes.get('/hotel/:hotelId', roomController.findByHotelId);
roomRoutes.get('/:id', roomController.getById);
roomRoutes.put(
    '/:id',
    authMiddleware,
    requireRole('admin'),
    validateRequest(roomSchema.partial()),
    roomController.update
);
roomRoutes.delete('/:id', authMiddleware, requireRole('admin'), roomController.deleteById);
