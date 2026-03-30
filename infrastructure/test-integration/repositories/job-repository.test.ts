import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { type Company as DomainCompany, JobStatus } from '@tailoredin/domain';
import { PostgresCompanyRepository } from '../../src/repositories/PostgresCompanyRepository.js';
import { PostgresJobRepository } from '../../src/repositories/PostgresJobRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresJobRepository', () => {
  let orm: MikroORM;
  let jobRepo: PostgresJobRepository;
  let company: DomainCompany;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    jobRepo = new PostgresJobRepository(orm);
    const companyRepo = new PostgresCompanyRepository(orm);

    company = await companyRepo.upsertByLinkedinLink({
      name: 'Test Company',
      linkedinLink: 'https://linkedin.com/company/test',
      website: null,
      logoUrl: null
    });
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('upsertByLinkedinId inserts a new job', async () => {
    const job = await jobRepo.upsertByLinkedinId(
      {
        status: JobStatus.NEW,
        applyLink: 'https://apply.com/1',
        linkedinId: 'linkedin-job-1',
        title: 'Software Engineer',
        linkedinLink: 'https://linkedin.com/jobs/1',
        type: 'Full-time',
        level: 'Senior',
        remote: 'Remote',
        postedAt: new Date(),
        isRepost: false,
        locationRaw: 'Remote, US',
        salaryLow: 150000,
        salaryHigh: 200000,
        salaryRaw: '$150k-$200k',
        description: 'Build software with TypeScript and Node.js',
        descriptionHtml: '<p>Build software</p>',
        applicantsCount: 10
      },
      company
    );

    expect(job.title).toBe('Software Engineer');
    expect(job.linkedinId).toBe('linkedin-job-1');
    expect(job.status).toBe(JobStatus.NEW);
    expect(job.id.value).toBeString();
  });

  test('upsertByLinkedinId updates existing job on conflict', async () => {
    const updated = await jobRepo.upsertByLinkedinId(
      {
        status: JobStatus.NEW,
        applyLink: 'https://apply.com/1-updated',
        linkedinId: 'linkedin-job-1',
        title: 'Senior Software Engineer',
        linkedinLink: 'https://linkedin.com/jobs/1',
        type: 'Full-time',
        level: 'Senior',
        remote: 'Remote',
        postedAt: new Date(),
        isRepost: false,
        locationRaw: 'Remote, US',
        salaryLow: 160000,
        salaryHigh: 210000,
        salaryRaw: '$160k-$210k',
        description: 'Build software with TypeScript and Node.js',
        descriptionHtml: '<p>Build software</p>',
        applicantsCount: 15
      },
      company
    );

    expect(updated.title).toBe('Senior Software Engineer');
    expect(updated.salaryLow).toBe(160000);
  });

  test('findByIdOrFail returns a job', async () => {
    const inserted = await jobRepo.upsertByLinkedinId(
      {
        status: JobStatus.NEW,
        applyLink: null,
        linkedinId: 'linkedin-job-findable',
        title: 'Findable Job',
        linkedinLink: 'https://linkedin.com/jobs/findable',
        type: 'Full-time',
        level: null,
        remote: null,
        postedAt: new Date(),
        isRepost: false,
        locationRaw: 'NYC',
        salaryLow: null,
        salaryHigh: null,
        salaryRaw: null,
        description: 'A findable job posting.',
        descriptionHtml: '<p>A findable job.</p>',
        applicantsCount: null
      },
      company
    );

    const found = await jobRepo.findByIdOrFail(inserted.id.value);
    expect(found.id.value).toBe(inserted.id.value);
    expect(found.title).toBe('Findable Job');
  });

  test('findById returns null for non-existent job', async () => {
    const found = await jobRepo.findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });

  test('retireOlderThan retires old NEW jobs', async () => {
    const oldDate = new Date('2020-01-01');

    await jobRepo.upsertByLinkedinId(
      {
        status: JobStatus.NEW,
        applyLink: null,
        linkedinId: 'linkedin-job-old',
        title: 'Old Job',
        linkedinLink: 'https://linkedin.com/jobs/old',
        type: 'Full-time',
        level: null,
        remote: null,
        postedAt: oldDate,
        isRepost: false,
        locationRaw: 'Somewhere',
        salaryLow: null,
        salaryHigh: null,
        salaryRaw: null,
        description: 'An old job posting that should be retired.',
        descriptionHtml: '<p>Old job.</p>',
        applicantsCount: null
      },
      company
    );

    const retired = await jobRepo.retireOlderThan(new Date('2021-01-01'));
    expect(retired).toBeGreaterThanOrEqual(1);
  });
});
