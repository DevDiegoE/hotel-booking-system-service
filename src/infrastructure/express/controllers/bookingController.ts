import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import mongoose from 'mongoose';

import { BookingService } from '../../../application/services/bookingService.ts';

@injectable()
export class BookingController {
    constructor(@inject(BookingService) private readonly bookingService: BookingService) {}

    create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const booking = await this.bookingService.create(req.body);
            return res.status(201).json(booking);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getAll = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findAll();
            return res.status(200).json(bookings);
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
                return res.status(400).json({ message: 'Invalid booking ID format' });
            }

            const booking = await this.bookingService.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            return res.status(200).json(booking);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    update = async (req: Request, res: Response): Promise<Response> => {
        try {
            const updatedBooking = await this.bookingService.updateById(req.params.id, req.body);
            if (!updatedBooking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            return res.status(200).json(updatedBooking);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    deleteById = async (req: Request, res: Response): Promise<Response> => {
        try {
            await this.bookingService.deleteById(req.params.id);
            return res.status(204).send();
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByUserId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByUserId(req.params.userId);
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByHotelId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByHotelId(req.params.hotelId);
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByRoomId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByRoomId(req.params.roomId);
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByStatus = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByStatus(req.params.status);
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByDateRange = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { checkInDate, checkOutDate } = req.query;
            if (!checkInDate || !checkOutDate) {
                return res
                    .status(400)
                    .json({ message: 'Check-in and check-out dates are required' });
            }

            const bookings = await this.bookingService.findByDateRange(
                new Date(checkInDate as string),
                new Date(checkOutDate as string)
            );
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };
}
