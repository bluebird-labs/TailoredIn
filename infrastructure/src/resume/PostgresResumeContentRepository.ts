import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { ResumeContent, type ResumeContentRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresResumeContentRepository implements ResumeContentRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findById(id: string): Promise<ResumeContent | null> {
    return this.orm.em.findOne(ResumeContent, { id });
  }

  public async findLatestByJobDescriptionId(jobDescriptionId: string): Promise<ResumeContent | null> {
    return this.orm.em.findOne(ResumeContent, { jobDescriptionId }, { orderBy: { createdAt: 'DESC' } });
  }

  public async save(resumeContent: ResumeContent): Promise<void> {
    this.orm.em.persist(resumeContent);
    await this.orm.em.flush();
  }

  public async update(resumeContent: ResumeContent): Promise<void> {
    const existing = await this.orm.em.findOneOrFail(ResumeContent, { id: resumeContent.id });
    this.orm.em.assign(existing, {
      experiences: resumeContent.experiences,
      hiddenEducationIds: resumeContent.hiddenEducationIds,
      score: resumeContent.score,
      updatedAt: resumeContent.updatedAt
    });
    await this.orm.em.flush();
  }
}
