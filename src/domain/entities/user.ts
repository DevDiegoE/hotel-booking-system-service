export interface User {
    email: string;
    password: string;
    role?: 'user' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
}
