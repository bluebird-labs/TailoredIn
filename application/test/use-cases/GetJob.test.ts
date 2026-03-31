import { describe, expect, test } from 'bun:test';
import { Company, CompanyId, JobId, JobPosting, type JobRepository, JobStatus } from '@tailoredin/domain';
import { GetJob } from '../../src/use-cases/GetJob.js';

function createMockJobRepository(overrides: Partial<JobRepository> = {}): JobRepository {
  return {
    findById: async () => null,
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findByIdWithCompanyOrFail: async () => {
      throw new Error('not found');
    },
    findPaginated: async () => ({ items: [], total: 0 }),
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

function makeCompany(): Company {
  return new Company({
    id: new CompanyId('company-1'),
    name: 'Acme Corp',
    website: null,
    logoUrl: null,
    linkedinLink: 'https://linkedin.com/company/acme',
    ignored: false,
    businessType: null,
    industry: null,
    stage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

describe('GetJob', () => {
  test('returns job with company dto', async () => {
    const job = makeJobPosting();
    const company = makeCompany();
    const repo = createMockJobRepository({
      findByIdWithCompanyOrFail: async () => ({ job, company })
    });
    const uc = new GetJob(repo);

    const result = await uc.execute({ jobId: 'job-1' });

    expect(result.job).toBe(job);
    expect(result.company.name).toBe('Acme Corp');
    expect(result.company.id).toBe('company-1');
  });

  test('passes jobId to repository', async () => {
    let capturedJobId: string | null = null;
    const job = makeJobPosting();
    const company = makeCompany();
    const repo = createMockJobRepository({
      findByIdWithCompanyOrFail: async jobId => {
        capturedJobId = jobId;
        return { job, company };
      }
    });
    const uc = new GetJob(repo);

    await uc.execute({ jobId: 'job-1' });

    expect(capturedJobId).toBe('job-1');
  });

  test('throws when job not found', async () => {
    const repo = createMockJobRepository();
    const uc = new GetJob(repo);

    expect(uc.execute({ jobId: 'nonexistent' })).rejects.toThrow('not found');
  });
});
