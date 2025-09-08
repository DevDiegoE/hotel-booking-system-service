import { injectable } from 'tsyringe';

import {
    IRoomRepository,
    RoomSearchFilters,
} from '../../../../domain/repositories/IRoomRepository.ts';
import { Room } from '../../../../domain/entities/room.ts';
import { RoomModel } from '../roomModel.ts';
import { HotelModel } from '../hotelModel.ts';
import { BookingModel } from '../bookingModel.ts';

@injectable()
export class RoomRepository implements IRoomRepository {
    async create(room: Room): Promise<Room> {
        const created = await RoomModel.create(room);
        return created.toObject() as Room;
    }

    async findAll(): Promise<Room[]> {
        const rooms = await RoomModel.find();
        return rooms.map((room) => room.toObject() as Room);
    }

    async findById(id: string): Promise<Room | null> {
        const room = await RoomModel.findById(id);
        return room ? (room.toObject() as Room) : null;
    }

    async update(id: string, room: Partial<Room>): Promise<Room | null> {
        const updated = await RoomModel.findByIdAndUpdate(id, room, { new: true });
        return updated ? (updated.toObject() as Room) : null;
    }

    async delete(id: string): Promise<void> {
        await RoomModel.findByIdAndDelete(id);
    }

    async findByHotelId(hotelId: string): Promise<Room[]> {
        const rooms = await RoomModel.find({ hotelId });
        return rooms.map((room) => room.toObject() as Room);
    }

    async findAvailableRooms(
        hotelId: string,
        checkInDate: Date,
        checkOutDate: Date
    ): Promise<Room[]> {
        const hotelRooms = await RoomModel.find({ hotelId });
        const roomIds = hotelRooms.map((r) => (r as any)._id.toString());

        const overlappingBookings = await BookingModel.find({
            roomId: { $in: roomIds },
            status: { $ne: 'cancelled' },
            $or: [{ checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } }],
        }).select('roomId');

        const bookedRoomIds = new Set(overlappingBookings.map((b) => (b as any).roomId.toString()));

        const availableRooms = hotelRooms.filter(
            (room) => !bookedRoomIds.has((room as any)._id.toString())
        );
        return availableRooms.map((room) => room.toObject() as Room);
    }

    async findByTypeAndHotelId(type: string, hotelId: string): Promise<Room[]> {
        const rooms = await RoomModel.find({ type, hotelId });
        return rooms.map((room) => room.toObject() as Room);
    }

    async findByCapacity(minCapacity: number): Promise<Room[]> {
        const rooms = await RoomModel.find({ capacity: { $gte: minCapacity } });
        return rooms.map((room) => room.toObject() as Room);
    }

    async findByPriceRange(minPrice?: number, maxPrice?: number): Promise<Room[]> {
        const priceCond: any = {};
        if (minPrice !== undefined) priceCond.$gte = minPrice;
        if (maxPrice !== undefined) priceCond.$lte = maxPrice;
        const rooms = await RoomModel.find(
            Object.keys(priceCond).length ? { basePrice: priceCond } : {}
        );
        return rooms.map((room) => room.toObject() as Room);
    }

    async findByHotelLocation(location: string): Promise<Room[]> {
        const trimmed = location.trim();
        const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const hotels = await HotelModel.find({ location: regex }).select('_id');
        if (hotels.length === 0) return [];
        const hotelIds = hotels.map((h) => (h as any)._id.toString());
        const rooms = await RoomModel.find({ hotelId: { $in: hotelIds } });
        return rooms.map((room) => room.toObject() as Room);
    }

    async search(filters: RoomSearchFilters): Promise<Room[]> {
        const query: any = {};
        if (filters.hotelId) query.hotelId = filters.hotelId;
        if (filters.type) query.type = filters.type;
        if (filters.minCapacity !== undefined) query.capacity = { $gte: filters.minCapacity };
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            query.basePrice = {} as any;
            if (filters.minPrice !== undefined) query.basePrice.$gte = filters.minPrice;
            if (filters.maxPrice !== undefined) query.basePrice.$lte = filters.maxPrice;
        }

        if (filters.amenities && filters.amenities.length > 0) {
            query.amenities = { $all: filters.amenities };
        }

        if (filters.location) {
            const parts = filters.location
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean);
            const regexes = parts.map(
                (p) => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
            );
            const hotels = await HotelModel.find({ location: { $in: regexes } }).select('_id');
            if (hotels.length === 0) return [];
            const hotelIds = hotels.map((h) => (h as any)._id.toString());
            if (query.hotelId) {
                if (typeof query.hotelId === 'string' && !hotelIds.includes(query.hotelId)) {
                    return [];
                }
            } else {
                query.hotelId = { $in: hotelIds };
            }
        }

        let rooms = await RoomModel.find(query);

        if (filters.checkInDate && filters.checkOutDate) {
            const roomIds = rooms.map((r) => (r as any)._id.toString());

            const overlappingBookings = await BookingModel.find({
                roomId: { $in: roomIds },
                status: { $ne: 'cancelled' },
                $or: [
                    {
                        checkInDate: { $lt: filters.checkOutDate },
                        checkOutDate: { $gt: filters.checkInDate },
                    },
                ],
            }).select('roomId');

            const bookedRoomIds = new Set(
                overlappingBookings.map((b) => (b as any).roomId.toString())
            );
            rooms = rooms.filter((room) => !bookedRoomIds.has((room as any)._id.toString()));
        }

        const roomsWithHotelInfo = await Promise.all(
            rooms.map(async (room) => {
                const hotel = await HotelModel.findById(room.hotelId).select(
                    'name location rating'
                );
                const roomObj = room.toObject() as any;
                if (hotel) {
                    roomObj.hotelName = hotel.name;
                    roomObj.hotelLocation = hotel.location;
                    roomObj.hotelRating = hotel.rating;
                    return roomObj;
                }
                return null;
            })
        );

        const validRooms = roomsWithHotelInfo.filter((room) => room !== null);
        return validRooms;
    }
}
