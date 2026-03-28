import type { FindOneOrFailOptions, FindOptions, UpsertOptions } from '@mikro-orm/postgresql';
import { EnumUtil, InspectUtil, type TypeUtil } from '@tailoredin/shared';
import { type Duration, sub } from 'date-fns';
import { BaseRepository } from '../../BaseRepository.js';
import type { QueryOpts, RefOrEntity } from '../../helpers.js';
import type { Company } from '../companies/Company.js';
import { Skill } from '../skills/Skill.js';
import { SkillAffinity } from '../skills/SkillAffinity.js';
import { Job } from './Job.js';
import type { JobProps } from './Job.types.js';
import { JobStatus } from './JobStatus.js';
import {
  findTopScoredJobs,
  type IFindTopScoredJobsParams,
  type IFindTopScoredJobsResult
} from './sql/findTopScoredJobs.sql.js';
import { type IScoreJobByIdParams, scoreJobById } from './sql/scoreJobById.sql.js';
import type { TransientJob } from './TransientJob.js';

const SKILL_LIST_KEYS = [
  'expert_skills',
  'interest_skills',
  'avoid_skills'
] satisfies (keyof IFindTopScoredJobsResult)[];

const DEFAULT_SKILL_WEIGHTS: Record<SkillAffinity, number> = {
  [SkillAffinity.EXPERT]: 8,
  [SkillAffinity.INTEREST]: 2,
  [SkillAffinity.AVOID]: 2
};

type SkillAffinityWeights = Pick<IFindTopScoredJobsParams, 'expertWeight' | 'interestWeight' | 'avoidWeight'> &
  Pick<IScoreJobByIdParams, 'expertWeight' | 'interestWeight' | 'avoidWeight'>;

export class JobRepository extends BaseRepository<Job> {
  public async findTopScored<Hint extends string = never>(
    params: TypeUtil.WithRequiredNonNull<
      TypeUtil.CamelCaseKeys<IFindTopScoredJobsParams>,
      'top' | 'targetSalary' | 'hoursPostedMax'
    >,
    opts: QueryOpts & FindOptions<Job, Hint> = {}
  ) {
    const result = await this.executePgTypedQuery(opts, findTopScoredJobs, {
      top: params.top,
      targetSalary: params.targetSalary,
      hoursPostedMax: params.hoursPostedMax ?? 48,
      ...this.withDefaultSkillAffinityWeights(params)
    });

    if (result.rowCount === 0) {
      return [];
    }

    const jobIds: string[] = [];
    const resultMap = new Map<string, IFindTopScoredJobsResult>();
    const skillIds = new Set<string>();

    for (const row of result.rows) {
      jobIds.push(row.job_id);
      resultMap.set(row.job_id, row);
      for (const skillListKey of SKILL_LIST_KEYS) {
        if (row[skillListKey] !== null) {
          for (const skillId of row[skillListKey]) {
            skillIds.add(skillId);
          }
        }
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

    const skillMap = new Map<string, Skill>(skills.map(skill => [skill.id, skill]));

    for (const job of jobs) {
      const jobResult = resultMap.get(job.id)!;
      InspectUtil.inspect(jobResult);

      const allSkillMatches: Skill[] = [];
      const skillMatchesByAffinity: Record<SkillAffinity, Skill[]> = {
        [SkillAffinity.EXPERT]: [],
        [SkillAffinity.INTEREST]: [],
        [SkillAffinity.AVOID]: []
      };

      for (const skillAffinity of EnumUtil.values(SkillAffinity)) {
        const skillAffinityResults = jobResult[`${skillAffinity}_skills`] ?? [];
        const skillAffinityMatches = skillMatchesByAffinity[skillAffinity];
        for (const skillAffinityResult of skillAffinityResults) {
          const skill = skillMap.get(skillAffinityResult)!;
          skillAffinityMatches.push(skill);
          allSkillMatches.push(skill);
        }
      }

      job.score({
        salary: jobResult.salary_score,
        skills: {
          total: {
            score: jobResult.total_skill_score!,
            matches: allSkillMatches
          },
          [SkillAffinity.EXPERT]: {
            score: jobResult.expert_score!,
            matches: skillMatchesByAffinity[SkillAffinity.EXPERT]
          },
          [SkillAffinity.INTEREST]: {
            score: jobResult.interest_score!,
            matches: skillMatchesByAffinity[SkillAffinity.INTEREST]
          },
          [SkillAffinity.AVOID]: {
            score: jobResult.avoid_score!,
            matches: skillMatchesByAffinity[SkillAffinity.AVOID]
          }
        }
      });
    }

    return jobs;
  }

  public async findScoredByIdOrFail<Hint extends string = never>(
    params: TypeUtil.WithRequiredNonNull<TypeUtil.CamelCaseKeys<IScoreJobByIdParams>, 'jobId' | 'targetSalary'>,
    opts: QueryOpts & FindOneOrFailOptions<Job, Hint>
  ) {
    const job = await this.getEm(opts).findOneOrFail(Job, params.jobId, opts);
    const scoreResults = await this.executePgTypedQuery(opts, scoreJobById, {
      jobId: params.jobId,
      targetSalary: params.targetSalary,
      ...this.withDefaultSkillAffinityWeights(params)
    });

    if (scoreResults.rowCount === 0) {
      throw new Error(`Job with id ${params.jobId} could not be scored`);
    }

    const jobResult = scoreResults.rows[0];
    const skillIds = new Set<string>();

    for (const row of scoreResults.rows) {
      for (const skillListKey of SKILL_LIST_KEYS) {
        if (row[skillListKey] !== null) {
          for (const skillId of row[skillListKey]) {
            skillIds.add(skillId);
          }
        }
      }
    }

    const skills = await this.getEm(opts)
      .repo(Skill)
      .find({ id: { $in: Array.from(skillIds) } });

    const skillMap = new Map<string, Skill>(skills.map(skill => [skill.id, skill]));

    const allSkillMatches: Skill[] = [];
    const skillMatchesByAffinity: Record<SkillAffinity, Skill[]> = {
      [SkillAffinity.EXPERT]: [],
      [SkillAffinity.INTEREST]: [],
      [SkillAffinity.AVOID]: []
    };

    for (const skillAffinity of EnumUtil.values(SkillAffinity)) {
      const skillAffinityResults = jobResult[`${skillAffinity}_skills`] ?? [];
      const skillAffinityMatches = skillMatchesByAffinity[skillAffinity];
      for (const skillAffinityResult of skillAffinityResults) {
        const skill = skillMap.get(skillAffinityResult)!;
        skillAffinityMatches.push(skill);
        allSkillMatches.push(skill);
      }
    }

    job.score({
      salary: jobResult.salary_score,
      skills: {
        total: {
          score: jobResult.total_skill_score!,
          matches: allSkillMatches
        },
        [SkillAffinity.EXPERT]: {
          score: jobResult.expert_score!,
          matches: skillMatchesByAffinity[SkillAffinity.EXPERT]
        },
        [SkillAffinity.INTEREST]: {
          score: jobResult.interest_score!,
          matches: skillMatchesByAffinity[SkillAffinity.INTEREST]
        },
        [SkillAffinity.AVOID]: {
          score: jobResult.avoid_score!,
          matches: skillMatchesByAffinity[SkillAffinity.AVOID]
        }
      }
    });

    return job;
  }

  public async resolve(transientJob: TransientJob, company: RefOrEntity<Company>, opts: QueryOpts = {}): Promise<Job> {
    const onConflictExcludeFields: UpsertOptions<Job, keyof JobProps>['onConflictExcludeFields'] = ['createdAt'];

    if (transientJob.isNew()) {
      onConflictExcludeFields.push('status');
    }

    const transientJobProps = transientJob.toProps();

    return this.getEm(opts).upsert(
      Job,
      {
        ...transientJobProps,
        company: company
      },
      {
        onConflictAction: 'merge',
        onConflictExcludeFields: onConflictExcludeFields
      }
    );
  }

  public async retireOlderThan(dur: Duration, opts: QueryOpts = {}): Promise<number> {
    const date = sub(new Date(), dur);

    return this.getEm(opts).transactional(async em => {
      const retirableJobs = await em.find(Job, {
        postedAt: {
          $lt: date
        },
        status: JobStatus.NEW
      });

      const count = retirableJobs.length;

      if (count === 0) {
        return count;
      }

      for (const retirableJob of retirableJobs) {
        retirableJob.retire();
        em.persist(retirableJob);
      }

      await em.flush();

      return count;
    });
  }

  public async findByCompanyNameLike<Hint extends string & 'company' = 'company'>(
    companyName: string,
    opts: QueryOpts & FindOptions<Job, Hint> = {}
  ) {
    return this.getEm(opts)
      .repo(Job)
      .find(
        {
          company: {
            name: {
              $ilike: `%${companyName}%`
            }
          }
        },
        {
          ...opts,
          populate: Array.from(new Set(['company', ...(opts.populate || [])])) as any
        }
      );
  }

  private withDefaultSkillAffinityWeights(
    weights: Partial<SkillAffinityWeights>
  ): TypeUtil.RequiredNonNull<SkillAffinityWeights> {
    return {
      expertWeight: weights.expertWeight ?? DEFAULT_SKILL_WEIGHTS[SkillAffinity.EXPERT],
      interestWeight: weights.interestWeight ?? DEFAULT_SKILL_WEIGHTS[SkillAffinity.INTEREST],
      avoidWeight: weights.avoidWeight ?? DEFAULT_SKILL_WEIGHTS[SkillAffinity.AVOID]
    };
  }
}
