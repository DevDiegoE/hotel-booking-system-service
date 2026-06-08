import { inject, injectable } from 'tsyringe';

import { IBookingRepository } from '../../domain/repositories/IBookingRepository.ts';
import { IRoomRepository } from '../../domain/repositories/IRoomRepository.ts';
import { IHotelRepository } from '../../domain/repositories/IHotelRepository.ts';
import { Booking } from '../../domain/entities/booking.ts';
import {
    ValidationException,
    NotFoundException,
    BusinessRuleException,
} from '../../domain/exceptions/DomainException.ts';
import { BookingValidator } from '../../domain/validators/BookingValidator.ts';
import { CreateBookingUseCase } from '../../domain/use-cases/CreateBookingUseCase.ts';
import { UpdateBookingUseCase } from '../../domain/use-cases/UpdateBookingUseCase.ts';

interface BookingWithDetails extends Booking {
    id: string;
    hotelName: string;
    canCancel: boolean;
}

interface CancellationPolicy {
    canCancel: boolean;
    reason?: string;
}

interface CancellationResult {
    success: boolean;
    message: string;
    refundAmount?: number;
}

@injectable()
export class BookingService {
    constructor(
        @inject('BookingRepository') private readonly bookingRepository: IBookingRepository,
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository,
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository,
        @inject(CreateBookingUseCase) private readonly createBookingUseCase: CreateBookingUseCase,
        @inject(UpdateBookingUseCase) private readonly updateBookingUseCase: UpdateBookingUseCase
    ) {}

    async create(booking: Booking): Promise<Booking> {
        return (await this.createBookingUseCase.execute(booking as any)) as unknown as Booking;
    }

    async findAll(): Promise<Booking[]> {
        return this.bookingRepository.findAll();
    }

    async findById(id: string): Promise<Booking | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }
        return this.bookingRepository.findById(id);
    }

    async updateById(id: string, booking: Partial<Booking>): Promise<Booking | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }
        BookingValidator.validateUpdate(booking);
        return this.updateBookingUseCase.execute({
            id,
            data: booking,
        }) as unknown as Promise<Booking | null>;
    }

    async updateGuestBooking(
        id: string,
        data: Pick<Partial<Booking>, 'checkInDate' | 'checkOutDate' | 'guests'>
    ): Promise<Booking | null> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }

        const existing = await this.bookingRepository.findById(id);
        if (!existing) {
            throw new NotFoundException('Booking', id);
        }

        if (!['pending', 'confirmed'].includes(existing.status)) {
            throw new BusinessRuleException(
                `Cannot edit a booking with status ${existing.status}`
            );
        }

        const checkInDate = data.checkInDate ?? existing.checkInDate;
        const checkOutDate = data.checkOutDate ?? existing.checkOutDate;
        const totalPrice = await this.calculateTotalPrice(
            existing.hotelId,
            existing.roomSelections,
            checkInDate,
            checkOutDate
        );

        return this.updateById(id, {
            checkInDate,
            checkOutDate,
            guests: data.guests ?? existing.guests,
            totalPrice,
        });
    }

    async deleteById(id: string): Promise<void> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }
        const exists = await this.bookingRepository.findById(id);
        if (!exists) {
            throw new NotFoundException('Booking', id);
        }
        return this.bookingRepository.delete(id);
    }

    async cancelBookingById(id: string): Promise<CancellationResult> {
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }

        const booking = await this.bookingRepository.findById(id);
        if (!booking) {
            throw new NotFoundException('Booking', id);
        }

        const cancellationPolicy = this.canCancelBookingPolicy(booking);
        if (!cancellationPolicy.canCancel) {
            throw new BusinessRuleException(
                cancellationPolicy.reason || 'Cannot cancel this booking'
            );
        }

        await this.updateById(id, { status: 'cancelled' });

        const now = new Date();
        const checkInDate = new Date(booking.checkInDate);
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        let refundAmount = booking.totalPrice;
        if (hoursUntilCheckIn < 48) {
            refundAmount = booking.totalPrice * 0.5;
        }

        return {
            success: true,
            message: `Booking cancelled successfully. Refund of $${refundAmount.toFixed(2)} will be processed within 5-7 business days.`,
            refundAmount: refundAmount,
        };
    }

    async findByUserId(userId: string): Promise<Booking[]> {
        if (!userId || userId.trim().length === 0) {
            throw new ValidationException('User ID is required');
        }
        return this.bookingRepository.findByUserId(userId);
    }

    async findByHotelId(hotelId: string): Promise<Booking[]> {
        if (!hotelId || hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }
        return this.bookingRepository.findByHotelId(hotelId);
    }

    async findByRoomType(roomType: string): Promise<Booking[]> {
        if (!roomType || roomType.trim().length === 0) {
            throw new ValidationException('Room type is required');
        }
        return this.bookingRepository.findByRoomType(roomType);
    }

    async findByStatus(status: string): Promise<Booking[]> {
        if (!status) {
            throw new ValidationException('Status is required');
        }
        return this.bookingRepository.findByStatus(status);
    }

    async findByDateRange(checkInDate: Date, checkOutDate: Date): Promise<Booking[]> {
        if (!checkInDate || !checkOutDate) {
            throw new ValidationException('Check-in and check-out dates are required');
        }
        if (checkInDate >= checkOutDate) {
            throw new BusinessRuleException('Check-out date must be after check-in date');
        }
        return this.bookingRepository.findByDateRange(checkInDate, checkOutDate);
    }

    async checkRoomAvailability(
        hotelId: string,
        checkInDate: Date,
        checkOutDate: Date
    ): Promise<{ [roomType: string]: number }> {
        if (!hotelId || hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }
        if (!checkInDate || !checkOutDate) {
            throw new ValidationException('Check-in and check-out dates are required');
        }
        if (checkInDate >= checkOutDate) {
            throw new BusinessRuleException('Check-out date must be after check-in date');
        }

        const allRoomTypes = await this.roomRepository.findByHotelId(hotelId);

        const conflictingBookings = await this.bookingRepository.findByDateRange(
            checkInDate,
            checkOutDate
        );

        const availability: { [roomType: string]: number } = {};

        allRoomTypes.forEach((roomType) => {
            const occupiedCount = conflictingBookings
                .filter((b) => b.status !== 'cancelled' && b.hotelId === hotelId)
                .reduce((total, booking) => {
                    if (booking.roomSelections) {
                        const roomSelection = booking.roomSelections.find(
                            (rs) => rs.roomType === roomType.type
                        );
                        return total + (roomSelection?.quantity || 0);
                    } else {
                        const bookingRoomType = (booking as any).roomType;
                        const bookingQuantity = (booking as any).quantity || 1;
                        return total + (bookingRoomType === roomType.type ? bookingQuantity : 0);
                    }
                }, 0);

            availability[roomType.type] = Math.max(0, roomType.totalRooms - occupiedCount);
        });

        return availability;
    }

    async getUserBookingsWithDetails(userId: string): Promise<BookingWithDetails[]> {
        if (!userId || userId.trim().length === 0) {
            throw new ValidationException('User ID is required');
        }

        const bookings = await this.bookingRepository.findByUserId(userId);

        // Group bookings by hotel, dates, and room type to consolidate old separate bookings
        const groupedBookings = this.groupBookingsByTypeAndDates(bookings);

        const enrichedBookings = await Promise.all(
            groupedBookings.map(async (booking) => {
                const canCancel = this.canCancelBookingPolicy(booking);

                // Get real hotel name
                let hotelName = 'Unknown Hotel';
                try {
                    const hotel = await this.hotelRepository.findById(booking.hotelId);
                    hotelName = hotel?.name || `Hotel ${booking.hotelId}`;
                } catch (error) {
                    console.warn(`Could not fetch hotel details for ID: ${booking.hotelId}`, error);
                    hotelName = `Hotel ${booking.hotelId}`;
                }

                return {
                    ...booking,
                    id: booking._id || '',
                    hotelName: hotelName,
                    canCancel: canCancel.canCancel,
                    // Calculate total quantity from roomSelections
                    quantity: booking.roomSelections
                        ? booking.roomSelections.reduce((total, rs) => total + rs.quantity, 0)
                        : (booking as any).quantity || 1, // Fallback for old bookings
                };
            })
        );

        return enrichedBookings;
    }

    private groupBookingsByTypeAndDates(bookings: Booking[]): Booking[] {
        const groupedMap = new Map<string, Booking>();

        bookings.forEach((booking) => {
            if (booking.roomSelections && booking.roomSelections.length > 0) {
                const key =
                    booking._id ||
                    `${booking.hotelId}-${booking.checkInDate.toISOString()}-${booking.checkOutDate.toISOString()}-${booking.status}`;
                groupedMap.set(key, booking);
            } else {
                const roomType = (booking as any).roomType;
                const key = `${booking.hotelId}-${booking.checkInDate.toISOString()}-${booking.checkOutDate.toISOString()}-${roomType}-${booking.status}`;

                if (groupedMap.has(key)) {
                    const existingBooking = groupedMap.get(key)!;
                    const existingQuantity = (existingBooking as any).quantity || 1;
                    const currentQuantity = (booking as any).quantity || 1;
                    (existingBooking as any).quantity = existingQuantity + currentQuantity;
                    existingBooking.totalPrice += booking.totalPrice;
                } else {
                    groupedMap.set(key, {
                        ...booking,
                        quantity: (booking as any).quantity || 1,
                    } as any);
                }
            }
        });

        return Array.from(groupedMap.values());
    }

    async canCancelBooking(bookingId: string): Promise<CancellationPolicy> {
        if (!bookingId || bookingId.trim().length === 0) {
            throw new ValidationException('Booking ID is required');
        }

        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking', bookingId);
        }

        return this.canCancelBookingPolicy(booking);
    }

    private canCancelBookingPolicy(booking: Booking): CancellationPolicy {
        if (booking.status === 'cancelled') {
            return { canCancel: false, reason: 'Booking is already cancelled' };
        }

        if (['checked-in', 'completed', 'no-show'].includes(booking.status)) {
            return {
                canCancel: false,
                reason: `Cannot cancel a booking with status ${booking.status}`,
            };
        }

        const now = new Date();
        const checkInDate = new Date(booking.checkInDate);
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilCheckIn < 24) {
            return {
                canCancel: false,
                reason: 'Cannot cancel bookings less than 24 hours before check-in',
            };
        }

        return { canCancel: true };
    }

    private async calculateTotalPrice(
        hotelId: string,
        roomSelections: Booking['roomSelections'],
        checkInDate: Date,
        checkOutDate: Date
    ): Promise<number> {
        if (checkInDate >= checkOutDate) {
            throw new BusinessRuleException('Check-out date must be after check-in date');
        }

        const days = Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        let totalPrice = 0;

        for (const selection of roomSelections) {
            const roomTypes = await this.roomRepository.findByTypeAndHotelId(
                selection.roomType,
                hotelId
            );
            const roomType = roomTypes[0];
            if (!roomType) {
                throw new BusinessRuleException(
                    `No rooms of type ${selection.roomType} available in this hotel`
                );
            }

            let pricePerRoom = roomType.basePrice * days;
            if (selection.quantity >= 3) {
                pricePerRoom *= 0.9;
            }
            totalPrice += pricePerRoom * selection.quantity;
        }

        return Math.round(totalPrice * 100) / 100;
    }
}
