import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import { DeleteBullet } from '../../src/use-cases/DeleteBullet.js';

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

function makeCompanyWithBullet() {
  const company = ResumeCompany.create({
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
  const bullet = company.addBullet({ content: 'To remove', ordinal: 0 });
  return { company, bullet };
}

describe('DeleteBullet', () => {
  test('returns error when company not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new DeleteBullet(repo);
    const result = await uc.execute({ companyId: 'nonexistent', bulletId: 'b1' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Company not found');
    }
  });

  test('returns error when bullet not found', async () => {
    const { company } = makeCompanyWithBullet();
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company
    });
    const uc = new DeleteBullet(repo);
    const result = await uc.execute({ companyId: company.id.value, bulletId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Bullet not found');
    }
  });

  test('removes bullet and saves', async () => {
    const { company, bullet } = makeCompanyWithBullet();
    let saved = false;
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company,
      save: async () => {
        saved = true;
      }
    });
    const uc = new DeleteBullet(repo);
    const result = await uc.execute({ companyId: company.id.value, bulletId: bullet.id.value });

    expect(result.isOk).toBe(true);
    expect(company.bullets).toHaveLength(0);
    expect(saved).toBe(true);
  });
});
