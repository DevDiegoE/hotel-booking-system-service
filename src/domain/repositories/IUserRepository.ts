import { ICrudRepository } from './ICrudRepository.ts';
import { User } from '../entities/user.ts';

export interface IUserRepository extends ICrudRepository<User> {
    findByEmail(email: string): Promise<User | null>;
}
