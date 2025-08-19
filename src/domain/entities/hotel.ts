export interface Hotel {
    name: string;
    location: string;
    description?: string;
    rating?: number;
    imageUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
