import { injectable } from 'tsyringe';

import { IRoomRepository } from '../../../../domain/repositories/IRoomRepository.ts';
import { Room } from '../../../../domain/entities/room.ts';
import { RoomModel } from '../roomModel.ts';

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
        const rooms = await RoomModel.find({
            hotelId,
            $or: [
                { 'availability.checkInDate': { $gt: checkOutDate } },
                { 'availability.checkOutDate': { $lt: checkInDate } },
                { availability: { $exists: false } },
            ],
        });
        return rooms.map((room) => room.toObject() as Room);
    }

    async findByTypeAndHotelId(type: string, hotelId: string): Promise<Room[]> {
        const rooms = await RoomModel.find({ type, hotelId });
        return rooms.map((room) => room.toObject() as Room);
    }
}
