import { inject, injectable } from 'tsyringe';

import { IRoomRepository, RoomSearchFilters } from '../../domain/repositories/IRoomRepository.ts';
import { Room } from '../../domain/entities/room.ts';
import { ValidationException, NotFoundException } from '../../domain/exceptions/DomainException.ts';
import { RoomValidator } from '../../domain/validators/RoomValidator.ts';
import { CreateRoomUseCase } from '../../domain/use-cases/CreateRoomUseCase.ts';
import { UpdateRoomUseCase } from '../../domain/use-cases/UpdateRoomUseCase.ts';

@injectable()
export class RoomService {
    constructor(
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository,
        @inject(CreateRoomUseCase) private readonly createRoomUseCase: CreateRoomUseCase,
        @inject(UpdateRoomUseCase) private readonly updateRoomUseCase: UpdateRoomUseCase
    ) {}

    async create(roomData: Room): Promise<Room> {
        return this.createRoomUseCase.execute(roomData);
    }

    async findAll(): Promise<Room[]> {
        return this.roomRepository.findAll();
    }

    async findById(id: string): Promise<Room | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Room ID is required');
        }
        return this.roomRepository.findById(id);
    }

    async updateById(id: string, roomData: Partial<Room>): Promise<Room | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Room ID is required');
        }
        RoomValidator.validateUpdate(roomData);

        return this.updateRoomUseCase.execute({ id, data: roomData });
    }

    async deleteById(id: string): Promise<void> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Room ID is required');
        }
        const exists = await this.roomRepository.findById(id);
        if (!exists) {
            throw new NotFoundException('Room', id);
        }
        return this.roomRepository.delete(id);
    }

    async findByHotelId(hotelId: string): Promise<Room[]> {
        if (!hotelId || hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }
        return this.roomRepository.findByHotelId(hotelId);
    }

    async findAvailableRooms(
        hotelId: string,
        checkInDate: Date,
        checkOutDate: Date
    ): Promise<Room[]> {
        if (!hotelId || hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }
        if (!checkInDate || !checkOutDate) {
            throw new ValidationException('Check-in and check-out dates are required');
        }
        if (checkInDate >= checkOutDate) {
            throw new ValidationException('Check-out date must be after check-in date');
        }
        return this.roomRepository.findAvailableRooms(hotelId, checkInDate, checkOutDate);
    }

    async findByTypeAndHotelId(type: string, hotelId: string): Promise<Room[]> {
        if (!type) throw new ValidationException('Type is required');
        if (!hotelId) throw new ValidationException('Hotel ID is required');
        return this.roomRepository.findByTypeAndHotelId(type, hotelId);
    }

    async search(filters: RoomSearchFilters): Promise<Room[]> {
        return this.roomRepository.search(filters);
    }
}
