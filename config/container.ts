import { container } from 'tsyringe';

import { IHotelRepository } from '../src/domain/repositories/IHotelRepository.ts';
import { HotelRepository } from '../src/infrastructure/database/mongoose/repositories/hotelRepository.ts';
import { IRoomRepository } from '../src/domain/repositories/IRoomRepository.ts';
import { RoomRepository } from '../src/infrastructure/database/mongoose/repositories/roomRepository.ts';
import { IBookingRepository } from '../src/domain/repositories/IBookingRepository.ts';
import { BookingRepository } from '../src/infrastructure/database/mongoose/repositories/bookingRepository.ts';
import { IPromotionRepository } from '../src/domain/repositories/IPromotionRepository.ts';
import { PromotionRepository } from '../src/infrastructure/database/mongoose/repositories/promotionRepository.ts';
import { UserRepository } from '../src/infrastructure/database/mongoose/repositories/userRepository.ts';
import { IUserRepository } from '../src/domain/repositories/IUserRepository.ts';
import { UserService } from '../src/application/services/userService.ts';
import { AuthService } from '../src/application/services/authService.ts';
import { HotelService } from '../src/application/services/hotelService.ts';
import { BookingService } from '../src/application/services/bookingService.ts';
import { RoomService } from '../src/application/services/roomService.ts';
import { PromotionService } from '../src/application/services/promotionService.ts';

import { CreateHotelUseCase } from '../src/domain/use-cases/CreateHotelUseCase.ts';
import { CreateBookingUseCase } from '../src/domain/use-cases/CreateBookingUseCase.ts';
import { UpdateBookingUseCase } from '../src/domain/use-cases/UpdateBookingUseCase.ts';
import { CreateRoomUseCase } from '../src/domain/use-cases/CreateRoomUseCase.ts';
import { UpdateRoomUseCase } from '../src/domain/use-cases/UpdateRoomUseCase.ts';

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

container.register<IUserRepository>('UserRepository', {
    useClass: UserRepository,
});

container.register(CreateHotelUseCase, { useClass: CreateHotelUseCase });
container.register(CreateBookingUseCase, { useClass: CreateBookingUseCase });
container.register(UpdateBookingUseCase, { useClass: UpdateBookingUseCase });
container.register(CreateRoomUseCase, { useClass: CreateRoomUseCase });
container.register(UpdateRoomUseCase, { useClass: UpdateRoomUseCase });

container.register(UserService, { useClass: UserService });
container.register(AuthService, { useClass: AuthService });
container.register(HotelService, { useClass: HotelService });
container.register(BookingService, { useClass: BookingService });
container.register(RoomService, { useClass: RoomService });
container.register(PromotionService, { useClass: PromotionService });
