import type { FindOptions, SqlEntityManager, UpsertOptions } from '@mikro-orm/postgresql';
import { BaseRepository } from '../../BaseRepository.js';
import type { QueryOpts } from '../../helpers.js';
import type { Company } from '../companies/Company.js';
import { Job, type JobProps } from './Job.js';
import { JobStatus } from './JobStatus.js';

export class JobOrmRepository extends BaseRepository<Job> {
  public async findByIdWithCompany<Hint extends string = never>(
    jobId: string,
    opts: QueryOpts & FindOptions<Job, Hint> = {}
  ): Promise<(Job & { company: Company }) | null> {
    const job = await this.getEm(opts).findOne(Job, jobId, { ...opts, populate: ['company'] as never[] });
    if (!job) return null;
    return job as Job & { company: Company };
  }

  public async findPaginated(
    params: {
      limit: number;
      offset: number;
      statuses?: string[];
      businessTypes?: string[];
      industries?: string[];
      stages?: string[];
      sort: string;
    },
    opts: QueryOpts = {}
  ): Promise<{
    items: Array<Job & { __companyId: string; __companyName: string }>;
    total: number;
  }> {
    const em = this.getEm(opts) as SqlEntityManager;
    const [, sortDirection] = params.sort.split(':');
    const sortDir = sortDirection === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause
    const where: Record<string, unknown> = {};
    if (params.statuses?.length) where.status = { $in: params.statuses };
    if (params.businessTypes?.length)
      where.company = { ...((where.company as object) ?? {}), businessType: { $in: params.businessTypes } };
    if (params.industries?.length)
      where.company = { ...((where.company as object) ?? {}), industry: { $in: params.industries } };
    if (params.stages?.length) where.company = { ...((where.company as object) ?? {}), stage: { $in: params.stages } };

    const [jobs, total] = await em.findAndCount(Job, where, {
      ...opts,
      populate: ['company'] as never[],
      orderBy: { postedAt: sortDir as 'ASC' | 'DESC' },
      limit: params.limit,
      offset: params.offset
    });

    const items = jobs.map(job => {
      const company = job.company as Company;
      return Object.assign(job, {
        __companyId: company.id,
        __companyName: company.name
      });
    });

    return { items, total };
  }

  public async upsert(
    props: Omit<JobProps, 'id' | 'createdAt' | 'updatedAt'> & { company: Company },
    opts: QueryOpts = {}
  ): Promise<Job> {
    const excludeFields: UpsertOptions<Job, keyof JobProps>['onConflictExcludeFields'] = ['createdAt'];

    if (props.status === JobStatus.NEW) {
      excludeFields.push('status');
    }

    return this.getEm(opts).upsert(Job, props, {
      onConflictAction: 'merge',
      onConflictExcludeFields: excludeFields
    });
  }

  public async retireOlderThan(olderThan: Date, opts: QueryOpts = {}): Promise<number> {
    return this.getEm(opts).transactional(async em => {
      const retirableJobs = await em.find(Job, {
        postedAt: { $lt: olderThan },
        status: JobStatus.NEW
      });

      if (retirableJobs.length === 0) return 0;

      for (const job of retirableJobs) {
        job.status = JobStatus.RETIRED;
        em.persist(job);
      }

      await em.flush();
      return retirableJobs.length;
    });
  }
}
