import type { SqlEntityManager } from '@mikro-orm/postgresql';
import { sql } from 'kysely';

export type ScoreResult = {
  job_id: string;
  expert_score: number;
  interest_score: number;
  avoid_score: number;
  total_skill_score: number;
  salary_score: number | null;
  expert_skills: string[] | null;
  interest_skills: string[] | null;
  avoid_skills: string[] | null;
  average_salary: number | null;
  target_salary: number | null;
};

export type PaginatedScoreResult = ScoreResult & {
  title: string;
  status: string;
  posted_at: Date | null;
  company_id: string;
  company_name: string;
  total_count: string;
};

type WeightParams = {
  expertWeight: number;
  interestWeight: number;
  avoidWeight: number;
};

type SalaryParam = {
  targetSalary: number;
};

export async function scoreJobById(
  em: SqlEntityManager,
  params: WeightParams & SalaryParam & { jobId: string }
): Promise<ScoreResult[]> {
  const db = em.getKysely();
  const totalWeights = params.expertWeight + params.interestWeight + params.avoidWeight;

  const { rows } = await sql<ScoreResult>`
      WITH skill_counts AS (
        SELECT s.affinity, COUNT(*)::INT AS cnt
        FROM skills s
        GROUP BY s.affinity
      ),
      skill_keywords AS (
        SELECT s.id AS skill_id, s.affinity, UNNEST(s.variants || ARRAY[s.name]) AS variant
        FROM skills s
      ),
      job_skill_matches AS (
        SELECT DISTINCT ON (sk.skill_id) sk.skill_id, sk.affinity
        FROM skill_keywords sk, jobs j
        WHERE j.id = ${params.jobId}
          AND j.description_fts @@ PLAINTO_TSQUERY('english', sk.variant)
      ),
      matched AS (
        SELECT
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'expert'), ARRAY[]::uuid[]) AS expert_skills,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'interest'), ARRAY[]::uuid[]) AS interest_skills,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'avoid'), ARRAY[]::uuid[]) AS avoid_skills
        FROM job_skill_matches jsm
      ),
      scored AS (
        SELECT
          m.expert_skills,
          m.interest_skills,
          m.avoid_skills,
          ((CARDINALITY(m.expert_skills)::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'expert'), 1)) * 100)::INT AS expert_score,
          ((CARDINALITY(m.interest_skills)::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'interest'), 1)) * 100)::INT AS interest_score,
          ((CARDINALITY(m.avoid_skills)::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'avoid'), 1)) * 100)::INT AS avoid_score
        FROM matched m
      )
      SELECT
        j.id AS job_id,
        s.expert_score,
        s.interest_score,
        s.avoid_score,
        ((${params.expertWeight} * s.expert_score + ${params.interestWeight} * s.interest_score - ${params.avoidWeight} * s.avoid_score)::DECIMAL / ${totalWeights})::INT AS total_skill_score,
        CASE
          WHEN j.salary_low IS NULL AND j.salary_high IS NULL THEN NULL
          ELSE ((COALESCE((j.salary_low + j.salary_high)::DECIMAL / 2.0, j.salary_low::DECIMAL, j.salary_high::DECIMAL) / ${params.targetSalary}) * 100.0)::INT
        END AS salary_score,
        s.expert_skills,
        s.interest_skills,
        s.avoid_skills,
        CASE
          WHEN j.salary_low IS NULL AND j.salary_high IS NULL THEN NULL
          ELSE COALESCE((j.salary_low + j.salary_high) / 2, j.salary_low, j.salary_high)
        END::INT AS average_salary,
        ${params.targetSalary}::INT AS target_salary
      FROM jobs j, scored s
      WHERE j.id = ${params.jobId}
    `.execute(db);

  return rows;
}

export async function findTopScoredJobs(
  em: SqlEntityManager,
  params: WeightParams & SalaryParam & { hoursPostedMax: number; top: number }
): Promise<ScoreResult[]> {
  const db = em.getKysely();
  const totalWeights = params.expertWeight + params.interestWeight + params.avoidWeight;

  const { rows } = await sql<ScoreResult>`
      WITH skill_counts AS (
        SELECT s.affinity, COUNT(*)::INT AS cnt
        FROM skills s
        GROUP BY s.affinity
      ),
      skill_keywords AS (
        SELECT s.id AS skill_id, s.affinity, UNNEST(s.variants || ARRAY[s.name]) AS variant
        FROM skills s
      ),
      eligible_jobs AS (
        SELECT j.*
        FROM jobs j
        JOIN companies c ON c.id = j.company_id
        WHERE c.ignored = FALSE
          AND j.status = 'new'
          AND j.posted_at::TIMESTAMP >= (NOW() - MAKE_INTERVAL(hours => ${params.hoursPostedMax}::INT))::TIMESTAMP
      ),
      job_skill_matches AS (
        SELECT DISTINCT ON (ej.id, sk.skill_id) ej.id AS job_id, sk.skill_id, sk.affinity
        FROM eligible_jobs ej, skill_keywords sk
        WHERE ej.description_fts @@ PLAINTO_TSQUERY('english', sk.variant)
      ),
      job_scores AS (
        SELECT
          ej.id AS job_id,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'expert'), ARRAY[]::uuid[]) AS expert_skills,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'interest'), ARRAY[]::uuid[]) AS interest_skills,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'avoid'), ARRAY[]::uuid[]) AS avoid_skills,
          ((CARDINALITY(COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'expert'), ARRAY[]::uuid[]))::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'expert'), 1)) * 100)::INT AS expert_score,
          ((CARDINALITY(COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'interest'), ARRAY[]::uuid[]))::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'interest'), 1)) * 100)::INT AS interest_score,
          ((CARDINALITY(COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'avoid'), ARRAY[]::uuid[]))::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'avoid'), 1)) * 100)::INT AS avoid_score
        FROM eligible_jobs ej
        LEFT JOIN job_skill_matches jsm ON jsm.job_id = ej.id
        GROUP BY ej.id
      )
      SELECT
        js.job_id,
        js.expert_score,
        js.interest_score,
        js.avoid_score,
        ((${params.expertWeight} * js.expert_score + ${params.interestWeight} * js.interest_score - ${params.avoidWeight} * js.avoid_score)::DECIMAL / ${totalWeights})::INT AS total_skill_score,
        CASE
          WHEN ej.salary_low IS NULL AND ej.salary_high IS NULL THEN NULL
          ELSE ((COALESCE((ej.salary_low + ej.salary_high)::DECIMAL / 2.0, ej.salary_low::DECIMAL, ej.salary_high::DECIMAL) / ${params.targetSalary}) * 100.0)::INT
        END AS salary_score,
        js.expert_skills,
        js.interest_skills,
        js.avoid_skills,
        CASE
          WHEN ej.salary_low IS NULL AND ej.salary_high IS NULL THEN NULL
          ELSE COALESCE((ej.salary_low + ej.salary_high) / 2, ej.salary_low, ej.salary_high)
        END::INT AS average_salary,
        ${params.targetSalary}::INT AS target_salary
      FROM job_scores js
      JOIN eligible_jobs ej ON ej.id = js.job_id
      ORDER BY js.expert_score DESC,
        ((${params.expertWeight} * js.expert_score + ${params.interestWeight} * js.interest_score - ${params.avoidWeight} * js.avoid_score)::DECIMAL / ${totalWeights})::INT DESC,
        salary_score DESC NULLS LAST
      LIMIT ${params.top}::INT
    `.execute(db);

  return rows;
}

export async function findPaginatedScoredJobs(
  em: SqlEntityManager,
  params: WeightParams &
    SalaryParam & {
      statuses: string[] | null;
      businessTypes: string[] | null;
      industries: string[] | null;
      stages: string[] | null;
      limit: number;
      offset: number;
      sortBy: 'score' | 'posted_at';
    }
): Promise<PaginatedScoreResult[]> {
  const db = em.getKysely();
  const totalWeights = params.expertWeight + params.interestWeight + params.avoidWeight;

  const statusFilter =
    params.statuses && params.statuses.length > 0 ? sql`AND j.status::text = ANY(${params.statuses}::text[])` : sql``;

  const businessTypeFilter =
    params.businessTypes && params.businessTypes.length > 0
      ? sql`AND c.business_type = ANY(${params.businessTypes}::text[])`
      : sql``;

  const industryFilter =
    params.industries && params.industries.length > 0 ? sql`AND c.industry = ANY(${params.industries}::text[])` : sql``;

  const stageFilter =
    params.stages && params.stages.length > 0 ? sql`AND c.stage = ANY(${params.stages}::text[])` : sql``;

  const orderBy =
    params.sortBy === 'posted_at'
      ? sql`ORDER BY j.posted_at DESC NULLS LAST`
      : sql`ORDER BY js.expert_score DESC, total_skill_score DESC, salary_score DESC NULLS LAST`;

  const { rows } = await sql<PaginatedScoreResult>`
      WITH skill_counts AS (
        SELECT s.affinity, COUNT(*)::INT AS cnt
        FROM skills s
        GROUP BY s.affinity
      ),
      skill_keywords AS (
        SELECT s.id AS skill_id, s.affinity, UNNEST(s.variants || ARRAY[s.name]) AS variant
        FROM skills s
      ),
      filtered_jobs AS (
        SELECT j.*
        FROM jobs j
        JOIN companies c ON c.id = j.company_id
        WHERE c.ignored = FALSE
          ${statusFilter}
          ${businessTypeFilter}
          ${industryFilter}
          ${stageFilter}
      ),
      job_skill_matches AS (
        SELECT DISTINCT ON (fj.id, sk.skill_id) fj.id AS job_id, sk.skill_id, sk.affinity
        FROM filtered_jobs fj, skill_keywords sk
        WHERE fj.description_fts @@ PLAINTO_TSQUERY('english', sk.variant)
      ),
      job_scores AS (
        SELECT
          fj.id AS job_id,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'expert'), ARRAY[]::uuid[]) AS expert_skills,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'interest'), ARRAY[]::uuid[]) AS interest_skills,
          COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'avoid'), ARRAY[]::uuid[]) AS avoid_skills,
          ((CARDINALITY(COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'expert'), ARRAY[]::uuid[]))::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'expert'), 1)) * 100)::INT AS expert_score,
          ((CARDINALITY(COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'interest'), ARRAY[]::uuid[]))::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'interest'), 1)) * 100)::INT AS interest_score,
          ((CARDINALITY(COALESCE(ARRAY_AGG(jsm.skill_id) FILTER (WHERE jsm.affinity = 'avoid'), ARRAY[]::uuid[]))::DECIMAL / GREATEST((SELECT cnt FROM skill_counts WHERE affinity = 'avoid'), 1)) * 100)::INT AS avoid_score
        FROM filtered_jobs fj
        LEFT JOIN job_skill_matches jsm ON jsm.job_id = fj.id
        GROUP BY fj.id
      )
      SELECT
        js.job_id,
        j.title,
        j.status::text AS status,
        j.posted_at,
        c.id AS company_id,
        c.name AS company_name,
        js.expert_score,
        js.interest_score,
        js.avoid_score,
        ((${params.expertWeight} * js.expert_score + ${params.interestWeight} * js.interest_score - ${params.avoidWeight} * js.avoid_score)::DECIMAL / ${totalWeights})::INT AS total_skill_score,
        CASE
          WHEN j.salary_low IS NULL AND j.salary_high IS NULL THEN NULL
          ELSE ((COALESCE((j.salary_low + j.salary_high)::DECIMAL / 2.0, j.salary_low::DECIMAL, j.salary_high::DECIMAL) / ${params.targetSalary}) * 100.0)::INT
        END AS salary_score,
        js.expert_skills,
        js.interest_skills,
        js.avoid_skills,
        COUNT(*) OVER()::TEXT AS total_count
      FROM job_scores js
      JOIN jobs j ON j.id = js.job_id
      JOIN companies c ON c.id = j.company_id
      ${orderBy}
      LIMIT ${params.limit}::INT
      OFFSET ${params.offset}::INT
    `.execute(db);

  return rows;
}
