import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.ts';

import { hotelSchema } from '../validators/hotelValidator.ts';
import { HotelController } from '../controllers/hotelController.ts';

export const hotelRoutes = Router();
const hotelController = container.resolve(HotelController);

hotelRoutes.post(
    '/',
    authMiddleware,
    requireRole('admin'),
    validateRequest(hotelSchema),
    hotelController.create
);
hotelRoutes.get('/', hotelController.getAll);
hotelRoutes.get('/locations', async (_req, res) => {
    try {
        const { HotelModel } = await import('../../database/mongoose/hotelModel.ts');
        const locations = await HotelModel.distinct('location');
        res.status(200).json(locations);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: (error as Error).message });
    }
});
hotelRoutes.get('/:id', hotelController.getById);
hotelRoutes.put(
    '/:id',
    authMiddleware,
    requireRole('admin'),
    validateRequest(hotelSchema.partial()),
    hotelController.update
);
hotelRoutes.delete('/:id', authMiddleware, requireRole('admin'), hotelController.deleteById);
