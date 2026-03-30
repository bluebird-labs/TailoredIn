import type { User } from '@tailoredin/domain';

export interface UserRepository {
  findByIdOrFail(id: string): Promise<User>;
  findSingle(): Promise<User>;
  save(user: User): Promise<void>;
}
