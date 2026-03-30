import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import { ReplaceLocations } from '../../src/use-cases/ReplaceLocations.js';

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

function makeCompany() {
  return ResumeCompany.create({
    userId: 'user-1',
    companyName: 'Acme',
    companyMention: null,
    websiteUrl: null,
    businessDomain: 'SaaS',
    joinedAt: '2020-01',
    leftAt: '2023-01',
    promotedAt: null,
    locations: [],
    bullets: []
  });
}

describe('ReplaceLocations', () => {
  test('returns error when company not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new ReplaceLocations(repo);
    const result = await uc.execute({ companyId: 'nonexistent', locations: [] });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Company not found');
    }
  });

  test('replaces locations and saves', async () => {
    const company = makeCompany();
    let saved = false;
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company,
      save: async () => {
        saved = true;
      }
    });
    const uc = new ReplaceLocations(repo);
    const result = await uc.execute({
      companyId: company.id.value,
      locations: [
        { label: 'NYC', ordinal: 0 },
        { label: 'Remote', ordinal: 1 }
      ]
    });

    expect(result.isOk).toBe(true);
    expect(company.locations).toHaveLength(2);
    expect(company.locations[0].label).toBe('NYC');
    expect(saved).toBe(true);
  });
});
