import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type {
  FindPaginatedParams,
  JobListItem,
  JobRepository,
  PaginatedResult,
  UpsertJobProps
} from '@tailoredin/domain';
import {
  type BusinessType,
  CompanyId,
  type CompanyStage,
  Company as DomainCompany,
  type Industry,
  JobId,
  JobPosting
} from '@tailoredin/domain';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import { Job as OrmJob } from '../db/entities/jobs/Job.js';
import type { JobOrmRepository } from '../db/entities/jobs/JobOrmRepository.js';
import { JobStatusUpdate } from '../db/entities/jobs/JobStatusUpdate.js';

@injectable()
export class PostgresJobRepository implements JobRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findById(id: string): Promise<JobPosting | null> {
    const orm = await this.orm.em.findOne(OrmJob, id);
    return orm ? this.toDomain(orm) : null;
  }

  public async findByIdOrFail(id: string): Promise<JobPosting> {
    const orm = await this.orm.em.findOneOrFail(OrmJob, id);
    return this.toDomain(orm);
  }

  public async findByIdWithCompanyOrFail(jobId: string): Promise<{ job: JobPosting; company: DomainCompany }> {
    const repo = this.orm.em.getRepository(OrmJob) as JobOrmRepository;
    const result = await repo.findByIdWithCompany(jobId, { populate: ['company', 'statusUpdates'] });
    if (!result) throw new Error(`Job not found: ${jobId}`);
    const job = this.toDomain(result);
    const company = this.ormCompanyToDomain(result.company);
    return { job, company };
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
    const result = await repo.findPaginated({
      limit: params.limit,
      offset: params.offset,
      statuses: params.statuses,
      businessTypes: params.businessTypes,
      industries: params.industries,
      stages: params.stages,
      sort: params.sort
    });

    return {
      items: result.items.map(item => ({
        job: this.toDomain(item),
        companyId: item.__companyId,
        companyName: item.__companyName
      })),
      total: result.total
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

  private ormCompanyToDomain(orm: import('../db/entities/companies/Company.js').Company): DomainCompany {
    return new DomainCompany({
      id: new CompanyId(orm.id),
      name: orm.name,
      website: orm.website,
      logoUrl: orm.logoUrl,
      linkedinLink: orm.linkedinLink,
      ignored: orm.ignored,
      businessType: orm.businessType as BusinessType | null,
      industry: orm.industry as Industry | null,
      stage: orm.stage as CompanyStage | null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
