import type { User } from '../entities/User.js';

export interface UserRepository {
  findByIdOrFail(id: string): Promise<User>;
  findSingle(): Promise<User>;
  save(user: User): Promise<void>;
}
