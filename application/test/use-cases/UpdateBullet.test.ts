import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import { UpdateBullet } from '../../src/use-cases/UpdateBullet.js';

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
  const bullet = company.addBullet({ content: 'Original', ordinal: 0 });
  return { company, bullet };
}

describe('UpdateBullet', () => {
  test('returns error when company not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new UpdateBullet(repo);
    const result = await uc.execute({ companyId: 'nonexistent', bulletId: 'b1', content: 'X' });
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
    const uc = new UpdateBullet(repo);
    const result = await uc.execute({ companyId: company.id.value, bulletId: 'nonexistent', content: 'X' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Bullet not found');
    }
  });

  test('updates bullet and saves', async () => {
    const { company, bullet } = makeCompanyWithBullet();
    let saved = false;
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company,
      save: async () => {
        saved = true;
      }
    });
    const uc = new UpdateBullet(repo);
    const result = await uc.execute({
      companyId: company.id.value,
      bulletId: bullet.id.value,
      content: 'Updated'
    });

    expect(result.isOk).toBe(true);
    expect(bullet.content).toBe('Updated');
    expect(saved).toBe(true);
  });
});
