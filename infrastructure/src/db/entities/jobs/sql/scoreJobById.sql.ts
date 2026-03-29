/** Types generated for queries found in "src/orm/entities/jobs/sql/scoreJobById.pgsql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type stringArray = string[];

/** 'ScoreJobById' parameters type */
export interface IScoreJobByIdParams {
  avoidWeight?: number | null | undefined;
  expertWeight?: number | null | undefined;
  interestWeight?: number | null | undefined;
  jobId?: string | null | undefined;
  targetSalary?: number | null | undefined;
}

/** 'ScoreJobById' return type */
export interface IScoreJobByIdResult {
  average_salary: number | null;
  avoid_score: number | null;
  avoid_skills: stringArray | null;
  expert_score: number | null;
  expert_skills: stringArray | null;
  interest_score: number | null;
  interest_skills: stringArray | null;
  job_id: string;
  salary_score: number | null;
  target_salary: number | null;
  total_skill_score: number | null;
}

/** 'ScoreJobById' query type */
export interface IScoreJobByIdQuery {
  params: IScoreJobByIdParams;
  result: IScoreJobByIdResult;
}

const scoreJobByIdIr: any = {
  usedParamSet: { expertWeight: true, interestWeight: true, avoidWeight: true, targetSalary: true, jobId: true },
  params: [
    { name: 'expertWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 655, b: 667 }] },
    { name: 'interestWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 714, b: 728 }] },
    { name: 'avoidWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 775, b: 786 }] },
    { name: 'targetSalary', required: false, transform: { type: 'scalar' }, locs: [{ a: 996, b: 1008 }] },
    { name: 'jobId', required: false, transform: { type: 'scalar' }, locs: [{ a: 1041, b: 1046 }] }
  ],
  statement:
    'SELECT j.id                 AS job_id,\n       sk.expert_score      AS expert_score,\n       sk.interest_score    AS interest_score,\n       sk.avoid_score       AS avoid_score,\n       sk.total_skill_score AS total_skill_score,\n       sal.salary_score     AS salary_score,\n       sk.expert_skills     AS expert_skills,\n       sk.interest_skills   AS interest_skills,\n       sk.avoid_skills      AS avoid_skills,\n       sal.average_salary   AS average_salary,\n       sal.target_salary    AS target_salary\nFROM jobs j\n         JOIN LATERAL score_job_skills(j.id,\n                                       j.description_fts,\n                                       :expertWeight::INT,\n                                       :interestWeight::INT,\n                                       :avoidWeight::INT) sk ON TRUE\n         JOIN LATERAL score_job_salary(j.id,\n                                       j.salary_low,\n                                       j.salary_high,\n                                       :targetSalary::INT) sal ON TRUE\nWHERE j.id = :jobId'
};

/**
 * Query generated from SQL:
 * ```
 * SELECT j.id                 AS job_id,
 *        sk.expert_score      AS expert_score,
 *        sk.interest_score    AS interest_score,
 *        sk.avoid_score       AS avoid_score,
 *        sk.total_skill_score AS total_skill_score,
 *        sal.salary_score     AS salary_score,
 *        sk.expert_skills     AS expert_skills,
 *        sk.interest_skills   AS interest_skills,
 *        sk.avoid_skills      AS avoid_skills,
 *        sal.average_salary   AS average_salary,
 *        sal.target_salary    AS target_salary
 * FROM jobs j
 *          JOIN LATERAL score_job_skills(j.id,
 *                                        j.description_fts,
 *                                        :expertWeight::INT,
 *                                        :interestWeight::INT,
 *                                        :avoidWeight::INT) sk ON TRUE
 *          JOIN LATERAL score_job_salary(j.id,
 *                                        j.salary_low,
 *                                        j.salary_high,
 *                                        :targetSalary::INT) sal ON TRUE
 * WHERE j.id = :jobId
 * ```
 */
export const scoreJobById = new PreparedQuery<IScoreJobByIdParams, IScoreJobByIdResult>(scoreJobByIdIr);
