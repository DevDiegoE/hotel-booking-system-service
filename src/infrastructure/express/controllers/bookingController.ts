import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import mongoose from 'mongoose';

import { BookingService } from '../../../application/services/bookingService.ts';
import {
    ValidationException,
    NotFoundException,
    BusinessRuleException,
} from '../../../domain/exceptions/DomainException.ts';

type AuthUser = {
    _id?: unknown;
    id?: string;
    role?: string;
};

@injectable()
export class BookingController {
    constructor(@inject(BookingService) private readonly bookingService: BookingService) {}

    private param(req: Request, name: string): string {
        return String(req.params[name] || '');
    }

    create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const authUser = req.user as AuthUser | undefined;
            const userId = this.getAuthUserId(authUser);
            const booking = await this.bookingService.create({ ...req.body, userId });
            return res.status(201).json(booking);
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
            const bookings = await this.bookingService.findAll();
            return res.status(200).json(
                bookings.map((booking) => ({
                    ...booking,
                    id: booking._id || '',
                    canCancel: booking.status !== 'cancelled',
                }))
            );
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
                return res.status(400).json({ message: 'Invalid booking ID format' });
            }

            const booking = await this.bookingService.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            if (!this.canAccessBooking(req.user as AuthUser | undefined, booking.userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
            return res.status(200).json(booking);
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
            const id = this.param(req, 'id');

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid booking ID format' });
            }

            const authUser = req.user as AuthUser | undefined;
            const existing = await this.bookingService.findById(id);
            if (!existing) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            if (!this.isAdmin(authUser) && !this.canAccessBooking(authUser, existing.userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            if (!this.isAdmin(authUser) && !this.hasOnlyGuestEditableFields(req.body)) {
                return res
                    .status(403)
                    .json({ message: 'Guests can only edit dates and guest count' });
            }

            const updatedBooking = this.isAdmin(authUser)
                ? await this.bookingService.updateById(id, req.body)
                : await this.bookingService.updateGuestBooking(
                      id,
                      this.pickGuestEditableFields(req.body)
                  );
            if (!updatedBooking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            return res.status(200).json(updatedBooking);
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
            const id = this.param(req, 'id');

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid booking ID format' });
            }

            const booking = await this.bookingService.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            if (!this.canAccessBooking(req.user as AuthUser | undefined, booking.userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            const result = await this.bookingService.cancelBookingById(id);
            return res.status(200).json(result);
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
                    .json({ message: 'Cancellation not allowed', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByUserId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const userId = this.param(req, 'userId');
            if (!this.canAccessBooking(req.user as AuthUser | undefined, userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            const bookings = await this.bookingService.findByUserId(userId);
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByHotelId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByHotelId(this.param(req, 'hotelId'));
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByRoomType = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByRoomType(this.param(req, 'roomType'));
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByStatus = async (req: Request, res: Response): Promise<Response> => {
        try {
            const bookings = await this.bookingService.findByStatus(this.param(req, 'status'));
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
            if (error instanceof ValidationException || error instanceof BusinessRuleException) {
                return res.status(400).json({ message: 'Validation Error', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    checkAvailability = async (req: Request, res: Response): Promise<Response> => {
        try {
            const hotelId = this.param(req, 'hotelId');
            const { checkInDate, checkOutDate } = req.query;

            if (!checkInDate || !checkOutDate) {
                return res
                    .status(400)
                    .json({ message: 'Check-in and check-out dates are required' });
            }

            const availability = await this.bookingService.checkRoomAvailability(
                hotelId,
                new Date(checkInDate as string),
                new Date(checkOutDate as string)
            );

            return res.status(200).json(availability);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getUserBookingsWithDetails = async (req: Request, res: Response): Promise<Response> => {
        try {
            const userId = this.param(req, 'userId');
            if (!this.canAccessBooking(req.user as AuthUser | undefined, userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            const bookings = await this.bookingService.getUserBookingsWithDetails(userId);
            return res.status(200).json(bookings);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    canCancelBooking = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = this.param(req, 'id');
            const booking = await this.bookingService.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            if (!this.canAccessBooking(req.user as AuthUser | undefined, booking.userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            const result = await this.bookingService.canCancelBooking(id);
            return res.status(200).json(result);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    cancelBooking = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = this.param(req, 'id');

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid booking ID format' });
            }

            const booking = await this.bookingService.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            if (!this.canAccessBooking(req.user as AuthUser | undefined, booking.userId)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            const result = await this.bookingService.cancelBookingById(id);
            return res.status(200).json(result);
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
                    .json({ message: 'Cancellation not allowed', error: error.message });
            }
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    private getAuthUserId(user: AuthUser | undefined): string {
        return String(user?._id || user?.id || '');
    }

    private isAdmin(user: AuthUser | undefined): boolean {
        return user?.role === 'admin';
    }

    private canAccessBooking(user: AuthUser | undefined, bookingUserId: string): boolean {
        return this.isAdmin(user) || this.getAuthUserId(user) === bookingUserId;
    }

    private hasOnlyGuestEditableFields(body: Record<string, unknown>): boolean {
        const allowedFields = new Set(['checkInDate', 'checkOutDate', 'guests']);
        return Object.entries(body)
            .filter(([, value]) => value !== undefined)
            .every(([field]) => allowedFields.has(field));
    }

    private pickGuestEditableFields(body: Record<string, unknown>) {
        return {
            checkInDate: body.checkInDate as Date | undefined,
            checkOutDate: body.checkOutDate as Date | undefined,
            guests: body.guests as any,
        };
    }
}
