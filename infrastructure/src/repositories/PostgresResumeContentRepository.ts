import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { ResumeContent, type ResumeContentRepository } from '@tailoredin/domain';

@injectable()
export class PostgresResumeContentRepository implements ResumeContentRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findLatestByJobDescriptionId(jobDescriptionId: string): Promise<ResumeContent | null> {
    return this.orm.em.findOne(ResumeContent, { jobDescriptionId }, { orderBy: { createdAt: 'DESC' } });
  }

  public async save(resumeContent: ResumeContent): Promise<void> {
    this.orm.em.persist(resumeContent);
    await this.orm.em.flush();
  }

  public async update(resumeContent: ResumeContent): Promise<void> {
    // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
    const existing = await this.orm.em.findOneOrFail(ResumeContent, { id: resumeContent.id.value } as any);
    this.orm.em.assign(existing, {
      experiences: resumeContent.experiences,
      hiddenEducationIds: resumeContent.hiddenEducationIds,
      updatedAt: resumeContent.updatedAt
    });
    await this.orm.em.flush();
  }
}
