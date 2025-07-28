import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

import { hotelSchema } from '../validators/hotelValidator.ts';
import { HotelController }from '../controllers/hotelController.ts';

export const hotelRoutes = Router();
const hotelController = container.resolve(HotelController);

hotelRoutes.post('/', authMiddleware, validateRequest(hotelSchema), hotelController.create);
hotelRoutes.get('/', hotelController.getAll);
hotelRoutes.get('/:id', hotelController.getById);
hotelRoutes.put('/:id', authMiddleware, validateRequest(hotelSchema.partial()), hotelController.update);
hotelRoutes.delete('/:id', authMiddleware, hotelController.deleteById);
