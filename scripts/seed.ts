import 'reflect-metadata';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { HotelModel } from '../src/infrastructure/database/mongoose/hotelModel.ts';
import { RoomModel } from '../src/infrastructure/database/mongoose/roomModel.ts';
import { PromotionModel } from '../src/infrastructure/database/mongoose/promotionModel.ts';
import { UserModel } from '../src/infrastructure/database/mongoose/userModel.ts';
import { BookingModel } from '../src/infrastructure/database/mongoose/bookingModel.ts';
import { AuditLogModel } from '../src/infrastructure/database/mongoose/auditLogModel.ts';
import { GuestProfileModel } from '../src/infrastructure/database/mongoose/guestProfileModel.ts';
import { HotelPolicyModel } from '../src/infrastructure/database/mongoose/hotelPolicyModel.ts';
import { HousekeepingTaskModel } from '../src/infrastructure/database/mongoose/housekeepingTaskModel.ts';
import { PaymentModel } from '../src/infrastructure/database/mongoose/paymentModel.ts';
import { PhysicalRoomModel } from '../src/infrastructure/database/mongoose/physicalRoomModel.ts';
import { RatePlanModel } from '../src/infrastructure/database/mongoose/ratePlanModel.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-system';

const hotels = [
    {
        name: 'Jala Grand Hotel',
        location: 'Cochabamba, Bolivia',
        description: 'Downtown hotel with business amenities, breakfast, and fast access to city attractions.',
        rating: 4.6,
        imageUrl:
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    },
    {
        name: 'Andes Family Suites',
        location: 'La Paz, Bolivia',
        description: 'Family-focused suites with flexible room options, parking, and mountain views.',
        rating: 4.4,
        imageUrl:
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    },
    {
        name: 'Santa Cruz Resort',
        location: 'Santa Cruz, Bolivia',
        description: 'Warm-weather resort with pool, restaurant, and spacious rooms for longer stays.',
        rating: 4.7,
        imageUrl:
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    },
];

const roomBlueprints = [
    { type: 'single-1', basePrice: 65, amenities: ['wifi', 'bathroom', 'tv'], capacity: 1, totalRooms: 8 },
    { type: 'single-2', basePrice: 95, amenities: ['wifi', 'bathroom', 'ac', 'tv'], capacity: 2, totalRooms: 10 },
    { type: 'single-3', basePrice: 125, amenities: ['wifi', 'bathroom', 'ac', 'parking'], capacity: 3, totalRooms: 6 },
    { type: 'suite-2', basePrice: 180, amenities: ['wifi', 'bathroom', 'ac', 'room-service', 'spa'], capacity: 2, totalRooms: 4 },
    { type: 'suite-family', basePrice: 220, amenities: ['wifi', 'bathroom', 'kitchen', 'pool', 'parking'], capacity: 4, totalRooms: 5 },
] as const;

const promotions = [
    {
        name: 'Family Package',
        description: 'Discount for families booking larger stays.',
        type: 'family-discount',
        rules: { minAdults: 2, freeChildrenUnderAge: 10 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        discountPercentage: 12,
    },
    {
        name: 'Early Bird Special',
        description: 'Save when booking at least one week in advance.',
        type: 'family-discount',
        rules: { minAdults: 1, freeChildrenUnderAge: 0 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        discountPercentage: 8,
    },
    {
        name: 'Senior Discount',
        description: 'Special rate for smaller adult stays.',
        type: 'age-discount',
        rules: { minAdults: 1, freeChildrenUnderAge: 0 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        discountPercentage: 10,
    },
] as const;

async function seed() {
    await mongoose.connect(MONGODB_URI);

    await Promise.all([
        HotelModel.deleteMany({}),
        RoomModel.deleteMany({}),
        PromotionModel.deleteMany({}),
        BookingModel.deleteMany({}),
        AuditLogModel.deleteMany({}),
        GuestProfileModel.deleteMany({}),
        HotelPolicyModel.deleteMany({}),
        HousekeepingTaskModel.deleteMany({}),
        PaymentModel.deleteMany({}),
        PhysicalRoomModel.deleteMany({}),
        RatePlanModel.deleteMany({}),
        UserModel.deleteMany({ email: { $in: ['admin@hotel.test', 'guest@hotel.test'] } }),
    ]);

    const createdHotels = await HotelModel.insertMany(hotels);

    const rooms = createdHotels.flatMap((hotel, hotelIndex) =>
        roomBlueprints.map((room) => ({
            ...room,
            hotelId: String(hotel._id),
            basePrice: room.basePrice + hotelIndex * 15,
        }))
    );

    await RoomModel.insertMany(rooms);
    await PromotionModel.insertMany(promotions);

    await HotelPolicyModel.insertMany(
        createdHotels.map((hotel) => ({
            hotelId: String(hotel._id),
            checkInTime: '15:00',
            checkOutTime: '11:00',
            cancellationHours: 48,
            cancellationFeePercentage: 50,
            childrenPolicy: 'Children are welcome. Children under 10 can stay free in family plans.',
            petPolicy: 'Pets require prior approval from the property.',
            taxPercentage: 13,
            extraGuestFee: 18,
        }))
    );

    await RatePlanModel.insertMany(
        createdHotels.flatMap((hotel) => [
            {
                hotelId: String(hotel._id),
                name: 'Flexible rate',
                refundable: true,
                breakfastIncluded: false,
                weekdayMultiplier: 1,
                weekendMultiplier: 1.15,
                minNights: 1,
                active: true,
            },
            {
                hotelId: String(hotel._id),
                name: 'Breakfast included',
                refundable: true,
                breakfastIncluded: true,
                weekdayMultiplier: 1.12,
                weekendMultiplier: 1.25,
                minNights: 1,
                active: true,
            },
            {
                hotelId: String(hotel._id),
                name: 'Non-refundable saver',
                refundable: false,
                breakfastIncluded: false,
                weekdayMultiplier: 0.9,
                weekendMultiplier: 1,
                minNights: 2,
                active: true,
            },
        ])
    );

    const physicalRooms = createdHotels.flatMap((hotel, hotelIndex) => {
        const roomsForHotel: Array<Record<string, unknown>> = [];
        roomBlueprints.forEach((room, roomTypeIndex) => {
            for (let index = 1; index <= Math.min(room.totalRooms, 4); index += 1) {
                const floor = roomTypeIndex + 1;
                roomsForHotel.push({
                    hotelId: String(hotel._id),
                    roomType: room.type,
                    roomNumber: `${hotelIndex + 1}${floor}${String(index).padStart(2, '0')}`,
                    floor,
                    status: index === 4 ? 'dirty' : 'available',
                });
            }
        });
        return roomsForHotel;
    });
    const createdPhysicalRooms = await PhysicalRoomModel.insertMany(physicalRooms);

    await HousekeepingTaskModel.insertMany(
        createdPhysicalRooms
            .filter((room) => room.status === 'dirty')
            .map((room) => ({
                hotelId: room.hotelId,
                physicalRoomId: String(room._id),
                title: 'Prepare room for next guest',
                status: 'open',
                priority: 'normal',
                dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
            }))
    );

    const createdUsers = await UserModel.create([
        {
            email: 'admin@hotel.test',
            password: 'Admin123',
            role: 'admin',
        },
        {
            email: 'guest@hotel.test',
            password: 'Guest123',
            role: 'user',
        },
    ]);

    await GuestProfileModel.create({
        userId: String(createdUsers[1]._id),
        fullName: 'Guest Demo',
        email: 'guest@hotel.test',
        phone: '+591 70000000',
        documentId: 'GUEST-DEMO-001',
        country: 'Bolivia',
        preferences: 'Quiet room, late check-in if available',
        notes: 'Seed guest profile for demos.',
    });

    console.log('Seed completed');
    console.log('Admin: admin@hotel.test / Admin123');
    console.log('Guest: guest@hotel.test / Guest123');

    await mongoose.disconnect();
}

seed().catch(async (error) => {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
});
