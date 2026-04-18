import type { Account } from '../entities/Account.js';

export interface AccountRepository {
  findByEmail(email: string): Promise<Account | null>;
  findByIdOrFail(id: string): Promise<Account>;
  save(account: Account): Promise<void>;
}
