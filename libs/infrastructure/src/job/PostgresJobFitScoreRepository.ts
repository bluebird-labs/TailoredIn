import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { JobFitRequirement, JobFitScore, type JobFitScoreRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresJobFitScoreRepository implements JobFitScoreRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findByJobDescriptionId(jobDescriptionId: string): Promise<JobFitScore | null> {
    return this.orm.em.findOne(
      JobFitScore,
      { jobDescriptionId },
      { populate: ['requirements'], orderBy: { requirements: { ordinal: 'ASC' } } }
    );
  }

  public async findByJobDescriptionIds(jobDescriptionIds: string[]): Promise<JobFitScore[]> {
    if (jobDescriptionIds.length === 0) return [];
    return this.orm.em.find(
      JobFitScore,
      { jobDescriptionId: { $in: jobDescriptionIds } },
      { populate: ['requirements'], orderBy: { requirements: { ordinal: 'ASC' } } }
    );
  }

  public async save(score: JobFitScore): Promise<void> {
    const existing = await this.orm.em.findOne(JobFitScore, {
      profileId: score.profileId,
      jobDescriptionId: score.jobDescriptionId
    });

    if (existing) {
      await this.orm.em.nativeDelete(JobFitRequirement, { jobFitScoreId: existing.id });
      await this.orm.em.nativeDelete(JobFitScore, { id: existing.id });
    }

    this.orm.em.persist(score);
    await this.orm.em.flush();
  }
}
