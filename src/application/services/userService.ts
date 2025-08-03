import { inject, injectable } from 'tsyringe';

import { IUserRepository } from '../../domain/repositories/IUserRepository.ts';
import { User } from '../../domain/entities/user.ts';

@injectable()
export class UserService {
    constructor(@inject('UserRepository') private userRepository: IUserRepository) {}

    async create(user: User): Promise<User> {
        return this.userRepository.create(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findById(id);
    }

    async updateById(id: string, user: Partial<User>): Promise<User | null> {
        return this.userRepository.update(id, user);
    }

    async deleteById(id: string): Promise<void> {
        return this.userRepository.delete(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }
}
