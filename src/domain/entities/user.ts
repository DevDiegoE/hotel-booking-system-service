export interface User {
    _id?: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
}
