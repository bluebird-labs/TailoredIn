import { describe, expect, test } from 'bun:test';
import { JobId, type JobListItem, JobPosting, type JobRepository, JobStatus } from '@tailoredin/domain';
import { ListJobs } from '../../src/use-cases/ListJobs.js';

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

function makeJobListItem(
  overrides: Partial<{ title: string; companyName: string; status: JobStatus; postedAt: Date | null }>
): JobListItem {
  const job = new JobPosting({
    id: JobId.generate(),
    companyId: 'company-1',
    status: overrides.status ?? JobStatus.NEW,
    applyLink: null,
    linkedinId: 'li-123',
    title: overrides.title ?? 'Software Engineer',
    linkedinLink: 'https://linkedin.com/jobs/123',
    type: 'full-time',
    level: 'Mid-Senior level',
    remote: 'remote',
    postedAt: overrides.postedAt !== undefined ? overrides.postedAt : new Date('2026-03-01'),
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
  return { job, companyId: 'company-1', companyName: overrides.companyName ?? 'Acme Corp' };
}

describe('ListJobs', () => {
  test('returns paginated DTO with correct mapping', async () => {
    const items = [
      makeJobListItem({ title: 'Backend Engineer', companyName: 'Alpha Inc' }),
      makeJobListItem({ title: 'Frontend Dev', companyName: 'Beta LLC' })
    ];
    const repo = createMockJobRepository({
      findPaginated: async () => ({ items, total: 42 })
    });
    const uc = new ListJobs(repo);

    const result = await uc.execute({ limit: 25, offset: 25, sort: 'posted_at:desc' });

    expect(result.pagination.total).toBe(42);
    expect(result.pagination.limit).toBe(25);
    expect(result.pagination.offset).toBe(25);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Backend Engineer');
    expect(result.items[0].companyName).toBe('Alpha Inc');
    expect(result.items[0].status).toBe(JobStatus.NEW);
    expect(result.items[0].postedAt).toBe(new Date('2026-03-01').toISOString());
  });

  test('passes params through to repository', async () => {
    let capturedParams: Parameters<JobRepository['findPaginated']>[0] | null = null;
    const repo = createMockJobRepository({
      findPaginated: async params => {
        capturedParams = params;
        return { items: [], total: 0 };
      }
    });
    const uc = new ListJobs(repo);

    await uc.execute({
      limit: 10,
      offset: 20,
      statuses: [JobStatus.NEW, JobStatus.APPLIED],
      sort: 'posted_at:desc'
    });

    expect(capturedParams).not.toBeNull();
    expect(capturedParams!.limit).toBe(10);
    expect(capturedParams!.offset).toBe(20);
    expect(capturedParams!.statuses).toEqual([JobStatus.NEW, JobStatus.APPLIED]);
    expect(capturedParams!.sort).toBe('posted_at:desc');
  });

  test('returns empty items when repository returns empty result', async () => {
    const repo = createMockJobRepository();
    const uc = new ListJobs(repo);

    const result = await uc.execute({ limit: 25, offset: 0, sort: 'posted_at:desc' });

    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  test('handles job with null postedAt', async () => {
    const item = makeJobListItem({ postedAt: null });
    const repo = createMockJobRepository({
      findPaginated: async () => ({ items: [item], total: 1 })
    });
    const uc = new ListJobs(repo);

    const result = await uc.execute({ limit: 25, offset: 0, sort: 'posted_at:desc' });

    expect(result.items[0].postedAt).toBeNull();
  });
});
