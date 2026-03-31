import type { FindOneOrFailOptions, FindOptions, SqlEntityManager, UpsertOptions } from '@mikro-orm/postgresql';
import { BaseRepository } from '../../BaseRepository.js';
import type { QueryOpts } from '../../helpers.js';
import type { Company } from '../companies/Company.js';
import { Skill } from '../skills/Skill.js';
import { SkillAffinity } from '../skills/SkillAffinity.js';
import { Job, type JobProps } from './Job.js';
import { findPaginatedScoredJobs, findTopScoredJobs, type ScoreResult, scoreJobById } from './JobScoringQueries.js';
import { JobStatus } from './JobStatus.js';

const SKILL_LIST_KEYS = ['expert_skills', 'interest_skills', 'avoid_skills'] as const satisfies (keyof ScoreResult)[];

const DEFAULT_WEIGHTS = {
  expertWeight: 8,
  interestWeight: 2,
  avoidWeight: 2
};

export type ScoredJob = Job & { scores: JobScoresProps };

export type JobListScoresProps = {
  expertScore: number;
  totalSkillScore: number;
  salaryScore: number | null;
};

export type JobScoresSkillScore = { score: number; matches: Skill[] };
export type JobScoresProps = {
  salary: number | null;
  skills: Record<SkillAffinity, JobScoresSkillScore> & { total: JobScoresSkillScore };
};

type WeightParams = { expertWeight: number; interestWeight: number; avoidWeight: number };

export class JobOrmRepository extends BaseRepository<Job> {
  public async findTopScored<Hint extends string = never>(
    params: {
      top: number;
      targetSalary: number;
      hoursPostedMax?: number;
      expertWeight?: number;
      interestWeight?: number;
      avoidWeight?: number;
    },
    opts: QueryOpts & FindOptions<Job, Hint> = {}
  ): Promise<Array<Job & { __scores: JobScoresProps }>> {
    const em = this.getEm(opts) as SqlEntityManager;
    const rows = await findTopScoredJobs(em, {
      top: params.top,
      targetSalary: params.targetSalary,
      hoursPostedMax: params.hoursPostedMax ?? 48,
      ...this.weights(params)
    });

    if (rows.length === 0) return [];

    const jobIds: string[] = [];
    const resultMap = new Map<string, ScoreResult>();
    const skillIds = new Set<string>();

    for (const row of rows) {
      jobIds.push(row.job_id);
      resultMap.set(row.job_id, row);
      for (const key of SKILL_LIST_KEYS) {
        for (const id of (row[key] as string[] | null) ?? []) skillIds.add(id);
      }
    }

    const [jobs, skills] = await Promise.all([
      em.repo(Job).find({ id: { $in: jobIds } }, opts),
      em.repo(Skill).find({ id: { $in: Array.from(skillIds) } })
    ]);

    const skillMap = new Map(skills.map(s => [s.id, s]));

    return jobs.map(job => {
      const row = resultMap.get(job.id)!;
      const scores = this.buildScores(row, skillMap);
      return Object.assign(job, { __scores: scores });
    });
  }

  public async findScoredByIdOrFail<Hint extends string = never>(
    params: {
      jobId: string;
      targetSalary: number;
      expertWeight?: number;
      interestWeight?: number;
      avoidWeight?: number;
    },
    opts: QueryOpts & FindOneOrFailOptions<Job, Hint> = {}
  ): Promise<Job & { __scores: JobScoresProps }> {
    const em = this.getEm(opts) as SqlEntityManager;
    const job = await em.findOneOrFail(Job, params.jobId, opts);
    const rows = await scoreJobById(em, {
      jobId: params.jobId,
      targetSalary: params.targetSalary,
      ...this.weights(params)
    });

    if (rows.length === 0) throw new Error(`Could not score job ${params.jobId}`);

    const row = rows[0];
    const skillIds = new Set<string>();
    for (const key of SKILL_LIST_KEYS) {
      for (const id of (row[key] as string[] | null) ?? []) skillIds.add(id);
    }

    const skills = await em.repo(Skill).find({ id: { $in: Array.from(skillIds) } });
    const skillMap = new Map(skills.map(s => [s.id, s]));
    const scores = this.buildScores(row, skillMap);

    return Object.assign(job, { __scores: scores });
  }

  public async findPaginatedScored(
    params: {
      limit: number;
      offset: number;
      targetSalary: number;
      statuses?: string[];
      businessTypes?: string[];
      industries?: string[];
      stages?: string[];
      sort: string;
      expertWeight?: number;
      interestWeight?: number;
      avoidWeight?: number;
    },
    opts: QueryOpts = {}
  ): Promise<{
    items: Array<Job & { __scores: JobListScoresProps; __companyId: string; __companyName: string }>;
    total: number;
  }> {
    const em = this.getEm(opts) as SqlEntityManager;
    const [sortField, sortDirection] = params.sort.split(':');
    const sortBy = sortField === 'posted_at' ? 'posted_at' : 'score';
    const sortDir = sortDirection === 'asc' ? 'asc' : 'desc';

    const rows = await findPaginatedScoredJobs(em, {
      limit: params.limit,
      offset: params.offset,
      targetSalary: params.targetSalary,
      statuses: params.statuses?.length ? params.statuses : null,
      businessTypes: params.businessTypes?.length ? params.businessTypes : null,
      industries: params.industries?.length ? params.industries : null,
      stages: params.stages?.length ? params.stages : null,
      sortBy,
      sortDir,
      ...this.weights(params)
    });

    if (rows.length === 0) return { items: [], total: 0 };

    const total = Number.parseInt(rows[0].total_count, 10);
    const jobIds = rows.map(r => r.job_id);
    const resultMap = new Map(rows.map(r => [r.job_id, r]));

    const jobs = await em.repo(Job).find({ id: { $in: jobIds } }, { ...opts, populate: ['company'] });
    const jobMap = new Map(jobs.map(j => [j.id, j]));

    const items = jobIds
      .map(id => {
        const job = jobMap.get(id);
        const row = resultMap.get(id)!;
        if (!job) return null;
        const scores: JobListScoresProps = {
          expertScore: row.expert_score ?? 0,
          totalSkillScore: row.total_skill_score ?? 0,
          salaryScore: row.salary_score
        };
        return Object.assign(job, { __scores: scores, __companyId: row.company_id, __companyName: row.company_name });
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

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

  private buildScores(row: ScoreResult, skillMap: Map<string, Skill>): JobScoresProps {
    const byAffinity: Record<SkillAffinity, Skill[]> = {
      [SkillAffinity.EXPERT]: [],
      [SkillAffinity.INTEREST]: [],
      [SkillAffinity.AVOID]: []
    };
    const all: Skill[] = [];

    for (const affinity of Object.values(SkillAffinity)) {
      const ids = row[`${affinity}_skills`] ?? [];
      for (const id of ids) {
        const skill = skillMap.get(id);
        if (skill) {
          byAffinity[affinity].push(skill);
          all.push(skill);
        }
      }
    }

    return {
      salary: row.salary_score,
      skills: {
        total: { score: row.total_skill_score ?? 0, matches: all },
        [SkillAffinity.EXPERT]: { score: row.expert_score ?? 0, matches: byAffinity[SkillAffinity.EXPERT] },
        [SkillAffinity.INTEREST]: { score: row.interest_score ?? 0, matches: byAffinity[SkillAffinity.INTEREST] },
        [SkillAffinity.AVOID]: { score: row.avoid_score ?? 0, matches: byAffinity[SkillAffinity.AVOID] }
      }
    };
  }

  private weights(params: { expertWeight?: number; interestWeight?: number; avoidWeight?: number }): WeightParams {
    return {
      expertWeight: params.expertWeight ?? DEFAULT_WEIGHTS.expertWeight,
      interestWeight: params.interestWeight ?? DEFAULT_WEIGHTS.interestWeight,
      avoidWeight: params.avoidWeight ?? DEFAULT_WEIGHTS.avoidWeight
    };
  }
}
