import { describe, expect, test } from 'bun:test';
import { JobId, JobPosting, type JobRepository, JobStatus } from '@tailoredin/domain';
import { GetJob } from '../../src/use-cases/GetJob.js';

function createMockJobRepository(overrides: Partial<JobRepository> = {}): JobRepository {
  return {
    findById: async () => null,
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findScoredByIdOrFail: async () => {
      throw new Error('not found');
    },
    findTopScored: async () => [],
    findPaginated: async () => ({ items: [], total: 0, page: 1, pageSize: 25 }),
    upsertByLinkedinId: async () => {
      throw new Error('not implemented');
    },
    save: async () => {},
    retireOlderThan: async () => 0,
    ...overrides
  };
}

function makeJobPosting(): JobPosting {
  return new JobPosting({
    id: new JobId('job-1'),
    companyId: 'company-1',
    status: JobStatus.NEW,
    applyLink: null,
    linkedinId: 'li-123',
    title: 'Software Engineer',
    linkedinLink: 'https://linkedin.com/jobs/123',
    type: 'full-time',
    level: 'Mid-Senior level',
    remote: 'remote',
    postedAt: new Date('2026-03-01'),
    isRepost: false,
    locationRaw: 'New York, NY',
    salaryLow: 150000,
    salaryHigh: 200000,
    salaryRaw: '$150K - $200K',
    description: 'A great role',
    descriptionHtml: '<p>A great role</p>',
    applicantsCount: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

describe('GetJob', () => {
  test('returns job with company name', async () => {
    const job = makeJobPosting();
    const repo = createMockJobRepository({
      findScoredByIdOrFail: async () => ({ job, companyName: 'Acme Corp' })
    });
    const uc = new GetJob(repo);

    const result = await uc.execute({ jobId: 'job-1', targetSalary: 200000 });

    expect(result.job).toBe(job);
    expect(result.companyName).toBe('Acme Corp');
  });

  test('passes params to repository', async () => {
    let capturedParams: Parameters<JobRepository['findScoredByIdOrFail']>[0] | null = null;
    const job = makeJobPosting();
    const repo = createMockJobRepository({
      findScoredByIdOrFail: async params => {
        capturedParams = params;
        return { job, companyName: 'Test' };
      }
    });
    const uc = new GetJob(repo);

    await uc.execute({ jobId: 'job-1', targetSalary: 180000 });

    expect(capturedParams).not.toBeNull();
    expect(capturedParams!.jobId).toBe('job-1');
    expect(capturedParams!.targetSalary).toBe(180000);
  });

  test('throws when job not found', async () => {
    const repo = createMockJobRepository();
    const uc = new GetJob(repo);

    expect(uc.execute({ jobId: 'nonexistent', targetSalary: 200000 })).rejects.toThrow('not found');
  });
});
