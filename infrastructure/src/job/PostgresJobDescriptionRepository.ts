import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { EntityNotFoundError, JobDescription, type JobDescriptionRepository } from '@tailoredin/domain';

@injectable()
export class PostgresJobDescriptionRepository implements JobDescriptionRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<JobDescription[]> {
    return this.orm.em.find(JobDescription, {}, { orderBy: { createdAt: 'DESC' } });
  }

  public async findById(id: string): Promise<JobDescription | null> {
    return this.orm.em.findOne(JobDescription, { id });
  }

  public async findByCompanyId(companyId: string): Promise<JobDescription[]> {
    return this.orm.em.find(JobDescription, { companyId }, { orderBy: { createdAt: 'DESC' } });
  }

  public async save(jd: JobDescription): Promise<void> {
    this.orm.em.persist(jd);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const entity = await this.orm.em.findOne(JobDescription, { id });
    if (!entity) {
      throw new EntityNotFoundError('JobDescription', id);
    }
    this.orm.em.remove(entity);
    await this.orm.em.flush();
  }
}
