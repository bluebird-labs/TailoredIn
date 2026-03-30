import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import { AddBullet } from '../../src/use-cases/AddBullet.js';

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

describe('AddBullet', () => {
  test('returns error when company not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new AddBullet(repo);
    const result = await uc.execute({ companyId: 'nonexistent', content: 'Test', ordinal: 0 });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Company not found');
    }
  });

  test('adds bullet and returns DTO', async () => {
    const company = makeCompany();
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company
    });
    const uc = new AddBullet(repo);
    const result = await uc.execute({ companyId: company.id.value, content: 'New bullet', ordinal: 3 });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.content).toBe('New bullet');
      expect(result.value.ordinal).toBe(3);
      expect(result.value.id).toBeTruthy();
    }
    expect(company.bullets).toHaveLength(1);
  });
});
