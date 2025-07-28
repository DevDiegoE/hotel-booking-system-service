import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { roomSchema } from '../validators/roomValidator.ts';
import { RoomController }from '../controllers/roomController.ts';

export const roomRoutes = Router();
const roomController = container.resolve(RoomController);

roomRoutes.post('/', validateRequest(roomSchema), roomController.create);
roomRoutes.get('/', roomController.getAll);
roomRoutes.get('/:id', roomController.getById);
roomRoutes.put('/:id', validateRequest(roomSchema.optional()), roomController.update);
roomRoutes.delete('/:id', roomController.deleteById);
