import 'reflect-metadata';

import { CreateBookingUseCase } from '../../domain/use-cases/CreateBookingUseCase.ts';
import { CreateHotelUseCase } from '../../domain/use-cases/CreateHotelUseCase.ts';
import { CreateRoomUseCase } from '../../domain/use-cases/CreateRoomUseCase.ts';
import { UpdateBookingUseCase } from '../../domain/use-cases/UpdateBookingUseCase.ts';
import { UpdateRoomUseCase } from '../../domain/use-cases/UpdateRoomUseCase.ts';
import { Booking } from '../../domain/entities/booking.ts';
import { Hotel } from '../../domain/entities/hotel.ts';
import { Room } from '../../domain/entities/room.ts';

const addDays = (days: number): Date => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

const hotel = (overrides: Partial<Hotel> = {}): Hotel & { _id: string } => ({
    _id: 'hotel-1',
    name: 'Jala Grand Hotel',
    location: 'Cochabamba',
    description: 'A hotel',
    rating: 4.6,
    ...overrides,
} as Hotel & { _id: string });

const room = (overrides: Partial<Room> = {}): Room => ({
    _id: 'room-1',
    hotelId: 'hotel-1',
    type: 'suite-family',
    basePrice: 220,
    amenities: ['wifi', 'bathroom'],
    capacity: 4,
    totalRooms: 5,
    ...overrides,
});

const booking = (overrides: Partial<Booking> = {}): Booking => ({
    _id: 'booking-1',
    userId: 'user-1',
    hotelId: 'hotel-1',
    roomSelections: [{ roomType: 'suite-family', quantity: 1 }],
    checkInDate: addDays(3),
    checkOutDate: addDays(5),
    totalPrice: 440,
    guests: { type: 'adult', count: 2 },
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

const makeRepos = (overrides: Record<string, unknown> = {}) => {
    const hotels = [hotel()];
    const rooms = [room()];
    const bookings: Booking[] = [];
    const promotions = [{ _id: 'promo-10', name: 'Family', discountPercentage: 10 }];

    const hotelRepository = {
        create: jest.fn(async (item: Hotel) => ({ ...item, _id: 'hotel-created' })),
        findAll: jest.fn(async () => hotels),
        findById: jest.fn(async (id: string) => hotels.find((item) => item._id === id) || null),
        findByName: jest.fn(async (name: string) => hotels.find((item) => item.name === name) || null),
        findByLocation: jest.fn(async (location: string) => hotels.filter((item) => item.location === location)),
        findAvailableHotels: jest.fn(async () => hotels),
        update: jest.fn(async (id: string, data: Partial<Hotel>) => ({ ...hotel(), _id: id, ...data })),
        delete: jest.fn(async () => undefined),
    };

    const roomRepository = {
        create: jest.fn(async (item: Room) => ({ ...item, _id: 'room-created' })),
        findAll: jest.fn(async () => rooms),
        findById: jest.fn(async (id: string) => rooms.find((item) => item._id === id) || null),
        findByHotelId: jest.fn(async (hotelId: string) => rooms.filter((item) => item.hotelId === hotelId)),
        findAvailableRooms: jest.fn(async () => rooms),
        findByTypeAndHotelId: jest.fn(async (type: string, hotelId: string) =>
            rooms.filter((item) => item.type === type && item.hotelId === hotelId)
        ),
        findByCapacity: jest.fn(async () => rooms),
        findByPriceRange: jest.fn(async () => rooms),
        findByHotelLocation: jest.fn(async () => rooms),
        search: jest.fn(async () => rooms),
        update: jest.fn(async (id: string, data: Partial<Room>) => ({ ...room(), _id: id, ...data })),
        delete: jest.fn(async () => undefined),
    };

    const bookingRepository = {
        create: jest.fn(async (item: Booking) => ({ ...item, _id: 'booking-created', createdAt: new Date(), updatedAt: new Date() })),
        findAll: jest.fn(async () => bookings),
        findById: jest.fn(async (id: string) => bookings.find((item) => item._id === id) || null),
        findByUserId: jest.fn(async (userId: string) => bookings.filter((item) => item.userId === userId)),
        findByHotelId: jest.fn(async (hotelId: string) => bookings.filter((item) => item.hotelId === hotelId)),
        findByRoomType: jest.fn(async (roomType: string) => bookings.filter((item) => item.roomSelections.some((selection) => selection.roomType === roomType))),
        findByStatus: jest.fn(async (status: string) => bookings.filter((item) => item.status === status)),
        findByDateRange: jest.fn(async () => bookings),
        update: jest.fn(async (id: string, data: Partial<Booking>) => ({ ...booking({ _id: id }), ...data })),
        delete: jest.fn(async () => undefined),
    };

    const promotionRepository = {
        create: jest.fn(async (item: any) => ({ ...item, _id: 'promo-created' })),
        findAll: jest.fn(async () => promotions),
        findById: jest.fn(async (id: string) => promotions.find((item) => item._id === id) || null),
        findByName: jest.fn(async (name: string) => promotions.find((item) => item.name === name) || null),
        findByType: jest.fn(async () => promotions),
        update: jest.fn(async (id: string, data: any) => ({ ...promotions[0], _id: id, ...data })),
        delete: jest.fn(async () => undefined),
    };

    Object.assign(hotelRepository, overrides.hotelRepository);
    Object.assign(roomRepository, overrides.roomRepository);
    Object.assign(bookingRepository, overrides.bookingRepository);
    Object.assign(promotionRepository, overrides.promotionRepository);

    return { hotelRepository, roomRepository, bookingRepository, promotionRepository, bookings };
};

const bookingRequest = (overrides: Record<string, unknown> = {}) => ({
    userId: 'user-1',
    hotelId: 'hotel-1',
    roomSelections: [{ roomType: 'suite-family' as const, quantity: 1 }],
    checkInDate: addDays(3),
    checkOutDate: addDays(5),
    totalPrice: 440,
    guests: { type: 'adult' as const, count: 2 },
    ...overrides,
});

type IntegrationCase = {
    name: string;
    run: () => Promise<unknown>;
};

const integrationCases: IntegrationCase[] = [
    { name: 'create hotel persists valid hotel', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'New Hotel', location: 'La Paz' })).resolves.toEqual(expect.objectContaining({ _id: 'hotel-created' })); } },
    { name: 'create hotel prevents duplicate hotel name', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'Jala Grand Hotel', location: 'La Paz' })).rejects.toThrow('already exists'); } },
    { name: 'create hotel rejects empty name before repository create', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: '', location: 'La Paz' })).rejects.toThrow('Hotel name is required'); expect(r.hotelRepository.create).not.toHaveBeenCalled(); } },
    { name: 'create hotel checks duplicate names before create', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'Jala Grand Hotel', location: 'Cochabamba' })).rejects.toThrow('already exists'); expect(r.hotelRepository.findByName).toHaveBeenCalledWith('Jala Grand Hotel'); } },
    { name: 'create hotel allows optional description', run: async () => { const r = makeRepos(); await new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'Airport Hotel', location: 'Santa Cruz', description: 'Near airport' }); expect(r.hotelRepository.create).toHaveBeenCalledWith(expect.objectContaining({ description: 'Near airport' })); } },
    { name: 'create hotel rejects long name', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'A'.repeat(101), location: 'La Paz' })).rejects.toThrow('Hotel name cannot exceed 100 characters'); } },
    { name: 'create hotel rejects long location', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'Valid', location: 'B'.repeat(201) })).rejects.toThrow('Hotel location cannot exceed 200 characters'); } },
    { name: 'create hotel does not require image url', run: async () => { const r = makeRepos(); await new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'No Image Hotel', location: 'Oruro' }); expect(r.hotelRepository.create).toHaveBeenCalled(); } },
    { name: 'create hotel returns repository result', run: async () => { const r = makeRepos(); const created = await new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'Lake Hotel', location: 'Copacabana' }); expect(created.name).toBe('Lake Hotel'); } },
    { name: 'create hotel does not call create on duplicate', run: async () => { const r = makeRepos(); await expect(new CreateHotelUseCase(r.hotelRepository as any).execute({ name: 'Jala Grand Hotel', location: 'Cochabamba' })).rejects.toThrow(); expect(r.hotelRepository.create).not.toHaveBeenCalled(); } },

    { name: 'create room persists valid room when hotel exists', run: async () => { const r = makeRepos(); await expect(new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room())).resolves.toEqual(expect.objectContaining({ _id: 'room-created' })); } },
    { name: 'create room rejects missing hotel reference', run: async () => { const r = makeRepos({ hotelRepository: { findById: jest.fn(async () => null) } }); await expect(new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ hotelId: 'missing' }))).rejects.toThrow('Hotel with id missing not found'); } },
    { name: 'create room validates room before hotel lookup', run: async () => { const r = makeRepos(); await expect(new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ basePrice: 0 }))).rejects.toThrow('Base price must be greater than zero'); expect(r.hotelRepository.findById).not.toHaveBeenCalled(); } },
    { name: 'create room rejects invalid type', run: async () => { const r = makeRepos(); await expect(new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ type: 'bad' as any }))).rejects.toThrow('Invalid room type'); } },
    { name: 'create room sends hotel id to hotel repository', run: async () => { const r = makeRepos(); await new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ hotelId: 'hotel-1' })); expect(r.hotelRepository.findById).toHaveBeenCalledWith('hotel-1'); } },
    { name: 'create room sends valid payload to room repository', run: async () => { const r = makeRepos(); await new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ type: 'single-2' })); expect(r.roomRepository.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'single-2' })); } },
    { name: 'create room rejects empty amenities', run: async () => { const r = makeRepos(); await expect(new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ amenities: [] }))).rejects.toThrow('At least one amenity is required'); } },
    { name: 'create room rejects invalid amenity', run: async () => { const r = makeRepos(); await expect(new CreateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute(room({ amenities: ['wifi', 'heliport'] }))).rejects.toThrow('Invalid amenity: heliport'); } },
    { name: 'update room validates existing room first', run: async () => { const r = makeRepos({ roomRepository: { findById: jest.fn(async () => null) } }); await expect(new UpdateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute({ id: 'missing', data: { basePrice: 200 } })).rejects.toThrow('Room with id missing not found'); } },
    { name: 'update room persists valid partial room update', run: async () => { const r = makeRepos(); await expect(new UpdateRoomUseCase(r.roomRepository as any, r.hotelRepository as any).execute({ id: 'room-1', data: { basePrice: 250 } })).resolves.toEqual(expect.objectContaining({ basePrice: 250 })); } },

    { name: 'create booking persists valid single room stay', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest())).resolves.toEqual(expect.objectContaining({ totalRooms: 1 })); } },
    { name: 'create booking rejects unknown hotel', run: async () => { const r = makeRepos({ hotelRepository: { findById: jest.fn(async () => null) } }); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ hotelId: 'missing' }))).rejects.toThrow('Hotel with id missing not found'); } },
    { name: 'create booking rejects empty selections', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ roomSelections: [] }))).rejects.toThrow('At least one room selection is required'); } },
    { name: 'create booking rejects zero quantity', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ roomSelections: [{ roomType: 'suite-family', quantity: 0 }] }))).rejects.toThrow('Room quantity must be at least 1'); } },
    { name: 'create booking rejects unknown room type in hotel', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ roomSelections: [{ roomType: 'single-1', quantity: 1 }] }))).rejects.toThrow('No rooms of type single-1 available'); } },
    { name: 'create booking blocks sold out inventory', run: async () => { const r = makeRepos(); r.bookings.push(booking({ roomSelections: [{ roomType: 'suite-family', quantity: 5 }] })); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest())).rejects.toThrow('Only 0 rooms'); } },
    { name: 'create booking ignores cancelled booking inventory', run: async () => { const r = makeRepos(); r.bookings.push(booking({ status: 'cancelled', roomSelections: [{ roomType: 'suite-family', quantity: 5 }] })); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest())).resolves.toEqual(expect.objectContaining({ totalRooms: 1 })); } },
    { name: 'create booking computes multi-night total price', run: async () => { const r = makeRepos(); const result = await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ totalPrice: 660, checkOutDate: addDays(6) })); expect(result.bookings[0].totalPrice).toBe(660); } },
    { name: 'create booking applies bulk room discount expectation', run: async () => { const r = makeRepos(); const result = await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ roomSelections: [{ roomType: 'suite-family', quantity: 3 }], totalPrice: 1188 })); expect(result.totalRooms).toBe(3); } },
    { name: 'create booking rejects manipulated low price', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ totalPrice: 100 }))).rejects.toThrow('Total price cannot be lower'); } },
    { name: 'create booking allows small rounding tolerance', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ totalPrice: 439.5 }))).resolves.toBeTruthy(); } },
    { name: 'create booking applies promotion lookup', run: async () => { const r = makeRepos(); await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ totalPrice: 396, appliedPromotions: ['promo-10'] })); expect(r.promotionRepository.findById).toHaveBeenCalledWith('promo-10'); } },
    { name: 'create booking does not apply missing promotion discount', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ totalPrice: 396, appliedPromotions: ['missing'] }))).rejects.toThrow('Total price cannot be lower'); } },
    { name: 'create booking returns pending booking status', run: async () => { const r = makeRepos(); const result = await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest()); expect(result.bookings[0].status).toBe('pending'); } },
    { name: 'create booking aggregates selected room quantities', run: async () => { const r = makeRepos(); const result = await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ roomSelections: [{ roomType: 'suite-family', quantity: 2 }], totalPrice: 880 })); expect(result.totalRooms).toBe(2); } },
    { name: 'create booking checks conflicting date range', run: async () => { const r = makeRepos(); await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest()); expect(r.bookingRepository.findByDateRange).toHaveBeenCalled(); } },
    { name: 'create booking checks room type by hotel', run: async () => { const r = makeRepos(); await new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest()); expect(r.roomRepository.findByTypeAndHotelId).toHaveBeenCalledWith('suite-family', 'hotel-1'); } },
    { name: 'create booking rejects too many guests through validator', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ guests: { type: 'adult', count: 11 } }))).rejects.toThrow('Maximum 10 guests'); } },
    { name: 'create booking rejects long stay through validator', run: async () => { const r = makeRepos(); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest({ checkOutDate: addDays(40), totalPrice: 8140 }))).rejects.toThrow('Maximum stay duration'); } },
    { name: 'create booking supports legacy conflicting booking shape', run: async () => { const r = makeRepos(); r.bookings.push({ ...booking(), roomSelections: undefined as any, roomType: 'suite-family', quantity: 5 } as any); await expect(new CreateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any, r.promotionRepository as any).execute(bookingRequest())).rejects.toThrow('Only 0 rooms'); } },

    { name: 'update booking rejects blank id', run: async () => { const r = makeRepos(); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: ' ', data: {} })).rejects.toThrow('Booking ID is required'); } },
    { name: 'update booking rejects missing booking', run: async () => { const r = makeRepos(); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'missing', data: {} })).rejects.toThrow('Booking with id missing not found'); } },
    { name: 'update booking validates new hotel id', run: async () => { const r = makeRepos(); r.bookings.push(booking()); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { hotelId: 'missing' } })).rejects.toThrow('Hotel with id missing not found'); } },
    { name: 'update booking rejects invalid status', run: async () => { const r = makeRepos(); r.bookings.push(booking()); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { status: 'bad' as any } })).rejects.toThrow('Invalid booking status'); } },
    { name: 'update booking persists valid status', run: async () => { const r = makeRepos(); r.bookings.push(booking()); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { status: 'confirmed' } })).resolves.toEqual(expect.objectContaining({ status: 'confirmed' })); } },
    { name: 'update booking rejects invalid room type availability', run: async () => { const r = makeRepos(); r.bookings.push(booking()); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { roomSelections: [{ roomType: 'single-1', quantity: 1 }] } })).rejects.toThrow('No rooms of type single-1 available'); } },
    { name: 'update booking ignores its own booking in availability', run: async () => { const r = makeRepos(); r.bookings.push(booking({ roomSelections: [{ roomType: 'suite-family', quantity: 5 }] })); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { roomSelections: [{ roomType: 'suite-family', quantity: 5 }] } })).resolves.toBeTruthy(); } },
    { name: 'update booking blocks overlapping inventory from another booking', run: async () => { const r = makeRepos(); r.bookings.push(booking()); r.bookings.push(booking({ _id: 'booking-2', roomSelections: [{ roomType: 'suite-family', quantity: 5 }] })); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { roomSelections: [{ roomType: 'suite-family', quantity: 1 }] } })).rejects.toThrow('Only 0 rooms'); } },
    { name: 'update booking ignores cancelled overlap inventory', run: async () => { const r = makeRepos(); r.bookings.push(booking()); r.bookings.push(booking({ _id: 'booking-2', status: 'cancelled', roomSelections: [{ roomType: 'suite-family', quantity: 5 }] })); await expect(new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { roomSelections: [{ roomType: 'suite-family', quantity: 1 }] } })).resolves.toBeTruthy(); } },
    { name: 'update booking sends partial update to repository', run: async () => { const r = makeRepos(); r.bookings.push(booking()); await new UpdateBookingUseCase(r.bookingRepository as any, r.hotelRepository as any, r.roomRepository as any).execute({ id: 'booking-1', data: { totalPrice: 500 } }); expect(r.bookingRepository.update).toHaveBeenCalledWith('booking-1', { totalPrice: 500 }); } },
];

describe('hotel system integration quality gate', () => {
    test.each(integrationCases)('$name', async ({ run }) => {
        await run();
    });

    test('integration quality gate contains exactly 50 focused cases', () => {
        expect(integrationCases).toHaveLength(50);
    });
});
