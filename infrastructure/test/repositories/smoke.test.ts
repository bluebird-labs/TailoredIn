import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { MikroORM } from '@mikro-orm/postgresql';
import {
  ResumeBulletId,
  type ResumeCompany,
  ResumeCompanyId,
  type ResumeEducation,
  ResumeEducationId,
  type ResumeHeadline,
  ResumeHeadlineId,
  ResumeLocation,
  type ResumeSkillCategory,
  ResumeSkillCategoryId,
  ResumeSkillItemId,
  type User,
  UserId
} from '@tailoredin/domain';
import { ormConfig } from '../../src/db/orm-config.js';
import { PostgresResumeCompanyRepository } from '../../src/repositories/PostgresResumeCompanyRepository.js';
import { PostgresResumeEducationRepository } from '../../src/repositories/PostgresResumeEducationRepository.js';
import { PostgresResumeHeadlineRepository } from '../../src/repositories/PostgresResumeHeadlineRepository.js';
import { PostgresResumeSkillCategoryRepository } from '../../src/repositories/PostgresResumeSkillCategoryRepository.js';
import { PostgresUserRepository } from '../../src/repositories/PostgresUserRepository.js';

/**
 * Smoke test: verifies repository implementations against a seeded database.
 * Requires: PostgreSQL running + `bun run db:migration:up` + ResumeDataSeeder executed.
 */
describe('Resume repository smoke tests', () => {
  let orm: MikroORM;
  let userRepo: PostgresUserRepository;
  let companyRepo: PostgresResumeCompanyRepository;
  let educationRepo: PostgresResumeEducationRepository;
  let headlineRepo: PostgresResumeHeadlineRepository;
  let skillCategoryRepo: PostgresResumeSkillCategoryRepository;
  let seededUser: User;

  beforeAll(async () => {
    orm = await MikroORM.init(ormConfig);
    userRepo = new PostgresUserRepository(orm);
    companyRepo = new PostgresResumeCompanyRepository(orm);
    educationRepo = new PostgresResumeEducationRepository(orm);
    headlineRepo = new PostgresResumeHeadlineRepository(orm);
    skillCategoryRepo = new PostgresResumeSkillCategoryRepository(orm);

    seededUser = await userRepo.findSingle();
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('PostgresUserRepository', () => {
    test('findSingle returns a user with expected fields', () => {
      expect(seededUser).toBeDefined();
      expect(seededUser.id).toBeInstanceOf(UserId);
      expect(seededUser.email).toBeString();
      expect(seededUser.firstName).toBeString();
      expect(seededUser.lastName).toBeString();
      expect(seededUser.createdAt).toBeInstanceOf(Date);
      expect(seededUser.updatedAt).toBeInstanceOf(Date);
    });

    test('findByIdOrFail returns the same user', async () => {
      const user = await userRepo.findByIdOrFail(seededUser.id.value);
      expect(user.id.value).toBe(seededUser.id.value);
      expect(user.email).toBe(seededUser.email);
    });
  });

  describe('PostgresResumeCompanyRepository', () => {
    let companies: ResumeCompany[];

    beforeAll(async () => {
      companies = await companyRepo.findAllByUserId(seededUser.id.value);
    });

    test('findAllByUserId returns seeded companies', () => {
      expect(companies.length).toBeGreaterThan(0);
    });

    test('companies have correct domain types', () => {
      const company = companies[0];
      expect(company.id).toBeInstanceOf(ResumeCompanyId);
      expect(company.userId).toBe(seededUser.id.value);
      expect(company.companyName).toBeString();
      expect(company.businessDomain).toBeString();
      expect(company.createdAt).toBeInstanceOf(Date);
    });

    test('companies have nested bullets', () => {
      const withBullets = companies.find(c => c.bullets.length > 0);
      expect(withBullets).toBeDefined();
      const bullet = withBullets!.bullets[0];
      expect(bullet.id).toBeInstanceOf(ResumeBulletId);
      expect(bullet.content).toBeString();
      expect(typeof bullet.ordinal).toBe('number');
    });

    test('companies have nested locations', () => {
      const withLocations = companies.find(c => c.locations.length > 0);
      expect(withLocations).toBeDefined();
      const location = withLocations!.locations[0];
      expect(location).toBeInstanceOf(ResumeLocation);
      expect(location.label).toBeString();
      expect(typeof location.ordinal).toBe('number');
    });

    test('findByIdOrFail returns a specific company', async () => {
      const company = await companyRepo.findByIdOrFail(companies[0].id.value);
      expect(company.id.value).toBe(companies[0].id.value);
      expect(company.companyName).toBe(companies[0].companyName);
    });
  });

  describe('PostgresResumeEducationRepository', () => {
    let educationEntries: ResumeEducation[];

    beforeAll(async () => {
      educationEntries = await educationRepo.findAllByUserId(seededUser.id.value);
    });

    test('findAllByUserId returns seeded education entries', () => {
      expect(educationEntries.length).toBeGreaterThan(0);
    });

    test('education entries have correct domain types', () => {
      const entry = educationEntries[0];
      expect(entry.id).toBeInstanceOf(ResumeEducationId);
      expect(entry.userId).toBe(seededUser.id.value);
      expect(entry.degreeTitle).toBeString();
      expect(entry.institutionName).toBeString();
      expect(entry.graduationYear).toBeString();
      expect(entry.locationLabel).toBeString();
      expect(typeof entry.ordinal).toBe('number');
    });

    test('education entries are ordered by ordinal', () => {
      for (let i = 1; i < educationEntries.length; i++) {
        expect(educationEntries[i].ordinal).toBeGreaterThanOrEqual(educationEntries[i - 1].ordinal);
      }
    });
  });

  describe('PostgresResumeHeadlineRepository', () => {
    let headlines: ResumeHeadline[];

    beforeAll(async () => {
      headlines = await headlineRepo.findAllByUserId(seededUser.id.value);
    });

    test('findAllByUserId returns seeded headlines', () => {
      expect(headlines.length).toBeGreaterThan(0);
    });

    test('headlines have correct domain types', () => {
      const headline = headlines[0];
      expect(headline.id).toBeInstanceOf(ResumeHeadlineId);
      expect(headline.userId).toBe(seededUser.id.value);
      expect(headline.headlineLabel).toBeString();
      expect(headline.summaryText).toBeString();
    });

    test('findByIdOrFail returns a specific headline', async () => {
      const headline = await headlineRepo.findByIdOrFail(headlines[0].id.value);
      expect(headline.id.value).toBe(headlines[0].id.value);
      expect(headline.headlineLabel).toBe(headlines[0].headlineLabel);
    });
  });

  describe('PostgresResumeSkillCategoryRepository', () => {
    let categories: ResumeSkillCategory[];

    beforeAll(async () => {
      categories = await skillCategoryRepo.findAllByUserId(seededUser.id.value);
    });

    test('findAllByUserId returns seeded skill categories', () => {
      expect(categories.length).toBeGreaterThan(0);
    });

    test('categories have correct domain types', () => {
      const category = categories[0];
      expect(category.id).toBeInstanceOf(ResumeSkillCategoryId);
      expect(category.userId).toBe(seededUser.id.value);
      expect(category.categoryName).toBeString();
      expect(typeof category.ordinal).toBe('number');
    });

    test('categories have nested items', () => {
      const withItems = categories.find(c => c.items.length > 0);
      expect(withItems).toBeDefined();
      const item = withItems!.items[0];
      expect(item.id).toBeInstanceOf(ResumeSkillItemId);
      expect(item.skillName).toBeString();
      expect(typeof item.ordinal).toBe('number');
    });

    test('categories are ordered by ordinal', () => {
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].ordinal).toBeGreaterThanOrEqual(categories[i - 1].ordinal);
      }
    });

    test('findByIdOrFail returns a specific category with items', async () => {
      const category = await skillCategoryRepo.findByIdOrFail(categories[0].id.value);
      expect(category.id.value).toBe(categories[0].id.value);
      expect(category.categoryName).toBe(categories[0].categoryName);
      expect(category.items.length).toBe(categories[0].items.length);
    });
  });
});
