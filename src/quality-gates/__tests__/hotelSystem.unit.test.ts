import { Booking } from '../../domain/entities/booking.ts';
import { Hotel } from '../../domain/entities/hotel.ts';
import { Room } from '../../domain/entities/room.ts';
import { BookingValidator } from '../../domain/validators/BookingValidator.ts';
import { HotelValidator } from '../../domain/validators/HotelValidator.ts';
import { RoomValidator } from '../../domain/validators/RoomValidator.ts';
import { PaymentGatewayService } from '../../application/services/paymentGatewayService.ts';

const addDays = (days: number): Date => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

const validHotel = (overrides: Partial<Hotel> = {}): Hotel => ({
    name: 'Jala Grand Hotel',
    location: 'Cochabamba, Bolivia',
    description: 'Business hotel with family rooms',
    rating: 4.6,
    imageUrl: 'https://example.com/hotel.jpg',
    ...overrides,
});

const validRoom = (overrides: Partial<Room> = {}): Room => ({
    hotelId: 'hotel-1',
    type: 'suite-family',
    basePrice: 220,
    amenities: ['wifi', 'bathroom', 'kitchen', 'pool'],
    capacity: 4,
    totalRooms: 5,
    ...overrides,
});

const validBooking = (overrides: Partial<Booking> = {}): Booking => ({
    userId: 'user-1',
    hotelId: 'hotel-1',
    roomSelections: [{ roomType: 'suite-family', quantity: 1 }],
    checkInDate: addDays(3),
    checkOutDate: addDays(5),
    totalPrice: 440,
    guests: { type: 'adult', count: 2 },
    status: 'pending',
    ...overrides,
});

type UnitCase = {
    name: string;
    run: () => unknown | Promise<unknown>;
};

const expectThrows = (fn: () => unknown, message: string): void => {
    expect(fn).toThrow(message);
};

const unitCases: UnitCase[] = [
    { name: 'hotel accepts a complete professional profile', run: () => expect(() => HotelValidator.validateCreate(validHotel())).not.toThrow() },
    { name: 'hotel rejects missing name', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ name: '' })), 'Hotel name is required') },
    { name: 'hotel rejects whitespace name', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ name: '   ' })), 'Hotel name is required') },
    { name: 'hotel rejects missing location', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ location: '' })), 'Hotel location is required') },
    { name: 'hotel rejects long name', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ name: 'A'.repeat(101) })), 'Hotel name cannot exceed 100 characters') },
    { name: 'hotel rejects long location', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ location: 'B'.repeat(201) })), 'Hotel location cannot exceed 200 characters') },
    { name: 'hotel rejects long description', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ description: 'C'.repeat(1001) })), 'Hotel description cannot exceed 1000 characters') },
    { name: 'hotel rejects negative rating', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ rating: -1 })), 'Rating must be a number between 0 and 5') },
    { name: 'hotel rejects rating above five', run: () => expectThrows(() => HotelValidator.validateCreate(validHotel({ rating: 6 })), 'Rating must be a number between 0 and 5') },
    { name: 'hotel update rejects empty name', run: () => expectThrows(() => HotelValidator.validateUpdate({ name: ' ' }), 'Hotel name cannot be empty') },

    { name: 'room accepts a valid inventory record', run: () => expect(() => RoomValidator.validateCreate(validRoom())).not.toThrow() },
    { name: 'room rejects missing hotel id', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ hotelId: '' })), 'Hotel ID is required') },
    { name: 'room rejects unknown type', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ type: 'penthouse' as any })), 'Invalid room type') },
    { name: 'room rejects zero base price', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ basePrice: 0 })), 'Base price must be greater than zero') },
    { name: 'room rejects negative base price', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ basePrice: -20 })), 'Base price must be greater than zero') },
    { name: 'room rejects price above hotel ceiling', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ basePrice: 5001 })), 'Base price cannot exceed $5000 per night') },
    { name: 'room rejects fractional room count', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ totalRooms: 1.5 })), 'Total rooms must be at least 1') },
    { name: 'room rejects zero room count', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ totalRooms: 0 })), 'Total rooms must be at least 1') },
    { name: 'room rejects empty amenities', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ amenities: [] })), 'At least one amenity is required') },
    { name: 'room rejects too many amenities', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ amenities: Array(21).fill('wifi') })), 'Maximum 20 amenities allowed per room') },
    { name: 'room rejects unknown amenity', run: () => expectThrows(() => RoomValidator.validateCreate(validRoom({ amenities: ['wifi', 'helipad'] })), 'Invalid amenity: helipad') },
    { name: 'room update accepts valid price change', run: () => expect(() => RoomValidator.validateUpdate({ basePrice: 160 })).not.toThrow() },
    { name: 'room update rejects invalid type', run: () => expectThrows(() => RoomValidator.validateUpdate({ type: 'capsule' as any }), 'Invalid room type') },
    { name: 'room update rejects invalid amenities', run: () => expectThrows(() => RoomValidator.validateUpdate({ amenities: ['wifi', 'casino'] }), 'Invalid amenity: casino') },
    { name: 'room update rejects invalid totalRooms', run: () => expectThrows(() => RoomValidator.validateUpdate({ totalRooms: -1 }), 'Total rooms must be at least 1') },

    { name: 'booking accepts valid future stay', run: () => expect(() => BookingValidator.validateCreate(validBooking())).not.toThrow() },
    { name: 'booking rejects missing user id', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ userId: '' })), 'User ID is required') },
    { name: 'booking rejects missing hotel id', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ hotelId: '' })), 'Hotel ID is required') },
    { name: 'booking rejects empty room selections', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ roomSelections: [] })), 'Room selections are required') },
    { name: 'booking rejects missing room type', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ roomSelections: [{ roomType: '' as any, quantity: 1 }] })), 'Room type is required for selection 1') },
    { name: 'booking rejects zero room quantity', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ roomSelections: [{ roomType: 'single-1', quantity: 0 }] })), 'Quantity must be at least 1 for selection 1') },
    { name: 'booking rejects missing check-in date', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ checkInDate: undefined as any })), 'Check-in date is required') },
    { name: 'booking rejects missing check-out date', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ checkOutDate: undefined as any })), 'Check-out date is required') },
    { name: 'booking rejects same-day invalid range', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ checkInDate: addDays(4), checkOutDate: addDays(4) })), 'Check-out date must be after check-in date') },
    { name: 'booking rejects past check-in', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ checkInDate: addDays(-1), checkOutDate: addDays(1) })), 'Check-in date cannot be in the past') },
    { name: 'booking rejects zero total price', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ totalPrice: 0 })), 'Total price must be greater than zero') },
    { name: 'booking rejects negative total price', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ totalPrice: -1 })), 'Total price must be greater than zero') },
    { name: 'booking rejects total above ceiling', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ totalPrice: 10001 })), 'Total price cannot exceed $10,000') },
    { name: 'booking rejects missing guests', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ guests: undefined as any })), 'At least one guest is required') },
    { name: 'booking rejects zero guests', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ guests: { type: 'adult', count: 0 } })), 'At least one guest is required') },
    { name: 'booking rejects eleven guests', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ guests: { type: 'adult', count: 11 } })), 'Maximum 10 guests allowed per booking') },
    { name: 'booking rejects stay over thirty days', run: () => expectThrows(() => BookingValidator.validateCreate(validBooking({ checkInDate: addDays(2), checkOutDate: addDays(34) })), 'Maximum stay duration is 30 days') },
    { name: 'booking update rejects invalid status', run: () => expectThrows(() => BookingValidator.validateUpdate({ status: 'archived' as any }), 'Invalid booking status') },
    { name: 'booking update rejects invalid date range', run: () => expectThrows(() => BookingValidator.validateUpdate({ checkInDate: addDays(6), checkOutDate: addDays(5) }), 'Check-out date must be after check-in date') },
    { name: 'booking cancellation rejects already cancelled booking', run: () => expectThrows(() => BookingValidator.validateCancellation(validBooking({ status: 'cancelled' })), 'Booking is already cancelled') },
    { name: 'booking cancellation rejects check-in under 24 hours', run: () => expectThrows(() => BookingValidator.validateCancellation(validBooking({ checkInDate: addDays(0), checkOutDate: addDays(2) })), 'Cannot cancel booking within 24 hours of check-in') },

    { name: 'mock payment intent includes provider and client secret', run: async () => expect(await new PaymentGatewayService().createIntent({ bookingId: 'booking-12345678', amount: 120, currency: 'USD' })).toEqual(expect.objectContaining({ provider: 'mock', requiresAction: false })) },
    { name: 'mock payment intent converts amount into secret metadata', run: async () => expect((await new PaymentGatewayService().createIntent({ bookingId: 'booking-12345678', amount: 120.45, currency: 'USD' })).clientSecret).toContain('_12045_usd') },
    { name: 'mock payment confirms normal card', run: async () => expect(await new PaymentGatewayService().confirmIntent({ providerPaymentIntentId: 'pi_mock_123', cardLast4: '4242' })).toEqual(expect.objectContaining({ status: 'paid' })) },
    { name: 'mock payment declines configured failure card', run: async () => expect(await new PaymentGatewayService().confirmIntent({ providerPaymentIntentId: 'pi_mock_123', cardLast4: '0000' })).toEqual(expect.objectContaining({ status: 'failed', failureReason: 'Card declined by demo gateway' })) },
];

describe('hotel system unit quality gate', () => {
    test.each(unitCases)('$name', async ({ run }) => {
        await run();
    });

    test('unit quality gate contains exactly 50 focused cases', () => {
        expect(unitCases).toHaveLength(50);
    });
});
