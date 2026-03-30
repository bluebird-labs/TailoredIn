import { describe, expect, test } from 'bun:test';
import type { ResumeCompany, ResumeCompanyRepository } from '@tailoredin/domain';
import { CreateCompany } from '../../src/use-cases/CreateCompany.js';

function createMockCompanyRepository(overrides: Partial<ResumeCompanyRepository> = {}): ResumeCompanyRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findAllByUserId: async () => [],
    save: async () => {},
    delete: async () => {},
    ...overrides
  };
}

describe('CreateCompany', () => {
  test('creates company with correct fields and calls save', async () => {
    let saved: ResumeCompany | null = null;
    const repo = createMockCompanyRepository({
      save: async c => {
        saved = c;
      }
    });
    const uc = new CreateCompany(repo);
    const result = await uc.execute({
      userId: 'user-1',
      companyName: 'Acme',
      companyMention: 'acquired',
      websiteUrl: 'https://acme.com',
      businessDomain: 'SaaS',
      joinedAt: '2020-01',
      leftAt: '2023-01',
      promotedAt: null,
      locations: [{ label: 'NYC', ordinal: 0 }],
      bullets: [{ content: 'Built APIs', ordinal: 0 }]
    });

    expect(saved).not.toBeNull();
    expect(result.companyName).toBe('Acme');
    expect(result.companyMention).toBe('acquired');
    expect(result.websiteUrl).toBe('https://acme.com');
    expect(result.id).toBeTruthy();
  });

  test('includes bullets via addBullet', async () => {
    const repo = createMockCompanyRepository();
    const uc = new CreateCompany(repo);
    const result = await uc.execute({
      userId: 'user-1',
      companyName: 'Acme',
      companyMention: null,
      websiteUrl: null,
      businessDomain: 'SaaS',
      joinedAt: '2020-01',
      leftAt: '2023-01',
      promotedAt: null,
      locations: [],
      bullets: [
        { content: 'First', ordinal: 0 },
        { content: 'Second', ordinal: 1 }
      ]
    });

    expect(result.bullets).toHaveLength(2);
    expect(result.bullets[0].content).toBe('First');
    expect(result.bullets[1].content).toBe('Second');
  });

  test('includes locations', async () => {
    const repo = createMockCompanyRepository();
    const uc = new CreateCompany(repo);
    const result = await uc.execute({
      userId: 'user-1',
      companyName: 'Acme',
      companyMention: null,
      websiteUrl: null,
      businessDomain: 'SaaS',
      joinedAt: '2020-01',
      leftAt: '2023-01',
      promotedAt: null,
      locations: [
        { label: 'NYC', ordinal: 0 },
        { label: 'Remote', ordinal: 1 }
      ],
      bullets: []
    });

    expect(result.locations).toHaveLength(2);
    expect(result.locations[0].label).toBe('NYC');
    expect(result.locations[1].label).toBe('Remote');
  });
});
