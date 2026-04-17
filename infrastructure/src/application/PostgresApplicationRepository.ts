import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { Application, type ApplicationRepository, EntityNotFoundError } from '@tailoredin/domain';

@Injectable()
export class PostgresApplicationRepository implements ApplicationRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findById(id: string): Promise<Application | null> {
    return this.orm.em.findOne(Application, { id });
  }

  public async findByProfileId(profileId: string): Promise<Application[]> {
    return this.orm.em.find(Application, { profileId }, { orderBy: { appliedAt: 'DESC' } });
  }

  public async save(application: Application): Promise<void> {
    this.orm.em.persist(application);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const entity = await this.orm.em.findOne(Application, { id });
    if (!entity) {
      throw new EntityNotFoundError('Application', id);
    }
    this.orm.em.remove(entity);
    await this.orm.em.flush();
  }
}
