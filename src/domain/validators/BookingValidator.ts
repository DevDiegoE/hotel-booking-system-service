import { Booking } from '../entities/booking.ts';
import { ValidationException, BusinessRuleException } from '../exceptions/DomainException.ts';

export class BookingValidator {
    static validateCreate(booking: Booking): void {
        if (!booking.userId || booking.userId.trim().length === 0) {
            throw new ValidationException('User ID is required');
        }

        if (!booking.hotelId || booking.hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }

        if (!booking.roomSelections || booking.roomSelections.length === 0) {
            throw new ValidationException('Room selections are required');
        }

        booking.roomSelections.forEach((selection, index) => {
            if (!selection.roomType || selection.roomType.trim().length === 0) {
                throw new ValidationException(`Room type is required for selection ${index + 1}`);
            }

            if (!selection.quantity || selection.quantity < 1) {
                throw new ValidationException(
                    `Quantity must be at least 1 for selection ${index + 1}`
                );
            }
        });

        if (!booking.checkInDate) {
            throw new ValidationException('Check-in date is required');
        }

        if (!booking.checkOutDate) {
            throw new ValidationException('Check-out date is required');
        }

        if (booking.checkInDate >= booking.checkOutDate) {
            throw new BusinessRuleException('Check-out date must be after check-in date');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (booking.checkInDate < today) {
            throw new BusinessRuleException('Check-in date cannot be in the past');
        }

        if (booking.totalPrice <= 0) {
            throw new ValidationException('Total price must be greater than zero');
        }

        if (booking.totalPrice > 10000) {
            throw new BusinessRuleException('Total price cannot exceed $10,000');
        }

        if (
            !booking.guests ||
            typeof booking.guests.count !== 'number' ||
            booking.guests.count <= 0
        ) {
            throw new ValidationException('At least one guest is required');
        }

        if (booking.guests.count > 10) {
            throw new BusinessRuleException('Maximum 10 guests allowed per booking');
        }

        // Validate stay duration (max 30 days)
        const stayDuration = booking.checkOutDate.getTime() - booking.checkInDate.getTime();
        const maxStayDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        if (stayDuration > maxStayDuration) {
            throw new BusinessRuleException('Maximum stay duration is 30 days');
        }
    }

    static validateUpdate(booking: Partial<Booking>): void {
        if (booking.checkInDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const checkInDate = new Date(booking.checkInDate);
            checkInDate.setHours(0, 0, 0, 0);
            if (checkInDate < today) {
                throw new BusinessRuleException('Check-in date cannot be in the past');
            }
        }

        if (booking.checkInDate && booking.checkOutDate) {
            if (booking.checkInDate >= booking.checkOutDate) {
                throw new BusinessRuleException('Check-out date must be after check-in date');
            }
        }

        if (booking.totalPrice !== undefined && booking.totalPrice <= 0) {
            throw new ValidationException('Total price must be greater than zero');
        }

        if (booking.totalPrice !== undefined && booking.totalPrice > 10000) {
            throw new BusinessRuleException('Total price cannot exceed $10,000');
        }

        if (
            booking.guests &&
            typeof booking.guests.count === 'number' &&
            booking.guests.count <= 0
        ) {
            throw new ValidationException('At least one guest is required');
        }

        if (
            booking.guests &&
            typeof booking.guests.count === 'number' &&
            booking.guests.count > 10
        ) {
            throw new BusinessRuleException('Maximum 10 guests allowed per booking');
        }

        if (
            booking.status &&
            !['pending', 'confirmed', 'cancelled', 'checked-in', 'completed', 'no-show'].includes(
                booking.status
            )
        ) {
            throw new ValidationException('Invalid booking status');
        }
    }

    static validateCancellation(booking: Booking): void {
        if (booking.status === 'cancelled') {
            throw new BusinessRuleException('Booking is already cancelled');
        }

        const today = new Date();
        const checkInDate = new Date(booking.checkInDate);
        const daysUntilCheckIn = Math.ceil(
            (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilCheckIn < 1) {
            throw new BusinessRuleException('Cannot cancel booking within 24 hours of check-in');
        }
    }
}
