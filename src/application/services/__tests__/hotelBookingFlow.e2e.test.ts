import 'reflect-metadata';

import { BookingService } from '../bookingService.ts';
import { CreateBookingUseCase } from '../../../domain/use-cases/CreateBookingUseCase.ts';
import { UpdateBookingUseCase } from '../../../domain/use-cases/UpdateBookingUseCase.ts';
import { Booking } from '../../../domain/entities/booking.ts';
import { BusinessRuleException } from '../../../domain/exceptions/DomainException.ts';

const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

class InMemoryBookingRepository {
    private bookings: Booking[] = [];
    private nextId = 1;

    async create(booking: Booking): Promise<Booking> {
        const created = {
            _id: `booking-${this.nextId++}`,
            ...booking,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.bookings.push(created);
        return created;
    }

    async findAll(): Promise<Booking[]> {
        return this.bookings;
    }

    async findById(id: string): Promise<Booking | null> {
        return this.bookings.find((booking) => booking._id === id) || null;
    }

    async update(id: string, booking: Partial<Booking>): Promise<Booking | null> {
        const index = this.bookings.findIndex((item) => item._id === id);
        if (index === -1) return null;
        this.bookings[index] = { ...this.bookings[index], ...booking, updatedAt: new Date() };
        return this.bookings[index];
    }

    async delete(id: string): Promise<void> {
        this.bookings = this.bookings.filter((booking) => booking._id !== id);
    }

    async findByUserId(userId: string): Promise<Booking[]> {
        return this.bookings.filter((booking) => booking.userId === userId);
    }

    async findByHotelId(hotelId: string): Promise<Booking[]> {
        return this.bookings.filter((booking) => booking.hotelId === hotelId);
    }

    async findByRoomType(roomType: string): Promise<Booking[]> {
        return this.bookings.filter((booking) =>
            booking.roomSelections.some((selection) => selection.roomType === roomType)
        );
    }

    async findByStatus(status: string): Promise<Booking[]> {
        return this.bookings.filter((booking) => booking.status === status);
    }

    async findByDateRange(checkInDate: Date, checkOutDate: Date): Promise<Booking[]> {
        return this.bookings.filter(
            (booking) => booking.checkInDate < checkOutDate && booking.checkOutDate > checkInDate
        );
    }
}

describe('hotel booking e2e flow', () => {
    it('checks availability, creates a booking, prevents overbooking, and cancels', async () => {
        const bookingRepository = new InMemoryBookingRepository();
        const hotelRepository = {
            findById: jest.fn().mockResolvedValue({
                _id: 'hotel-1',
                name: 'Jala Suites',
                location: 'Cochabamba',
            }),
        };
        const roomRepository = {
            findByHotelId: jest.fn().mockResolvedValue([
                {
                    _id: 'room-type-1',
                    hotelId: 'hotel-1',
                    type: 'suite-2',
                    basePrice: 150,
                    amenities: ['wifi', 'breakfast'],
                    capacity: 2,
                    totalRooms: 1,
                },
            ]),
            findByTypeAndHotelId: jest.fn().mockResolvedValue([
                {
                    _id: 'room-type-1',
                    hotelId: 'hotel-1',
                    type: 'suite-2',
                    basePrice: 150,
                    amenities: ['wifi', 'breakfast'],
                    capacity: 2,
                    totalRooms: 1,
                },
            ]),
            findById: jest.fn(),
        };
        const promotionRepository = {
            findById: jest.fn(),
        };

        const createBookingUseCase = new CreateBookingUseCase(
            bookingRepository as any,
            hotelRepository as any,
            roomRepository as any,
            promotionRepository as any
        );
        const updateBookingUseCase = new UpdateBookingUseCase(
            bookingRepository as any,
            hotelRepository as any,
            roomRepository as any
        );
        const bookingService = new BookingService(
            bookingRepository as any,
            roomRepository as any,
            hotelRepository as any,
            createBookingUseCase,
            updateBookingUseCase
        );

        const checkInDate = futureDate(5);
        const checkOutDate = futureDate(7);

        await expect(
            bookingService.checkRoomAvailability('hotel-1', checkInDate, checkOutDate)
        ).resolves.toEqual({ 'suite-2': 1 });

        const created = await bookingService.create({
            userId: 'user-1',
            hotelId: 'hotel-1',
            roomSelections: [{ roomType: 'suite-2', quantity: 1 }],
            checkInDate,
            checkOutDate,
            totalPrice: 300,
            guests: { type: 'adult', count: 2 },
            status: 'pending',
        });

        const bookingId = (created as any).bookings[0].id;

        await expect(
            bookingService.checkRoomAvailability('hotel-1', checkInDate, checkOutDate)
        ).resolves.toEqual({ 'suite-2': 0 });

        await expect(
            bookingService.create({
                userId: 'user-2',
                hotelId: 'hotel-1',
                roomSelections: [{ roomType: 'suite-2', quantity: 1 }],
                checkInDate,
                checkOutDate,
                totalPrice: 300,
                guests: { type: 'adult', count: 2 },
                status: 'pending',
            })
        ).rejects.toBeInstanceOf(BusinessRuleException);

        await expect(bookingService.cancelBookingById(bookingId)).resolves.toMatchObject({
            success: true,
            refundAmount: 300,
        });

        await expect(
            bookingService.checkRoomAvailability('hotel-1', checkInDate, checkOutDate)
        ).resolves.toEqual({ 'suite-2': 1 });
    });
});
