import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository, ResumeLocation } from '@tailoredin/domain';
import { ListCompanies } from '../../src/use-cases/ListCompanies.js';

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

describe('ListCompanies', () => {
  test('returns empty array when no companies', async () => {
    const repo = createMockCompanyRepository();
    const uc = new ListCompanies(repo);
    const result = await uc.execute({ userId: 'user-1' });
    expect(result).toEqual([]);
  });

  test('returns mapped DTOs for all companies', async () => {
    const company = ResumeCompany.create({
      userId: 'user-1',
      companyName: 'Acme',
      companyMention: null,
      websiteUrl: 'https://acme.com',
      businessDomain: 'SaaS',
      locations: [new ResumeLocation('NYC', 0)]
    });
    const position = company.addPosition({
      title: 'Engineer',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });
    position.addBullet({ content: 'Built APIs', ordinal: 0 });

    const repo = createMockCompanyRepository({
      findAllByUserId: async () => [company]
    });
    const uc = new ListCompanies(repo);
    const result = await uc.execute({ userId: 'user-1' });

    expect(result).toHaveLength(1);
    expect(result[0].companyName).toBe('Acme');
    expect(result[0].locations).toHaveLength(1);
    expect(result[0].locations[0].label).toBe('NYC');
    expect(result[0].positions).toHaveLength(1);
    expect(result[0].positions[0].title).toBe('Engineer');
    expect(result[0].positions[0].bullets).toHaveLength(1);
    expect(result[0].positions[0].bullets[0].content).toBe('Built APIs');
    expect(result[0].id).toBe(company.id.value);
  });
});
