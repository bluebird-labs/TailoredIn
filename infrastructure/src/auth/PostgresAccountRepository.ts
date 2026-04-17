import { MikroORM, NotFoundError } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { Account, type AccountRepository, EntityNotFoundError } from '@tailoredin/domain';

@Injectable()
export class PostgresAccountRepository implements AccountRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

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
