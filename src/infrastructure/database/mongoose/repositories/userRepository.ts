import { injectable } from 'tsyringe';

import { IUserRepository } from '../../../../domain/repositories/IUserRepository.ts';
import { User } from '../../../../domain/entities/user.ts';
import { UserModel } from '../userModel.ts';

@injectable()
export class UserRepository implements IUserRepository {
    async create(user: User): Promise<User> {
        const created = await UserModel.create(user);
        return created.toObject() as User;
    }

    async findAll(): Promise<User[]> {
        const users = await UserModel.find();
        return users.map((user) => user.toObject() as User);
    }

    async findById(id: string): Promise<User | null> {
        const user = await UserModel.findById(id);
        return user ? (user.toObject() as User) : null;
    }
    async update(id: string, user: Partial<User>): Promise<User | null> {
        const updated = await UserModel.findByIdAndUpdate(id, user, { new: true });
        return updated ? (updated.toObject() as User) : null;
    }
    async delete(id: string): Promise<void> {
        await UserModel.findByIdAndDelete(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await UserModel.findOne({ email });
        return user ? user.toObject() : null;
    }
}
