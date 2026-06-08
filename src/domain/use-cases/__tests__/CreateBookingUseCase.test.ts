import 'reflect-metadata';

import { CreateBookingUseCase } from '../CreateBookingUseCase.ts';
import { BusinessRuleException } from '../../exceptions/DomainException.ts';

const futureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

describe('CreateBookingUseCase', () => {
    const hotelRepository = {
        findById: jest.fn(),
    };
    const roomRepository = {
        findByTypeAndHotelId: jest.fn(),
    };
    const bookingRepository = {
        findByDateRange: jest.fn(),
        create: jest.fn(),
    };
    const promotionRepository = {
        findById: jest.fn(),
    };

    const createUseCase = () =>
        new CreateBookingUseCase(
            bookingRepository as any,
            hotelRepository as any,
            roomRepository as any,
            promotionRepository as any
        );

    beforeEach(() => {
        jest.clearAllMocks();
        hotelRepository.findById.mockResolvedValue({
            _id: 'hotel-1',
            name: 'Jala Suites',
            location: 'Cochabamba',
        });
        roomRepository.findByTypeAndHotelId.mockResolvedValue([
            {
                _id: 'room-type-1',
                hotelId: 'hotel-1',
                type: 'single-2',
                basePrice: 100,
                amenities: ['wifi'],
                capacity: 2,
                totalRooms: 3,
            },
        ]);
        bookingRepository.findByDateRange.mockResolvedValue([]);
        bookingRepository.create.mockImplementation(async (booking) => ({
            _id: 'booking-1',
            ...booking,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    });

    it('creates a booking with server-calculated price and room quantity', async () => {
        const checkInDate = futureDate(3);
        const checkOutDate = futureDate(5);

        const result = await createUseCase().execute({
            userId: 'user-1',
            hotelId: 'hotel-1',
            roomSelections: [{ roomType: 'single-2', quantity: 2 }],
            checkInDate,
            checkOutDate,
            totalPrice: 400,
            guests: { type: 'adult', count: 2 },
        });

        expect(result.totalRooms).toBe(2);
        expect(result.totalPrice).toBe(400);
        expect(result.bookings[0]).toMatchObject({
            id: 'booking-1',
            hotelId: 'hotel-1',
            quantity: 2,
            status: 'pending',
        });
        expect(bookingRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                totalPrice: 400,
                roomSelections: [{ roomType: 'single-2', quantity: 2 }],
            })
        );
    });

    it('allows checkout totals above base price for taxes and rate-plan adjustments', async () => {
        const result = await createUseCase().execute({
            userId: 'user-1',
            hotelId: 'hotel-1',
            roomSelections: [{ roomType: 'single-2', quantity: 1 }],
            checkInDate: futureDate(3),
            checkOutDate: futureDate(5),
            totalPrice: 260.13,
            guests: { type: 'adult', count: 2 },
        });

        expect(result.totalPrice).toBe(260.13);
        expect(bookingRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                totalPrice: 260.13,
            })
        );
    });

    it('rejects checkout totals below the server-calculated minimum', async () => {
        await expect(
            createUseCase().execute({
                userId: 'user-1',
                hotelId: 'hotel-1',
                roomSelections: [{ roomType: 'single-2', quantity: 1 }],
                checkInDate: futureDate(3),
                checkOutDate: futureDate(5),
                totalPrice: 50,
                guests: { type: 'adult', count: 2 },
            })
        ).rejects.toBeInstanceOf(BusinessRuleException);
    });

    it('rejects bookings that request more rooms than available', async () => {
        bookingRepository.findByDateRange.mockResolvedValue([
            {
                hotelId: 'hotel-1',
                status: 'confirmed',
                roomSelections: [{ roomType: 'single-2', quantity: 2 }],
            },
        ]);

        await expect(
            createUseCase().execute({
                userId: 'user-1',
                hotelId: 'hotel-1',
                roomSelections: [{ roomType: 'single-2', quantity: 2 }],
                checkInDate: futureDate(3),
                checkOutDate: futureDate(5),
                totalPrice: 400,
                guests: { type: 'adult', count: 2 },
            })
        ).rejects.toBeInstanceOf(BusinessRuleException);
    });
});
