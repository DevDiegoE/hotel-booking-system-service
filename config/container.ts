import { container } from 'tsyringe';

import { IHotelRepository } from '../src/domain/repositories/IHotelRepository.ts';
import { HotelRepository } from '../src/infrastructure/database/mongoose/repositories/hotelRepository.ts';
import { IRoomRepository } from '../src/domain/repositories/IRoomRepository.ts';
import { RoomRepository } from '../src/infrastructure/database/mongoose/repositories/roomRepository.ts';
import { IBookingRepository } from '../src/domain/repositories/IBookingRepository.ts';
import { BookingRepository } from '../src/infrastructure/database/mongoose/repositories/bookingRepository.ts';
import { IPromotionRepository } from '../src/domain/repositories/IPromotionRepository.ts';
import { PromotionRepository } from '../src/infrastructure/database/mongoose/repositories/promotionRepository.ts';

container.register<IHotelRepository>('HotelRepository', {
    useClass: HotelRepository,
});

container.register<IRoomRepository>('RoomRepository', {
    useClass: RoomRepository,
});

container.register<IBookingRepository>('BookingRepository', {
    useClass: BookingRepository,
});

container.register<IPromotionRepository>('PromotionRepository', {
    useClass: PromotionRepository,
});