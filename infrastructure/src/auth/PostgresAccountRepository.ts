import { MikroORM, NotFoundError } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Account, type AccountRepository, EntityNotFoundError } from '@tailoredin/domain';

@injectable()
export class PostgresAccountRepository implements AccountRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByEmail(email: string): Promise<Account | null> {
    return this.orm.em.findOne(Account, { email });
  }

  public async findByIdOrFail(id: string): Promise<Account> {
    try {
      return await this.orm.em.findOneOrFail(Account, { id });
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Account', id);
      throw e;
    }
  }

  public async save(account: Account): Promise<void> {
    this.orm.em.persist(account);
    await this.orm.em.flush();
  }
}
