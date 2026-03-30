import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import type {
  FindPaginatedParams,
  FindScoredParams,
  FindTopScoredParams,
  JobListItem,
  JobRepository,
  PaginatedResult,
  UpsertJobProps
} from '@tailoredin/domain';
import {
  type Company as DomainCompany,
  JobId,
  JobPosting,
  type JobScores,
  SkillAffinity,
  SkillId
} from '@tailoredin/domain';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import { Job as OrmJob } from '../db/entities/jobs/Job.js';
import type { JobListScoresProps, JobOrmRepository, JobScoresProps } from '../db/entities/jobs/JobOrmRepository.js';
import { JobStatusUpdate } from '../db/entities/jobs/JobStatusUpdate.js';
import { SkillAffinity as OrmSkillAffinity } from '../db/entities/skills/SkillAffinity.js';

@injectable()
export class PostgresJobRepository implements JobRepository {
  public constructor(private readonly orm: MikroORM) {}

  public async findById(id: string): Promise<JobPosting | null> {
    const orm = await this.orm.em.findOne(OrmJob, id);
    return orm ? this.toDomain(orm) : null;
  }

  public async findByIdOrFail(id: string): Promise<JobPosting> {
    const orm = await this.orm.em.findOneOrFail(OrmJob, id);
    return this.toDomain(orm);
  }

  public async findScoredByIdOrFail(params: FindScoredParams): Promise<{ job: JobPosting; companyName: string }> {
    const repo = this.orm.em.getRepository(OrmJob) as JobOrmRepository;
    const ormJob = await repo.findScoredByIdOrFail(
      { jobId: params.jobId, targetSalary: params.targetSalary },
      { populate: ['company', 'statusUpdates'] }
    );
    const job = this.toDomainWithScores(ormJob, ormJob.__scores);
    return { job, companyName: (ormJob.company as import('../db/entities/companies/Company.js').Company).name };
  }

  public async findTopScored(params: FindTopScoredParams): Promise<JobPosting[]> {
    const repo = this.orm.em.getRepository(OrmJob) as JobOrmRepository;
    const ormJobs = await repo.findTopScored(
      { top: params.top, targetSalary: params.targetSalary, hoursPostedMax: params.hoursPostedMax },
      { populate: ['company', 'statusUpdates'] }
    );
    return ormJobs.map(j => this.toDomainWithScores(j, j.__scores));
  }

  public async upsertByLinkedinId(props: UpsertJobProps, company: DomainCompany): Promise<JobPosting> {
    const ormCompany = await this.orm.em.findOneOrFail(OrmCompany, company.id.value);
    const repo = this.orm.em.getRepository(OrmJob) as JobOrmRepository;
    const ormJob = await repo.upsert({ ...props, company: ormCompany });
    await this.orm.em.flush();
    return this.toDomain(ormJob);
  }

  public async save(job: JobPosting): Promise<void> {
    const ormJob = await this.orm.em.findOneOrFail(OrmJob, job.id.value);
    ormJob.status = job.status as unknown as (typeof ormJob)['status'];
    ormJob.applyLink = job.applyLink;
    ormJob.updatedAt = job.updatedAt;

    // Persist status history for status changes via domain events
    for (const event of job.domainEvents) {
      if (event.eventName === 'job.status_changed') {
        const statusUpdate = JobStatusUpdate.create({ job: ormJob, status: ormJob.status });
        this.orm.em.persist(statusUpdate);
      }
    }

    this.orm.em.persist(ormJob);
    await this.orm.em.flush();
    job.clearDomainEvents();
  }

  public async findPaginated(params: FindPaginatedParams): Promise<PaginatedResult<JobListItem>> {
    const repo = this.orm.em.getRepository(OrmJob) as JobOrmRepository;
    const result = await repo.findPaginatedScored({
      page: params.page,
      pageSize: params.pageSize,
      targetSalary: params.targetSalary,
      statuses: params.statuses,
      sortBy: params.sortBy,
      expertWeight: params.expertWeight,
      interestWeight: params.interestWeight,
      avoidWeight: params.avoidWeight
    });

    return {
      items: result.items.map(item => ({
        job: this.toDomainWithListScores(item, item.__scores),
        companyName: item.__companyName
      })),
      total: result.total,
      page: params.page,
      pageSize: params.pageSize
    };
  }

  public async retireOlderThan(olderThan: Date): Promise<number> {
    const repo = this.orm.em.getRepository(OrmJob) as JobOrmRepository;
    return repo.retireOlderThan(olderThan);
  }

  // --- Mapping ---

  private toDomain(orm: OrmJob): JobPosting {
    return new JobPosting({
      id: new JobId(orm.id),
      companyId: orm.companyId,
      status: orm.status as unknown as JobPosting['status'],
      applyLink: orm.applyLink,
      linkedinId: orm.linkedinId,
      title: orm.title,
      linkedinLink: orm.linkedinLink,
      type: orm.type,
      level: orm.level,
      remote: orm.remote,
      postedAt: orm.postedAt,
      isRepost: orm.isRepost,
      locationRaw: orm.locationRaw,
      salaryLow: orm.salaryLow,
      salaryHigh: orm.salaryHigh,
      salaryRaw: orm.salaryRaw,
      description: orm.description,
      descriptionHtml: orm.descriptionHtml,
      applicantsCount: orm.applicantsCount,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }

  private toDomainWithListScores(orm: OrmJob, listScores: JobListScoresProps): JobPosting {
    const job = this.toDomain(orm);
    job.score({
      salary: listScores.salaryScore,
      skills: {
        total: { score: listScores.totalSkillScore, matches: [] },
        [SkillAffinity.EXPERT]: { score: listScores.expertScore, matches: [] },
        [SkillAffinity.INTEREST]: { score: 0, matches: [] },
        [SkillAffinity.AVOID]: { score: 0, matches: [] }
      }
    });
    return job;
  }

  private toDomainWithScores(orm: OrmJob, ormScores: JobScoresProps): JobPosting {
    const job = this.toDomain(orm);
    job.score(this.mapScores(ormScores));
    return job;
  }

  private mapScores(ormScores: JobScoresProps): JobScores {
    const mapAffinity = (affinity: OrmSkillAffinity) => ({
      score: ormScores.skills[affinity].score,
      matches: ormScores.skills[affinity].matches.map(
        s =>
          ({
            id: new SkillId(s.id),
            name: s.name,
            key: s.key,
            affinity: s.affinity as unknown as SkillAffinity,
            variants: s.variants,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            equals: () => false,
            domainEvents: [],
            clearDomainEvents: () => {},
            refresh: () => {}
          }) as unknown as import('@tailoredin/domain').Skill
      )
    });

    return {
      salary: ormScores.salary,
      skills: {
        total: {
          score: ormScores.skills.total.score,
          matches: ormScores.skills.total.matches.map(
            s =>
              ({
                id: new SkillId(s.id),
                name: s.name,
                key: s.key,
                affinity: s.affinity as unknown as SkillAffinity,
                variants: s.variants,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                equals: () => false
              }) as unknown as import('@tailoredin/domain').Skill
          )
        },
        [SkillAffinity.EXPERT]: mapAffinity(OrmSkillAffinity.EXPERT),
        [SkillAffinity.INTEREST]: mapAffinity(OrmSkillAffinity.INTEREST),
        [SkillAffinity.AVOID]: mapAffinity(OrmSkillAffinity.AVOID)
      }
    };
  }
}
