export interface Booking {
    userId: string;
    hotelId: string;
    roomId: string;
    checkInDate: Date;
    checkOutDate: Date;
    totalPrice: number;
    guests?: {
        type?: 'adult' | 'child';
        count?: number;
    };
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt?: Date;
    updatedAt?: Date;
}
