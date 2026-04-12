import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { EntityNotFoundError, SkillCategory } from '@tailoredin/domain';
import { PostgresSkillCategoryRepository } from '../../src/skill/PostgresSkillCategoryRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresSkillCategoryRepository', () => {
  let orm: MikroORM;
  let repo: PostgresSkillCategoryRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresSkillCategoryRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(SkillCategory, {});
    orm.em.clear();
  });

  describe('findAll', () => {
    it('returns categories ordered by ordinal', async () => {
      const cloud = SkillCategory.create({ label: 'Cloud Platforms', ordinal: 2 });
      const languages = SkillCategory.create({ label: 'Programming Languages', ordinal: 0 });
      const leadership = SkillCategory.create({ label: 'Leadership', ordinal: 1 });

      orm.em.persist(cloud);
      orm.em.persist(languages);
      orm.em.persist(leadership);
      await orm.em.flush();
      orm.em.clear();

      const result = await repo.findAll();
      expect(result.map(c => c.label)).toEqual(['Programming Languages', 'Leadership', 'Cloud Platforms']);
    });

    it('returns empty array when no categories exist', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findByIdOrFail', () => {
    it('returns category by id', async () => {
      const category = SkillCategory.create({ label: 'Frameworks', ordinal: 0 });
      orm.em.persist(category);
      await orm.em.flush();
      orm.em.clear();

      const result = await repo.findByIdOrFail(category.id);
      expect(result.label).toBe('Frameworks');
      expect(result.ordinal).toBe(0);
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      const nonExistentId = crypto.randomUUID();
      await expect(repo.findByIdOrFail(nonExistentId)).rejects.toThrow(EntityNotFoundError);
    });
  });
});
