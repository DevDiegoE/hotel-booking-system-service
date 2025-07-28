import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { hotelSchema } from '../validators/hotelValidator.ts';
import { HotelController }from '../controllers/hotelController.ts';

export const hotelRoutes = Router();
const hotelController = container.resolve(HotelController);

hotelRoutes.post('/', validateRequest(hotelSchema), hotelController.create);
hotelRoutes.get('/', hotelController.getAll);
hotelRoutes.get('/:id', hotelController.getById);
hotelRoutes.put('/:id', validateRequest(hotelSchema.partial()), hotelController.update);
hotelRoutes.delete('/:id', hotelController.deleteById);
