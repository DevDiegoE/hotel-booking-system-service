import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import mongoose from 'mongoose';

import { HotelService } from '../../../application/services/hotelService.ts';
import {
    ValidationException,
    NotFoundException,
    BusinessRuleException,
} from '../../../domain/exceptions/DomainException.ts';

@injectable()
export class HotelController {
    constructor(@inject(HotelService) private readonly hotelService: HotelService) {}

    private param(req: Request, name: string): string {
        return String(req.params[name] || '');
    }

    create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const hotel = await this.hotelService.create(req.body);
            return res.status(201).json(hotel);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({
                    message: 'Validation Error',
                    error: error.message,
                });
            }
            if (error instanceof BusinessRuleException) {
                return res.status(400).json({
                    message: 'Business Rule Violation',
                    error: error.message,
                });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getAll = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const hotels = await this.hotelService.findAll();
            return res.status(200).json(hotels);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = this.param(req, 'id');

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid hotel ID format' });
            }

            const hotel = await this.hotelService.findById(id);
            if (!hotel) {
                return res.status(404).json({ message: 'Hotel not found' });
            }
            return res.status(200).json(hotel);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({
                    message: 'Validation Error',
                    error: error.message,
                });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    update = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = this.param(req, 'id');

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid hotel ID format' });
            }

            const updatedHotel = await this.hotelService.updateById(id, req.body);
            if (!updatedHotel) {
                return res.status(404).json({ message: 'Hotel not found' });
            }
            return res.status(200).json(updatedHotel);
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({
                    message: 'Validation Error',
                    error: error.message,
                });
            }
            if (error instanceof NotFoundException) {
                return res.status(404).json({
                    message: 'Not Found',
                    error: error.message,
                });
            }
            if (error instanceof BusinessRuleException) {
                return res.status(400).json({
                    message: 'Business Rule Violation',
                    error: error.message,
                });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    deleteById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = this.param(req, 'id');

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid hotel ID format' });
            }

            await this.hotelService.deleteById(id);
            return res.status(204).send();
        } catch (error) {
            if (error instanceof ValidationException) {
                return res.status(400).json({
                    message: 'Validation Error',
                    error: error.message,
                });
            }
            if (error instanceof NotFoundException) {
                return res.status(404).json({
                    message: 'Not Found',
                    error: error.message,
                });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };
}
