import { describe, expect, test } from 'bun:test';
import { JobId, type JobListItem, JobPosting, type JobRepository, JobStatus } from '@tailoredin/domain';
import { ListJobs } from '../../src/use-cases/ListJobs.js';

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
    updatedAt: new Date(),
    scores: {
      salary: 0.8,
      skills: {
        total: { score: 12, matches: [] },
        expert: { score: 8, matches: [] },
        interest: { score: 4, matches: [] },
        avoid: { score: 0, matches: [] }
      }
    }
  });
  return { job, companyName: overrides.companyName ?? 'Acme Corp' };
}

describe('ListJobs', () => {
  test('returns paginated DTO with correct mapping', async () => {
    const items = [
      makeJobListItem({ title: 'Backend Engineer', companyName: 'Alpha Inc' }),
      makeJobListItem({ title: 'Frontend Dev', companyName: 'Beta LLC' })
    ];
    const repo = createMockJobRepository({
      findPaginated: async () => ({ items, total: 42, page: 2, pageSize: 25 })
    });
    const uc = new ListJobs(repo);

    const result = await uc.execute({ page: 2, pageSize: 25, targetSalary: 200000 });

    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(25);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Backend Engineer');
    expect(result.items[0].companyName).toBe('Alpha Inc');
    expect(result.items[0].status).toBe(JobStatus.NEW);
    expect(result.items[0].postedAt).toBe(new Date('2026-03-01').toISOString());
    expect(result.items[0].expertScore).toBe(8);
    expect(result.items[0].totalSkillScore).toBe(12);
    expect(result.items[0].salaryScore).toBe(0.8);
  });

  test('passes params through to repository', async () => {
    let capturedParams: Parameters<JobRepository['findPaginated']>[0] | null = null;
    const repo = createMockJobRepository({
      findPaginated: async params => {
        capturedParams = params;
        return { items: [], total: 0, page: 1, pageSize: 10 };
      }
    });
    const uc = new ListJobs(repo);

    await uc.execute({
      page: 3,
      pageSize: 10,
      targetSalary: 180000,
      statuses: [JobStatus.NEW, JobStatus.APPLIED],
      sortBy: 'posted_at',
      sortDir: 'desc'
    });

    expect(capturedParams).not.toBeNull();
    expect(capturedParams!.page).toBe(3);
    expect(capturedParams!.pageSize).toBe(10);
    expect(capturedParams!.targetSalary).toBe(180000);
    expect(capturedParams!.statuses).toEqual([JobStatus.NEW, JobStatus.APPLIED]);
    expect(capturedParams!.sortBy).toBe('posted_at');
    expect(capturedParams!.sortDir).toBe('desc');
  });

  test('returns empty items when repository returns empty result', async () => {
    const repo = createMockJobRepository();
    const uc = new ListJobs(repo);

    const result = await uc.execute({ page: 1, pageSize: 25, targetSalary: 200000 });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  test('handles job with null postedAt', async () => {
    const item = makeJobListItem({ postedAt: null });
    const repo = createMockJobRepository({
      findPaginated: async () => ({ items: [item], total: 1, page: 1, pageSize: 25 })
    });
    const uc = new ListJobs(repo);

    const result = await uc.execute({ page: 1, pageSize: 25, targetSalary: 200000 });

    expect(result.items[0].postedAt).toBeNull();
  });
});
