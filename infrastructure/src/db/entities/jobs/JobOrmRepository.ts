import type { FindOneOrFailOptions, FindOptions, UpsertOptions } from '@mikro-orm/postgresql';
import { BaseRepository } from '../../BaseRepository.js';
import type { QueryOpts } from '../../helpers.js';
import type { Company } from '../companies/Company.js';
import { Skill } from '../skills/Skill.js';
import { SkillAffinity } from '../skills/SkillAffinity.js';
import { Job, type JobProps } from './Job.js';
import { JobStatus } from './JobStatus.js';
import {
  findTopScoredJobs,
  type IFindTopScoredJobsParams,
  type IFindTopScoredJobsResult
} from './sql/findTopScoredJobs.sql.js';
import { scoreJobById } from './sql/scoreJobById.sql.js';

const SKILL_LIST_KEYS = [
  'expert_skills',
  'interest_skills',
  'avoid_skills'
] as const satisfies (keyof IFindTopScoredJobsResult)[];

const DEFAULT_WEIGHTS = {
  expertWeight: 8,
  interestWeight: 2,
  avoidWeight: 2
};

export type ScoredJob = Job & { scores: JobScoresProps };

export type JobScoresSkillScore = { score: number; matches: Skill[] };
export type JobScoresProps = {
  salary: number | null;
  skills: Record<SkillAffinity, JobScoresSkillScore> & { total: JobScoresSkillScore };
};

type WeightParams = Pick<IFindTopScoredJobsParams, 'expertWeight' | 'interestWeight' | 'avoidWeight'>;

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
    const result = await this.executePgTypedQuery(opts, findTopScoredJobs, {
      top: params.top,
      targetSalary: params.targetSalary,
      hoursPostedMax: params.hoursPostedMax ?? 48,
      ...this.weights(params)
    });

    if (result.rowCount === 0) return [];

    const jobIds: string[] = [];
    const resultMap = new Map<string, IFindTopScoredJobsResult>();
    const skillIds = new Set<string>();

    for (const row of result.rows) {
      jobIds.push(row.job_id);
      resultMap.set(row.job_id, row);
      for (const key of SKILL_LIST_KEYS) {
        for (const id of (row[key] as string[] | null) ?? []) skillIds.add(id);
      }
    }

    const [jobs, skills] = await Promise.all([
      this.getEm(opts)
        .repo(Job)
        .find({ id: { $in: jobIds } }, opts),
      this.getEm(opts)
        .repo(Skill)
        .find({ id: { $in: Array.from(skillIds) } })
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
    const job = await this.getEm(opts).findOneOrFail(Job, params.jobId, opts);
    const result = await this.executePgTypedQuery(opts, scoreJobById, {
      jobId: params.jobId,
      targetSalary: params.targetSalary,
      ...this.weights(params)
    });

    if (result.rowCount === 0) throw new Error(`Could not score job ${params.jobId}`);

    const row = result.rows[0];
    const skillIds = new Set<string>();
    for (const key of SKILL_LIST_KEYS) {
      for (const id of (row[key] as string[] | null) ?? []) skillIds.add(id);
    }

    const skills = await this.getEm(opts)
      .repo(Skill)
      .find({ id: { $in: Array.from(skillIds) } });
    const skillMap = new Map(skills.map(s => [s.id, s]));
    const scores = this.buildScores(row, skillMap);

    return Object.assign(job, { __scores: scores });
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

  private buildScores(row: IFindTopScoredJobsResult, skillMap: Map<string, Skill>): JobScoresProps {
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
