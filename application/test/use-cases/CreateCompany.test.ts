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
    findByPositionIdOrFail: async () => {
      throw new Error('not found');
    },
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
      locations: [{ label: 'NYC', ordinal: 0 }]
    });

    expect(saved).not.toBeNull();
    expect(result.companyName).toBe('Acme');
    expect(result.companyMention).toBe('acquired');
    expect(result.websiteUrl).toBe('https://acme.com');
    expect(result.id).toBeTruthy();
  });

  test('returns empty positions array', async () => {
    const repo = createMockCompanyRepository();
    const uc = new CreateCompany(repo);
    const result = await uc.execute({
      userId: 'user-1',
      companyName: 'Acme',
      companyMention: null,
      websiteUrl: null,
      businessDomain: 'SaaS',
      locations: []
    });

    expect(result.positions).toHaveLength(0);
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
      locations: [
        { label: 'NYC', ordinal: 0 },
        { label: 'Remote', ordinal: 1 }
      ]
    });

    expect(result.locations).toHaveLength(2);
    expect(result.locations[0].label).toBe('NYC');
    expect(result.locations[1].label).toBe('Remote');
  });
});
