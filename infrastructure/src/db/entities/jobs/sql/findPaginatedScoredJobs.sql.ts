/** Types generated for queries found in "src/orm/entities/jobs/sql/findPaginatedScoredJobs.pgsql" */
import { PreparedQuery } from '@pgtyped/runtime';

export type stringArray = string[];

/** 'FindPaginatedScoredJobsByScore' parameters type */
export interface IFindPaginatedScoredJobsByScoreParams {
  avoidWeight?: number | null | undefined;
  expertWeight?: number | null | undefined;
  interestWeight?: number | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  statuses?: stringArray | null | undefined;
  targetSalary?: number | null | undefined;
}

/** 'FindPaginatedScoredJobsByScore' return type */
export interface IFindPaginatedScoredJobsByScoreResult {
  avoid_score: number | null;
  avoid_skills: stringArray | null;
  company_name: string;
  expert_score: number | null;
  expert_skills: stringArray | null;
  interest_score: number | null;
  interest_skills: stringArray | null;
  job_id: string;
  posted_at: Date | null;
  salary_score: number | null;
  status: string;
  title: string;
  total_count: string;
  total_skill_score: number | null;
}

/** 'FindPaginatedScoredJobsByScore' query type */
export interface IFindPaginatedScoredJobsByScoreQuery {
  params: IFindPaginatedScoredJobsByScoreParams;
  result: IFindPaginatedScoredJobsByScoreResult;
}

const findPaginatedScoredJobsByScoreIr: any = {
  usedParamSet: {
    expertWeight: true,
    interestWeight: true,
    avoidWeight: true,
    targetSalary: true,
    statuses: true,
    limit: true,
    offset: true
  },
  params: [
    { name: 'expertWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 556, b: 568 }] },
    { name: 'interestWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 615, b: 629 }] },
    { name: 'avoidWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 676, b: 687 }] },
    { name: 'targetSalary', required: false, transform: { type: 'scalar' }, locs: [{ a: 897, b: 909 }] },
    { name: 'statuses', required: false, transform: { type: 'scalar' }, locs: [{ a: 939, b: 947 }, { a: 977, b: 985 }] },
    { name: 'limit', required: false, transform: { type: 'scalar' }, locs: [{ a: 1113, b: 1118 }] },
    { name: 'offset', required: false, transform: { type: 'scalar' }, locs: [{ a: 1134, b: 1140 }] }
  ],
  statement:
    "SELECT j.id                 AS job_id,\n       j.title              AS title,\n       j.status             AS status,\n       j.posted_at          AS posted_at,\n       c.name               AS company_name,\n       sk.expert_score      AS expert_score,\n       sk.interest_score    AS interest_score,\n       sk.avoid_score       AS avoid_score,\n       sk.total_skill_score AS total_skill_score,\n       sal.salary_score     AS salary_score,\n       sk.expert_skills     AS expert_skills,\n       sk.interest_skills   AS interest_skills,\n       sk.avoid_skills      AS avoid_skills,\n       COUNT(*) OVER()      AS total_count\nFROM jobs j\n         JOIN companies c ON c.id = j.company_id\n         JOIN LATERAL score_job_skills(j.id,\n                                       j.description_fts,\n                                       :expertWeight::INT,\n                                       :interestWeight::INT,\n                                       :avoidWeight::INT) sk ON TRUE\n         JOIN LATERAL score_job_salary(j.id,\n                                       j.salary_low,\n                                       j.salary_high,\n                                       :targetSalary::INT) sal ON TRUE\nWHERE c.ignored = FALSE\n  AND (:statuses::text[] IS NULL OR j.status = ANY(:statuses::text[]))\nORDER BY sk.expert_score DESC,\n         sk.total_skill_score DESC,\n         sal.salary_score DESC NULLS LAST\nLIMIT :limit::INT\nOFFSET :offset::INT"
};

/**
 * Query generated from SQL:
 * ```
 * SELECT j.id                 AS job_id,
 *        j.title              AS title,
 *        j.status             AS status,
 *        j.posted_at          AS posted_at,
 *        c.name               AS company_name,
 *        sk.expert_score      AS expert_score,
 *        sk.interest_score    AS interest_score,
 *        sk.avoid_score       AS avoid_score,
 *        sk.total_skill_score AS total_skill_score,
 *        sal.salary_score     AS salary_score,
 *        sk.expert_skills     AS expert_skills,
 *        sk.interest_skills   AS interest_skills,
 *        sk.avoid_skills      AS avoid_skills,
 *        COUNT(*) OVER()      AS total_count
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
 *   AND (:statuses::text[] IS NULL OR j.status = ANY(:statuses::text[]))
 * ORDER BY sk.expert_score DESC,
 *          sk.total_skill_score DESC,
 *          sal.salary_score DESC NULLS LAST
 * LIMIT :limit::INT
 * OFFSET :offset::INT
 * ```
 */
export const findPaginatedScoredJobsByScore = new PreparedQuery<
  IFindPaginatedScoredJobsByScoreParams,
  IFindPaginatedScoredJobsByScoreResult
>(findPaginatedScoredJobsByScoreIr);

/** 'FindPaginatedScoredJobsByDate' parameters type */
export interface IFindPaginatedScoredJobsByDateParams {
  avoidWeight?: number | null | undefined;
  expertWeight?: number | null | undefined;
  interestWeight?: number | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  statuses?: stringArray | null | undefined;
  targetSalary?: number | null | undefined;
}

/** 'FindPaginatedScoredJobsByDate' return type */
export interface IFindPaginatedScoredJobsByDateResult {
  avoid_score: number | null;
  avoid_skills: stringArray | null;
  company_name: string;
  expert_score: number | null;
  expert_skills: stringArray | null;
  interest_score: number | null;
  interest_skills: stringArray | null;
  job_id: string;
  posted_at: Date | null;
  salary_score: number | null;
  status: string;
  title: string;
  total_count: string;
  total_skill_score: number | null;
}

/** 'FindPaginatedScoredJobsByDate' query type */
export interface IFindPaginatedScoredJobsByDateQuery {
  params: IFindPaginatedScoredJobsByDateParams;
  result: IFindPaginatedScoredJobsByDateResult;
}

const findPaginatedScoredJobsByDateIr: any = {
  usedParamSet: {
    expertWeight: true,
    interestWeight: true,
    avoidWeight: true,
    targetSalary: true,
    statuses: true,
    limit: true,
    offset: true
  },
  params: [
    { name: 'expertWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 556, b: 568 }] },
    { name: 'interestWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 615, b: 629 }] },
    { name: 'avoidWeight', required: false, transform: { type: 'scalar' }, locs: [{ a: 676, b: 687 }] },
    { name: 'targetSalary', required: false, transform: { type: 'scalar' }, locs: [{ a: 897, b: 909 }] },
    { name: 'statuses', required: false, transform: { type: 'scalar' }, locs: [{ a: 939, b: 947 }, { a: 977, b: 985 }] },
    { name: 'limit', required: false, transform: { type: 'scalar' }, locs: [{ a: 1052, b: 1057 }] },
    { name: 'offset', required: false, transform: { type: 'scalar' }, locs: [{ a: 1073, b: 1079 }] }
  ],
  statement:
    "SELECT j.id                 AS job_id,\n       j.title              AS title,\n       j.status             AS status,\n       j.posted_at          AS posted_at,\n       c.name               AS company_name,\n       sk.expert_score      AS expert_score,\n       sk.interest_score    AS interest_score,\n       sk.avoid_score       AS avoid_score,\n       sk.total_skill_score AS total_skill_score,\n       sal.salary_score     AS salary_score,\n       sk.expert_skills     AS expert_skills,\n       sk.interest_skills   AS interest_skills,\n       sk.avoid_skills      AS avoid_skills,\n       COUNT(*) OVER()      AS total_count\nFROM jobs j\n         JOIN companies c ON c.id = j.company_id\n         JOIN LATERAL score_job_skills(j.id,\n                                       j.description_fts,\n                                       :expertWeight::INT,\n                                       :interestWeight::INT,\n                                       :avoidWeight::INT) sk ON TRUE\n         JOIN LATERAL score_job_salary(j.id,\n                                       j.salary_low,\n                                       j.salary_high,\n                                       :targetSalary::INT) sal ON TRUE\nWHERE c.ignored = FALSE\n  AND (:statuses::text[] IS NULL OR j.status = ANY(:statuses::text[]))\nORDER BY j.posted_at DESC NULLS LAST\nLIMIT :limit::INT\nOFFSET :offset::INT"
};

/**
 * Query generated from SQL:
 * ```
 * SELECT j.id                 AS job_id,
 *        j.title              AS title,
 *        j.status             AS status,
 *        j.posted_at          AS posted_at,
 *        c.name               AS company_name,
 *        sk.expert_score      AS expert_score,
 *        sk.interest_score    AS interest_score,
 *        sk.avoid_score       AS avoid_score,
 *        sk.total_skill_score AS total_skill_score,
 *        sal.salary_score     AS salary_score,
 *        sk.expert_skills     AS expert_skills,
 *        sk.interest_skills   AS interest_skills,
 *        sk.avoid_skills      AS avoid_skills,
 *        COUNT(*) OVER()      AS total_count
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
 *   AND (:statuses::text[] IS NULL OR j.status = ANY(:statuses::text[]))
 * ORDER BY j.posted_at DESC NULLS LAST
 * LIMIT :limit::INT
 * OFFSET :offset::INT
 * ```
 */
export const findPaginatedScoredJobsByDate = new PreparedQuery<
  IFindPaginatedScoredJobsByDateParams,
  IFindPaginatedScoredJobsByDateResult
>(findPaginatedScoredJobsByDateIr);
