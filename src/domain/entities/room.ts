export interface Room {
    _id?: string;
    hotelId: string;
    type: 'single-1' | 'single-2' | 'single-3' | 'suite-2' | 'suite-family';
    basePrice: number;
    amenities: string[];
    capacity: number;
    totalRooms: number;
    createdAt?: Date;
    updatedAt?: Date;
}
