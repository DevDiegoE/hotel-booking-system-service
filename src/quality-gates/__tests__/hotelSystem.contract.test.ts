import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { authSchema } from '../../infrastructure/express/validators/authValidator.ts';
import { bookingSchema } from '../../infrastructure/express/validators/bookingValidator.ts';
import { hotelSchema } from '../../infrastructure/express/validators/hotelValidator.ts';
import { promotionsSchema } from '../../infrastructure/express/validators/promotionValidator.ts';
import { roomSchema } from '../../infrastructure/express/validators/roomValidator.ts';

const serviceRoot = resolve(__dirname, '../../..');
const source = (path: string): string => readFileSync(resolve(serviceRoot, path), 'utf8');

const validAuth = { email: 'guest@hotel.test', password: 'Guest123', role: 'user' };
const validHotel = {
    name: 'Jala Grand Hotel',
    location: 'Cochabamba',
    description: 'A hotel',
    rating: 4.6,
    imageUrl: 'https://example.com/hotel.jpg',
};
const validRoom = {
    hotelId: 'hotel-1',
    type: 'suite-family',
    basePrice: 220,
    amenities: ['wifi', 'bathroom'],
    capacity: 4,
    totalRooms: 5,
};
const validBooking = {
    userId: 'user-1',
    hotelId: 'hotel-1',
    roomSelections: [{ roomType: 'suite-family', quantity: 1 }],
    checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    totalPrice: 220,
    guests: { type: 'adult', count: 2 },
};
const validPromotion = {
    name: 'Family Package',
    description: 'Discount for families',
    type: 'family-discount',
    rules: { minAdults: 2 },
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    discountPercentage: 12,
};

type ContractCase = {
    name: string;
    assert: () => void;
};

const parses = (schema: { safeParse: (value: unknown) => { success: boolean } }, value: unknown): void => {
    expect(schema.safeParse(value).success).toBe(true);
};

const rejects = (schema: { safeParse: (value: unknown) => { success: boolean } }, value: unknown): void => {
    expect(schema.safeParse(value).success).toBe(false);
};

const contractCases: ContractCase[] = [
    { name: 'auth contract accepts guest login payload', assert: () => parses(authSchema, validAuth) },
    { name: 'auth contract accepts admin role payload', assert: () => parses(authSchema, { ...validAuth, role: 'admin' }) },
    { name: 'auth contract allows omitted role', assert: () => parses(authSchema, { email: 'guest@hotel.test', password: 'Guest123' }) },
    { name: 'auth contract rejects malformed email', assert: () => rejects(authSchema, { ...validAuth, email: 'bad-email' }) },
    { name: 'auth contract rejects short password', assert: () => rejects(authSchema, { ...validAuth, password: '12345' }) },
    { name: 'auth contract rejects unknown role', assert: () => rejects(authSchema, { ...validAuth, role: 'owner' }) },
    { name: 'auth contract requires password', assert: () => rejects(authSchema, { email: 'guest@hotel.test' }) },
    { name: 'auth routes expose register endpoint', assert: () => expect(source('src/infrastructure/express/routes/authRoutes.ts')).toContain("post('/register'") },

    { name: 'hotel contract accepts public hotel card payload', assert: () => parses(hotelSchema, validHotel) },
    { name: 'hotel contract accepts missing rating', assert: () => parses(hotelSchema, { name: 'Hotel', location: 'La Paz' }) },
    { name: 'hotel contract rejects empty name', assert: () => rejects(hotelSchema, { ...validHotel, name: '' }) },
    { name: 'hotel contract rejects empty location', assert: () => rejects(hotelSchema, { ...validHotel, location: '' }) },
    { name: 'hotel contract rejects rating below zero', assert: () => rejects(hotelSchema, { ...validHotel, rating: -0.1 }) },
    { name: 'hotel contract rejects rating above five', assert: () => rejects(hotelSchema, { ...validHotel, rating: 5.1 }) },
    { name: 'hotel contract rejects invalid image url', assert: () => rejects(hotelSchema, { ...validHotel, imageUrl: 'not-url' }) },
    { name: 'hotel routes expose locations before id route', assert: () => expect(source('src/infrastructure/express/routes/hotelRoutes.ts').indexOf("get('/locations'")).toBeLessThan(source('src/infrastructure/express/routes/hotelRoutes.ts').indexOf("get('/:id'")) },

    { name: 'room contract accepts inventory room payload', assert: () => parses(roomSchema, validRoom) },
    { name: 'room contract rejects missing hotel id', assert: () => rejects(roomSchema, { ...validRoom, hotelId: '' }) },
    { name: 'room contract rejects invalid room type', assert: () => rejects(roomSchema, { ...validRoom, type: 'penthouse' }) },
    { name: 'room contract rejects negative price', assert: () => rejects(roomSchema, { ...validRoom, basePrice: -1 }) },
    { name: 'room contract rejects zero capacity', assert: () => rejects(roomSchema, { ...validRoom, capacity: 0 }) },
    { name: 'room contract rejects fractional capacity', assert: () => rejects(roomSchema, { ...validRoom, capacity: 2.5 }) },
    { name: 'room contract rejects zero total room count', assert: () => rejects(roomSchema, { ...validRoom, totalRooms: 0 }) },
    { name: 'room contract rejects fractional total room count', assert: () => rejects(roomSchema, { ...validRoom, totalRooms: 3.5 }) },
    { name: 'room routes expose search before id route', assert: () => expect(source('src/infrastructure/express/routes/roomRoutes.ts').indexOf("get('/search'")).toBeLessThan(source('src/infrastructure/express/routes/roomRoutes.ts').indexOf("get('/:id'")) },

    { name: 'booking contract accepts multi-room booking payload', assert: () => parses(bookingSchema, validBooking) },
    { name: 'booking contract allows omitted user id for authenticated route', assert: () => parses(bookingSchema, { ...validBooking, userId: undefined }) },
    { name: 'booking contract accepts all public room types', assert: () => ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'].forEach((roomType) => parses(bookingSchema, { ...validBooking, roomSelections: [{ roomType, quantity: 1 }] })) },
    { name: 'booking contract rejects missing hotel id', assert: () => rejects(bookingSchema, { ...validBooking, hotelId: '' }) },
    { name: 'booking contract rejects empty room selection array', assert: () => rejects(bookingSchema, { ...validBooking, roomSelections: [] }) },
    { name: 'booking contract rejects bad room type', assert: () => rejects(bookingSchema, { ...validBooking, roomSelections: [{ roomType: 'loft', quantity: 1 }] }) },
    { name: 'booking contract rejects zero quantity', assert: () => rejects(bookingSchema, { ...validBooking, roomSelections: [{ roomType: 'suite-family', quantity: 0 }] }) },
    { name: 'booking contract rejects negative total price', assert: () => rejects(bookingSchema, { ...validBooking, totalPrice: -1 }) },
    { name: 'booking contract rejects zero guests', assert: () => rejects(bookingSchema, { ...validBooking, guests: { type: 'adult', count: 0 } }) },
    { name: 'booking contract rejects invalid guest type', assert: () => rejects(bookingSchema, { ...validBooking, guests: { type: 'pet', count: 1 } }) },
    { name: 'booking routes expose availability before id route', assert: () => expect(source('src/infrastructure/express/routes/bookingRoutes.ts').indexOf("get('/availability/:hotelId'")).toBeLessThan(source('src/infrastructure/express/routes/bookingRoutes.ts').indexOf("get('/:id'")) },

    { name: 'promotion contract accepts family discount payload', assert: () => parses(promotionsSchema, validPromotion) },
    { name: 'promotion contract accepts age discount payload', assert: () => parses(promotionsSchema, { ...validPromotion, type: 'age-discount' }) },
    { name: 'promotion contract rejects empty name', assert: () => rejects(promotionsSchema, { ...validPromotion, name: '' }) },
    { name: 'promotion contract rejects empty description', assert: () => rejects(promotionsSchema, { ...validPromotion, description: '' }) },
    { name: 'promotion contract rejects invalid type', assert: () => rejects(promotionsSchema, { ...validPromotion, type: 'coupon' }) },
    { name: 'promotion contract rejects negative discount', assert: () => rejects(promotionsSchema, { ...validPromotion, discountPercentage: -1 }) },
    { name: 'promotion contract rejects discount above hundred', assert: () => rejects(promotionsSchema, { ...validPromotion, discountPercentage: 101 }) },
    { name: 'promotion routes expose name lookup before id route', assert: () => expect(source('src/infrastructure/express/routes/promotionRoutes.ts').indexOf("get('/name/:name'")).toBeLessThan(source('src/infrastructure/express/routes/promotionRoutes.ts').indexOf("get('/:id'")) },

    { name: 'operations contract exposes public policy endpoint', assert: () => expect(source('src/infrastructure/express/routes/operationsRoutes.ts')).toContain("get('/public/policies/:hotelId'") },
    { name: 'operations contract exposes public rate plan endpoint', assert: () => expect(source('src/infrastructure/express/routes/operationsRoutes.ts')).toContain("get('/public/rate-plans'") },
    { name: 'operations contract protects guest profile upsert', assert: () => expect(source('src/infrastructure/express/routes/operationsRoutes.ts')).toContain("post('/guest-profiles', authMiddleware") },
    { name: 'operations contract protects payment intent creation', assert: () => expect(source('src/infrastructure/express/routes/operationsRoutes.ts')).toContain("post('/bookings/:bookingId/payment-intents', authMiddleware") },
    { name: 'operations contract exposes webhook before admin guard', assert: () => expect(source('src/infrastructure/express/routes/operationsRoutes.ts').indexOf("post('/payments/webhook'")).toBeLessThan(source('src/infrastructure/express/routes/operationsRoutes.ts').indexOf("operationsRoutes.use(authMiddleware")) },
    { name: 'openapi contract declares bearer auth', assert: () => expect(source('src/infrastructure/express/docs/swagger.yaml')).toContain('BearerAuth') },
];

describe('hotel system contract quality gate', () => {
    test.each(contractCases)('$name', ({ assert }) => {
        assert();
    });

    test('contract quality gate contains exactly 50 focused cases', () => {
        expect(contractCases).toHaveLength(50);
    });
});
