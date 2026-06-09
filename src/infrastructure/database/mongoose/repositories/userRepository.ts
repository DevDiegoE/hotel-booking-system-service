import { injectable } from 'tsyringe';

import { IUserRepository } from '../../../../domain/repositories/IUserRepository.ts';
import { User } from '../../../../domain/entities/user.ts';
import { UserModel } from '../userModel.ts';

@injectable()
export class UserRepository implements IUserRepository {
    private toDomain(user: { toObject: () => unknown }): User {
        return user.toObject() as unknown as User;
    }

    async create(user: User): Promise<User> {
        const created = await UserModel.create(user);
        return this.toDomain(created);
    }

    async findAll(): Promise<User[]> {
        const users = await UserModel.find();
        return users.map((user) => this.toDomain(user));
    }

    async findById(id: string): Promise<User | null> {
        const user = await UserModel.findById(id);
        return user ? this.toDomain(user) : null;
    }
    async update(id: string, user: Partial<User>): Promise<User | null> {
        const updated = await UserModel.findByIdAndUpdate(id, user, { new: true });
        return updated ? this.toDomain(updated) : null;
    }
    async delete(id: string): Promise<void> {
        await UserModel.findByIdAndDelete(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        return user ? this.toDomain(user) : null;
    }
}
