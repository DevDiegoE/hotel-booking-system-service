export interface Room {
    hotelId: string;
    type: 'single-1' | 'single-2' | 'single-3' | 'suite-2' | 'suite-family';
    basePrice: number;
    amenities: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
