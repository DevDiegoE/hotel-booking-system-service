import { inject, injectable } from 'tsyringe';

import { IBookingRepository } from '../../domain/repositories/IBookingRepository.ts';
import { Booking } from '../../domain/entities/booking.ts';
import {
    ValidationException,
    NotFoundException,
    BusinessRuleException,
} from '../../domain/exceptions/DomainException.ts';
import { BookingValidator } from '../../domain/validators/BookingValidator.ts';
import { CreateBookingUseCase } from '../../domain/use-cases/CreateBookingUseCase.ts';
import { UpdateBookingUseCase } from '../../domain/use-cases/UpdateBookingUseCase.ts';

@injectable()
export class BookingService {
    constructor(
        @inject('BookingRepository') private readonly bookingRepository: IBookingRepository,
        @inject(CreateBookingUseCase) private readonly createBookingUseCase: CreateBookingUseCase,
        @inject(UpdateBookingUseCase) private readonly updateBookingUseCase: UpdateBookingUseCase
    ) {}

    async create(booking: Booking): Promise<Booking> {
        return (await this.createBookingUseCase.execute(booking as any)) as unknown as Booking;
    }

    async findAll(): Promise<Booking[]> {
        return this.bookingRepository.findAll();
    }

    async findById(id: string): Promise<Booking | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }
        return this.bookingRepository.findById(id);
    }

    async updateById(id: string, booking: Partial<Booking>): Promise<Booking | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }
        BookingValidator.validateUpdate(booking);
        return this.updateBookingUseCase.execute({
            id,
            data: booking,
        }) as unknown as Promise<Booking | null>;
    }

    async deleteById(id: string): Promise<void> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }
        const exists = await this.bookingRepository.findById(id);
        if (!exists) {
            throw new NotFoundException('Booking', id);
        }
        return this.bookingRepository.delete(id);
    }

    async findByUserId(userId: string): Promise<Booking[]> {
        if (!userId || userId.trim().length === 0) {
            throw new ValidationException('User ID is required');
        }
        return this.bookingRepository.findByUserId(userId);
    }

    async findByHotelId(hotelId: string): Promise<Booking[]> {
        if (!hotelId || hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }
        return this.bookingRepository.findByHotelId(hotelId);
    }

    async findByRoomId(roomId: string): Promise<Booking[]> {
        if (!roomId || roomId.trim().length === 0) {
            throw new ValidationException('Room ID is required');
        }
        return this.bookingRepository.findByRoomId(roomId);
    }

    async findByStatus(status: string): Promise<Booking[]> {
        if (!status) {
            throw new ValidationException('Status is required');
        }
        return this.bookingRepository.findByStatus(status);
    }

    async findByDateRange(checkInDate: Date, checkOutDate: Date): Promise<Booking[]> {
        if (!checkInDate || !checkOutDate) {
            throw new ValidationException('Check-in and check-out dates are required');
        }
        if (checkInDate >= checkOutDate) {
            throw new BusinessRuleException('Check-out date must be after check-in date');
        }
        return this.bookingRepository.findByDateRange(checkInDate, checkOutDate);
    }
}
