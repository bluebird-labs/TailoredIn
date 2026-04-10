import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Application, type ApplicationId, type ApplicationRepository, EntityNotFoundError } from '@tailoredin/domain';

@injectable()
export class PostgresApplicationRepository implements ApplicationRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findById(id: ApplicationId): Promise<Application | null> {
    // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
    return this.orm.em.findOne(Application, { id: id.value } as any);
  }

  public async findByProfileId(profileId: string): Promise<Application[]> {
    return this.orm.em.find(Application, { profileId }, { orderBy: { appliedAt: 'DESC' } });
  }

  public async save(application: Application): Promise<void> {
    this.orm.em.persist(application);
    await this.orm.em.flush();
  }

  public async delete(id: ApplicationId): Promise<void> {
    // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
    const orm = await this.orm.em.findOne(Application, { id: id.value } as any);
    if (!orm) {
      throw new EntityNotFoundError('Application', id.value);
    }
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }
}
