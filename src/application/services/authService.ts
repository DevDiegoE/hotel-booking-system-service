import { inject, injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';

import { UserModel } from '../../infrastructure/database/mongoose/userModel.ts';
import { User } from '../../domain/entities/user.ts';
import { UserService } from './userService.ts';
import { ValidationException } from '../../domain/exceptions/DomainException.ts';
import { getJwtSecret } from '../../../config/env.ts';

export interface AuthSession {
    token: string;
    user: {
        id: string;
        email: string;
        role: 'user' | 'admin';
    };
}

@injectable()
export class AuthService {
    constructor(@inject(UserService) private readonly userService: UserService) {}

    async register(user: User): Promise<AuthSession> {
        if (!user.email || !user.password) {
            throw new ValidationException('Email and password are required');
        }
        const existingUser = await this.userService.findByEmail(user.email);
        if (existingUser) {
            throw new ValidationException('User already exists');
        }
        const createdUser = await this.userService.create(user);
        return this.createSession(createdUser);
    }

    async login(email: string, password: string): Promise<AuthSession | null> {
        if (!email || !password) {
            throw new ValidationException('Email and password are required');
        }
        const user = await UserModel.findOne({ email });
        if (!user || !(await user.comparePassword(password))) return null;

        return this.createSession({
            _id: String(user._id),
            email: user.email,
            password: user.password,
            role: user.role,
        });
    }

    private createSession(user: User): AuthSession {
        const userId = user._id?.toString();
        if (!userId) {
            throw new ValidationException('User ID is required to create a session');
        }

        const role = user.role || 'user';
        const token = jwt.sign(
            {
                id: userId,
                email: user.email,
                role,
            },
            getJwtSecret(),
            { expiresIn: '1h' }
        );

        return {
            token,
            user: {
                id: userId,
                email: user.email,
                role,
            },
        };
    }
}
