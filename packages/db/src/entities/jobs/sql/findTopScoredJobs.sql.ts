/** Types generated for queries found in "src/orm/entities/jobs/sql/findTopScoredJobs.pgsql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type stringArray = string[];

/** 'FindTopScoredJobs' parameters type */
export interface IFindTopScoredJobsParams {
  avoidWeight?: number | null | undefined;
  expertWeight?: number | null | undefined;
  hoursPostedMax?: number | null | undefined;
  interestWeight?: number | null | undefined;
  targetSalary?: number | null | undefined;
  top?: number | null | undefined;
}

/** 'FindTopScoredJobs' return type */
export interface IFindTopScoredJobsResult {
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

/** 'FindTopScoredJobs' query type */
export interface IFindTopScoredJobsQuery {
  params: IFindTopScoredJobsParams;
  result: IFindTopScoredJobsResult;
}

const findTopScoredJobsIr: any = {
  usedParamSet: {
    expertWeight: true,
    interestWeight: true,
    avoidWeight: true,
    targetSalary: true,
    hoursPostedMax: true,
    top: true
  },
  params: [
    { name: 'expertWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 704, b: 716 }] },
    { name: 'interestWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 763, b: 777 }] },
    { name: 'avoidWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 824, b: 835 }] },
    { name: 'targetSalary', required: false, transform: { type: 'scalar' }, locs: [{ a: 1045, b: 1057 }] },
    { name: 'hoursPostedMax', required: false, transform: { type: 'scalar' }, locs: [{ a: 1188, b: 1202 }] },
    { name: 'top', required: false, transform: { type: 'scalar' }, locs: [{ a: 1337, b: 1340 }] }
  ],
  statement:
    "SELECT j.id                 AS job_id,\n       sk.expert_score      AS expert_score,\n       sk.interest_score    AS interest_score,\n       sk.avoid_score       AS avoid_score,\n       sk.total_skill_score AS total_skill_score,\n       sal.salary_score     AS salary_score,\n       sk.expert_skills     AS expert_skills,\n       sk.interest_skills   AS interest_skills,\n       sk.avoid_skills      AS avoid_skills,\n       sal.average_salary   AS average_salary,\n       sal.target_salary    AS target_salary\nFROM jobs j\n         JOIN companies c ON c.id = j.company_id\n         JOIN LATERAL score_job_skills(j.id,\n                                       j.description_fts,\n                                       :expertWeight::INT,\n                                       :interestWeight::INT,\n                                       :avoidWeight::INT) sk ON TRUE\n         JOIN LATERAL score_job_salary(j.id,\n                                       j.salary_low,\n                                       j.salary_high,\n                                       :targetSalary::INT) sal ON TRUE\nWHERE c.ignored = FALSE\n  AND j.status = 'new'\n  AND j.posted_at::TIMESTAMP >= (NOW() - MAKE_INTERVAL(hours => :hoursPostedMax::INT))::TIMESTAMP\nORDER BY sk.expert_score DESC,\n         sk.total_skill_score DESC,\n         sal.salary_score DESC NULLS LAST\nLIMIT :top::INT"
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
 *          JOIN companies c ON c.id = j.company_id
 *          JOIN LATERAL score_job_skills(j.id,
 *                                        j.description_fts,
 *                                        :expertWeight::INT,
 *                                        :interestWeight::INT,
 *                                        :avoidWeight::INT) sk ON TRUE
 *          JOIN LATERAL score_job_salary(j.id,
 *                                        j.salary_low,
 *                                        j.salary_high,
 *                                        :targetSalary::INT) sal ON TRUE
 * WHERE c.ignored = FALSE
 *   AND j.status = 'new'
 *   AND j.posted_at::TIMESTAMP >= (NOW() - MAKE_INTERVAL(hours => :hoursPostedMax::INT))::TIMESTAMP
 * ORDER BY sk.expert_score DESC,
 *          sk.total_skill_score DESC,
 *          sal.salary_score DESC NULLS LAST
 * LIMIT :top::INT
 * ```
 */
export const findTopScoredJobs = new PreparedQuery<IFindTopScoredJobsParams, IFindTopScoredJobsResult>(
  findTopScoredJobsIr
);
