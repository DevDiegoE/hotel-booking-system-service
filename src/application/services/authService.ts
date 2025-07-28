import { inject, injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';

import { UserModel } from '../../infrastructure/database/mongoose/userModel.ts';
import { User } from '../../domain/entities/user.ts';
import { UserService } from './userService.ts';

@injectable()
export class AuthService {

    constructor(@inject(UserService) private readonly userService: UserService) {}

    async register(user: User): Promise<User> {
        const existingUser = await this.userService.findByEmail(user.email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        return this.userService.create(user);
    }

    async login(email: string, password: string): Promise<string | null> {
        const user = await UserModel.findOne({ email });
        if (!user || !(await user.comparePassword(password))) return null;

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            {
                expiresIn: '1h',
            }
        );
        return token;
    }
}
