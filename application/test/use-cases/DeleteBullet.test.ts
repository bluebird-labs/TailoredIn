import { describe, expect, test } from 'bun:test';
import {
  type ResumeBullet,
  ResumeCompany,
  type ResumeCompanyRepository,
  type ResumePosition
} from '@tailoredin/domain';
import { DeleteBullet } from '../../src/use-cases/DeleteBullet.js';

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

function makeCompanyWithPositionAndBullet(): {
  company: ResumeCompany;
  position: ResumePosition;
  bullet: ResumeBullet;
} {
  const company = ResumeCompany.create({
    userId: 'user-1',
    companyName: 'Acme',
    companyMention: null,
    websiteUrl: null,
    businessDomain: 'SaaS',
    locations: []
  });
  const position = company.addPosition({
    title: 'Engineer',
    startDate: '2020-01',
    endDate: '2023-01',
    summary: null,
    ordinal: 0
  });
  const bullet = position.addBullet({ content: 'To remove', ordinal: 0 });
  return { company, position, bullet };
}

describe('DeleteBullet', () => {
  test('returns error when position not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new DeleteBullet(repo);
    const result = await uc.execute({ positionId: 'nonexistent', bulletId: 'b1' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Position not found');
    }
  });

  test('returns error when bullet not found', async () => {
    const { company, position } = makeCompanyWithPositionAndBullet();
    const repo = createMockCompanyRepository({
      findByPositionIdOrFail: async () => company
    });
    const uc = new DeleteBullet(repo);
    const result = await uc.execute({ positionId: position.id.value, bulletId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Bullet not found');
    }
  });

  test('removes bullet and saves', async () => {
    const { company, position, bullet } = makeCompanyWithPositionAndBullet();
    let saved = false;
    const repo = createMockCompanyRepository({
      findByPositionIdOrFail: async () => company,
      save: async () => {
        saved = true;
      }
    });
    const uc = new DeleteBullet(repo);
    const result = await uc.execute({ positionId: position.id.value, bulletId: bullet.id.value });

    expect(result.isOk).toBe(true);
    expect(position.bullets).toHaveLength(0);
    expect(saved).toBe(true);
  });
});
