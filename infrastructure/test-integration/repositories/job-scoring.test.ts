import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { Company } from '../../src/db/entities/companies/Company.js';
import { Job } from '../../src/db/entities/jobs/Job.js';
import {
  findPaginatedScoredJobs,
  findTopScoredJobs,
  scoreJobById
} from '../../src/db/entities/jobs/JobScoringQueries.js';
import { JobStatus } from '../../src/db/entities/jobs/JobStatus.js';
import { Skill } from '../../src/db/entities/skills/Skill.js';
import { SkillAffinity } from '../../src/db/entities/skills/SkillAffinity.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('Job scoring queries', () => {
  let orm: MikroORM;
  let jobWithSkillsId: string;
  let jobWithSalaryId: string;
  let jobNoMatchesId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    const em = orm.em.fork();

    // Seed skills
    const expertSkill = Skill.create({ name: 'TypeScript', affinity: SkillAffinity.EXPERT, variants: ['TS'] });
    const interestSkill = Skill.create({ name: 'Go', affinity: SkillAffinity.INTEREST, variants: ['Golang'] });
    const avoidSkill = Skill.create({ name: 'PHP', affinity: SkillAffinity.AVOID, variants: [] });
    em.persist([expertSkill, interestSkill, avoidSkill]);

    // Seed company
    const company = Company.create({
      name: 'Test Corp',
      linkedinLink: 'https://linkedin.com/company/testcorp',
      website: null,
      logoUrl: null
    });
    em.persist(company);

    // Job with TypeScript and Go in description (expert + interest matches)
    const jobWithSkills = Job.create({
      company,
      status: JobStatus.NEW,
      applyLink: null,
      linkedinId: 'job-1',
      title: 'Senior Engineer',
      linkedinLink: 'https://linkedin.com/jobs/1',
      type: 'Full-time',
      level: 'Senior',
      remote: 'Remote',
      postedAt: new Date(),
      isRepost: false,
      locationRaw: 'Remote',
      salaryLow: null,
      salaryHigh: null,
      salaryRaw: null,
      description: 'We need a TypeScript and Golang engineer with strong backend skills.',
      descriptionHtml: '<p>We need a TypeScript and Golang engineer.</p>',
      applicantsCount: 5
    });
    jobWithSkillsId = jobWithSkills.id;
    em.persist(jobWithSkills);

    // Job with salary but no skill matches
    const jobWithSalary = Job.create({
      company,
      status: JobStatus.NEW,
      applyLink: null,
      linkedinId: 'job-2',
      title: 'Product Manager',
      linkedinLink: 'https://linkedin.com/jobs/2',
      type: 'Full-time',
      level: 'Senior',
      remote: null,
      postedAt: new Date(),
      isRepost: false,
      locationRaw: 'San Francisco, CA',
      salaryLow: 180000,
      salaryHigh: 220000,
      salaryRaw: '$180k-$220k',
      description: 'Product manager role with no technical requirements mentioned.',
      descriptionHtml: '<p>Product manager role.</p>',
      applicantsCount: 20
    });
    jobWithSalaryId = jobWithSalary.id;
    em.persist(jobWithSalary);

    // Job with no matches at all
    const jobNoMatches = Job.create({
      company,
      status: JobStatus.RETIRED,
      applyLink: null,
      linkedinId: 'job-3',
      title: 'Accountant',
      linkedinLink: 'https://linkedin.com/jobs/3',
      type: 'Full-time',
      level: null,
      remote: null,
      postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isRepost: false,
      locationRaw: 'New York',
      salaryLow: null,
      salaryHigh: null,
      salaryRaw: null,
      description: 'Accounting position with Excel and QuickBooks requirements.',
      descriptionHtml: '<p>Accounting position.</p>',
      applicantsCount: null
    });
    jobNoMatchesId = jobNoMatches.id;
    em.persist(jobNoMatches);

    await em.flush();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('scoreJobById', () => {
    test('returns scores for a job with skill matches', async () => {
      const em = orm.em.fork();
      const rows = await scoreJobById(em, {
        jobId: jobWithSkillsId,
        targetSalary: 200000,
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2
      });

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.job_id).toBe(jobWithSkillsId);
      expect(row.expert_score).toBeGreaterThan(0);
      expect(row.interest_score).toBeGreaterThan(0);
      expect(row.avoid_score).toBe(0);
      expect(row.total_skill_score).toBeGreaterThan(0);
      expect(row.expert_skills).toBeArray();
      expect(row.expert_skills!.length).toBeGreaterThan(0);
      expect(row.interest_skills!.length).toBeGreaterThan(0);
      expect(row.avoid_skills).toEqual([]);
    });

    test('returns null salary score when no salary data', async () => {
      const em = orm.em.fork();
      const rows = await scoreJobById(em, {
        jobId: jobWithSkillsId,
        targetSalary: 200000,
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2
      });

      expect(rows[0].salary_score).toBeNull();
      expect(rows[0].average_salary).toBeNull();
      expect(rows[0].target_salary).toBe(200000);
    });

    test('returns salary score when salary data exists', async () => {
      const em = orm.em.fork();
      const rows = await scoreJobById(em, {
        jobId: jobWithSalaryId,
        targetSalary: 200000,
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2
      });

      expect(rows[0].salary_score).not.toBeNull();
      expect(rows[0].average_salary).toBe(200000);
      expect(rows[0].salary_score).toBe(100);
    });

    test('returns zero scores when no skill matches', async () => {
      const em = orm.em.fork();
      const rows = await scoreJobById(em, {
        jobId: jobWithSalaryId,
        targetSalary: 200000,
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2
      });

      expect(rows[0].expert_score).toBe(0);
      expect(rows[0].interest_score).toBe(0);
      expect(rows[0].avoid_score).toBe(0);
      expect(rows[0].total_skill_score).toBe(0);
    });
  });

  describe('findTopScoredJobs', () => {
    test('returns only NEW jobs from non-ignored companies', async () => {
      const em = orm.em.fork();
      const rows = await findTopScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        hoursPostedMax: 24 * 30,
        top: 10
      });

      for (const row of rows) {
        expect(row.job_id).not.toBe(jobNoMatchesId);
      }
    });

    test('orders by expert score descending', async () => {
      const em = orm.em.fork();
      const rows = await findTopScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        hoursPostedMax: 24 * 30,
        top: 10
      });

      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].expert_score).toBeLessThanOrEqual(rows[i - 1].expert_score);
      }
    });

    test('respects the top limit', async () => {
      const em = orm.em.fork();
      const rows = await findTopScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        hoursPostedMax: 24 * 30,
        top: 1
      });

      expect(rows.length).toBeLessThanOrEqual(1);
    });
  });

  describe('findPaginatedScoredJobs', () => {
    test('returns paginated results with total count', async () => {
      const em = orm.em.fork();
      const rows = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: ['new'],
        limit: 10,
        offset: 0,
        sortBy: 'score'
      });

      expect(rows.length).toBeGreaterThan(0);
      expect(Number.parseInt(rows[0].total_count, 10)).toBeGreaterThanOrEqual(rows.length);
      expect(rows[0].title).toBeString();
      expect(rows[0].company_name).toBe('Test Corp');
    });

    test('filters by status', async () => {
      const em = orm.em.fork();
      const rows = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: ['retired'],
        limit: 10,
        offset: 0,
        sortBy: 'score'
      });

      for (const row of rows) {
        expect(row.status).toBe('retired');
      }
    });

    test('returns all statuses when statuses is null', async () => {
      const em = orm.em.fork();
      const rows = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: null,
        limit: 10,
        offset: 0,
        sortBy: 'score'
      });

      expect(rows.length).toBe(3);
    });

    test('sorts by posted_at when requested', async () => {
      const em = orm.em.fork();
      const rows = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: null,
        limit: 10,
        offset: 0,
        sortBy: 'posted_at'
      });

      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1].posted_at ? new Date(rows[i - 1].posted_at!).getTime() : -Infinity;
        const curr = rows[i].posted_at ? new Date(rows[i].posted_at!).getTime() : -Infinity;
        expect(curr).toBeLessThanOrEqual(prev);
      }
    });

    test('respects pagination offset and limit', async () => {
      const em = orm.em.fork();
      const page1 = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: null,
        limit: 1,
        offset: 0,
        sortBy: 'score'
      });
      const page2 = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: null,
        limit: 1,
        offset: 1,
        sortBy: 'score'
      });

      expect(page1).toHaveLength(1);
      expect(page2).toHaveLength(1);
      expect(page1[0].job_id).not.toBe(page2[0].job_id);
    });

    test('returns empty array when offset exceeds total', async () => {
      const em = orm.em.fork();
      const rows = await findPaginatedScoredJobs(em, {
        expertWeight: 8,
        interestWeight: 2,
        avoidWeight: 2,
        targetSalary: 200000,
        statuses: null,
        limit: 10,
        offset: 1000,
        sortBy: 'score'
      });

      expect(rows).toHaveLength(0);
    });
  });
});
