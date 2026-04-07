import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ResumeContent as DomainResumeContent,
  ResumeContentId,
  type ResumeContentRepository
} from '@tailoredin/domain';
import { JobDescription as OrmJobDescription } from '../db/entities/job-description/JobDescription.js';
import { Profile as OrmProfile } from '../db/entities/profile/Profile.js';
import { ResumeContent as OrmResumeContent } from '../db/entities/resume-content/ResumeContent.js';

@injectable()
export class PostgresResumeContentRepository implements ResumeContentRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findLatestByJobDescriptionId(jobDescriptionId: string): Promise<DomainResumeContent | null> {
    const orm = await this.orm.em.findOne(
      OrmResumeContent,
      { jobDescription: jobDescriptionId },
      { populate: ['profile', 'jobDescription'], orderBy: { createdAt: 'DESC' }, refresh: true }
    );
    return orm ? this.toDomain(orm) : null;
  }

  public async save(resumeContent: DomainResumeContent): Promise<void> {
    const profileRef = this.orm.em.getReference(OrmProfile, resumeContent.profileId);
    const jdRef = this.orm.em.getReference(OrmJobDescription, resumeContent.jobDescriptionId);

    const ormEntity = new OrmResumeContent({
      id: resumeContent.id.value,
      profile: profileRef,
      jobDescription: jdRef,
      headline: resumeContent.headline,
      experiences: resumeContent.experiences.map(e => ({
        experienceId: e.experienceId,
        summary: e.summary,
        bullets: e.bullets,
        hiddenBulletIndices: e.hiddenBulletIndices
      })),
      hiddenEducationIds: resumeContent.hiddenEducationIds,
      prompt: resumeContent.prompt,
      schema: resumeContent.schema,
      createdAt: resumeContent.createdAt,
      updatedAt: resumeContent.updatedAt
    });

    this.orm.em.persist(ormEntity);
    await this.orm.em.flush();
  }

  public async update(resumeContent: DomainResumeContent): Promise<void> {
    const existing = await this.orm.em.findOneOrFail(OrmResumeContent, resumeContent.id.value);
    existing.experiences = resumeContent.experiences.map(e => ({
      experienceId: e.experienceId,
      summary: e.summary,
      bullets: e.bullets,
      hiddenBulletIndices: e.hiddenBulletIndices
    }));
    existing.hiddenEducationIds = resumeContent.hiddenEducationIds;
    existing.updatedAt = resumeContent.updatedAt;
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmResumeContent): DomainResumeContent {
    const profileId = typeof orm.profile === 'string' ? orm.profile : (orm.profile as { id: string }).id;
    const jobDescriptionId =
      typeof orm.jobDescription === 'string' ? orm.jobDescription : (orm.jobDescription as { id: string }).id;

    return new DomainResumeContent({
      id: new ResumeContentId(orm.id),
      profileId,
      jobDescriptionId,
      headline: orm.headline,
      experiences: orm.experiences.map(e => ({
        experienceId: e.experienceId,
        summary: e.summary,
        bullets: e.bullets,
        hiddenBulletIndices: e.hiddenBulletIndices ?? []
      })),
      hiddenEducationIds: orm.hiddenEducationIds ?? [],
      prompt: orm.prompt,
      schema: orm.schema,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
