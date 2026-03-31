import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository, type ResumePosition } from '@tailoredin/domain';
import { AddBullet } from '../../src/use-cases/AddBullet.js';

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

function makeCompanyWithPosition(): { company: ResumeCompany; position: ResumePosition } {
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
  return { company, position };
}

describe('AddBullet', () => {
  test('returns error when position not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new AddBullet(repo);
    const result = await uc.execute({ positionId: 'nonexistent', content: 'Test', ordinal: 0 });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Position not found');
    }
  });

  test('adds bullet and returns DTO', async () => {
    const { company, position } = makeCompanyWithPosition();
    const repo = createMockCompanyRepository({
      findByPositionIdOrFail: async () => company
    });
    const uc = new AddBullet(repo);
    const result = await uc.execute({ positionId: position.id.value, content: 'New bullet', ordinal: 3 });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.content).toBe('New bullet');
      expect(result.value.ordinal).toBe(3);
      expect(result.value.id).toBeTruthy();
    }
    expect(position.bullets).toHaveLength(1);
  });
});
