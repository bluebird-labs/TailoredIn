import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  EntityNotFoundError,
  JobDescription,
  type JobDescriptionId,
  type JobDescriptionRepository
} from '@tailoredin/domain';

@injectable()
export class PostgresJobDescriptionRepository implements JobDescriptionRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<JobDescription[]> {
    return this.orm.em.find(JobDescription, {}, { orderBy: { createdAt: 'DESC' } });
  }

  public async findById(id: JobDescriptionId): Promise<JobDescription | null> {
    // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
    return this.orm.em.findOne(JobDescription, { id: id.value } as any);
  }

  public async findByCompanyId(companyId: string): Promise<JobDescription[]> {
    return this.orm.em.find(JobDescription, { companyId }, { orderBy: { createdAt: 'DESC' } });
  }

  public async save(jd: JobDescription): Promise<void> {
    this.orm.em.persist(jd);
    await this.orm.em.flush();
  }

  public async delete(id: JobDescriptionId): Promise<void> {
    // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
    const orm = await this.orm.em.findOne(JobDescription, { id: id.value } as any);
    if (!orm) {
      throw new EntityNotFoundError('JobDescription', id.value);
    }
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }
}
