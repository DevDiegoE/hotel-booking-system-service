import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import mongoose from 'mongoose';

import { RoomService } from '../../../application/services/roomService.ts';
import {
    ValidationException,
    NotFoundException,
    BusinessRuleException,
} from '../../../domain/exceptions/DomainException.ts';

@injectable()
export class RoomController {
    constructor(@inject(RoomService) private readonly roomService: RoomService) {}

    create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const room = await this.roomService.create(req.body);
            return res.status(201).json(room);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({ message: 'Validation Error', error: error.message });
            }
            if (error instanceof BusinessRuleException) {
                return res
                    .status(400)
                    .json({ message: 'Business Rule Violation', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getAll = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const rooms = await this.roomService.findAll();
            return res.status(200).json(rooms);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid room ID format' });
            }

            const room = await this.roomService.findById(id);
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }
            return res.status(200).json(room);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({ message: 'Validation Error', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    update = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid room ID format' });
            }

            const updatedRoom = await this.roomService.updateById(id, req.body);
            if (!updatedRoom) {
                return res.status(404).json({ message: 'Room not found' });
            }
            return res.status(200).json(updatedRoom);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({ message: 'Validation Error', error: error.message });
            }
            if (error instanceof NotFoundException) {
                return res.status(404).json({ message: 'Not Found', error: error.message });
            }
            if (error instanceof BusinessRuleException) {
                return res
                    .status(400)
                    .json({ message: 'Business Rule Violation', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    deleteById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid room ID format' });
            }

            await this.roomService.deleteById(id);
            return res.status(204).send();
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({ message: 'Validation Error', error: error.message });
            }
            if (error instanceof NotFoundException) {
                return res.status(404).json({ message: 'Not Found', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    findByHotelId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const hotelId = req.params.hotelId;
            const rooms = await this.roomService.findByHotelId(hotelId);
            return res.status(200).json(rooms);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    findAvailableRooms = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { hotelId, checkInDate, checkOutDate } = req.query;

            if (!hotelId || !checkInDate || !checkOutDate) {
                return res.status(400).json({ message: 'Missing required query parameters' });
            }

            const rooms = await this.roomService.findAvailableRooms(
                hotelId as string,
                new Date(checkInDate as string),
                new Date(checkOutDate as string)
            );
            return res.status(200).json(rooms);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({ message: 'Validation Error', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    findByTypeAndHotelId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { type, hotelId } = req.query;

            if (!type || !hotelId) {
                return res.status(400).json({ message: 'Missing required query parameters' });
            }

            const rooms = await this.roomService.findByTypeAndHotelId(
                type as string,
                hotelId as string
            );
            return res.status(200).json(rooms);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    search = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { hotelId, location, minCapacity, minPrice, maxPrice, type } =
                req.query as Record<string, string>;
            const filters = {
                hotelId,
                location,
                minCapacity: minCapacity ? Number(minCapacity) : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                type: type as any,
            };
            const rooms = await this.roomService.search(filters);
            return res.status(200).json(rooms);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };
}
