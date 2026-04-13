import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { Skill, SkillType } from '@tailoredin/domain';
import { PostgresSkillRepository } from '../../src/skill/PostgresSkillRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresSkillRepository', () => {
  let orm: MikroORM;
  let repo: PostgresSkillRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresSkillRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Skill, {});
    orm.em.clear();
  });

  function createSkill(overrides: Partial<Parameters<typeof Skill.create>[0]> & { label: string }) {
    return Skill.create({
      type: SkillType.TECHNOLOGY,
      categoryId: null,
      description: null,
      aliases: [],
      ...overrides
    });
  }

  async function seedSkills(...skills: Skill[]): Promise<void> {
    for (const s of skills) orm.em.persist(s);
    await orm.em.flush();
    orm.em.clear();
  }

  describe('findAll', () => {
    it('returns skills ordered by label', async () => {
      const react = createSkill({ label: 'React', type: SkillType.TECHNOLOGY });
      const go = createSkill({ label: 'Go', type: SkillType.LANGUAGE });
      const typescript = createSkill({ label: 'TypeScript', type: SkillType.LANGUAGE });
      await seedSkills(react, go, typescript);

      const result = await repo.findAll();
      expect(result.map(s => s.label)).toEqual(['Go', 'React', 'TypeScript']);
    });

    it('returns empty array when no skills exist', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findByIds', () => {
    it('returns matching subset', async () => {
      const react = createSkill({ label: 'React' });
      const go = createSkill({ label: 'Go' });
      const ts = createSkill({ label: 'TypeScript' });
      await seedSkills(react, go, ts);

      const result = await repo.findByIds([react.id, ts.id]);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.label).sort()).toEqual(['React', 'TypeScript']);
    });

    it('returns empty array for empty ids', async () => {
      const result = await repo.findByIds([]);
      expect(result).toEqual([]);
    });

    it('ignores non-existent ids', async () => {
      const react = createSkill({ label: 'React' });
      await seedSkills(react);

      const result = await repo.findByIds([react.id, crypto.randomUUID()]);
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('React');
    });
  });

  describe('findByNormalizedLabel', () => {
    it('returns exact match', async () => {
      const react = createSkill({ label: 'React' });
      await seedSkills(react);

      const result = await repo.findByNormalizedLabel('react');
      expect(result).not.toBeNull();
      expect(result!.id).toBe(react.id);
    });

    it('returns null when no match', async () => {
      const result = await repo.findByNormalizedLabel('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('finds skills by prefix match', async () => {
      const typescript = createSkill({ label: 'TypeScript', type: SkillType.LANGUAGE });
      const python = createSkill({ label: 'Python', type: SkillType.LANGUAGE });
      await seedSkills(typescript, python);

      const result = await repo.search('Type', 10);
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('TypeScript');
    });

    it('finds skills by fuzzy trigram match', async () => {
      const kubernetes = createSkill({ label: 'Kubernetes', type: SkillType.TECHNOLOGY });
      const react = createSkill({ label: 'React', type: SkillType.TECHNOLOGY });
      await seedSkills(kubernetes, react);

      const result = await repo.search('Kubernets', 10);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].label).toBe('Kubernetes');
    });

    it('finds skills by alias in search_text', async () => {
      const golang = createSkill({
        label: 'Go',
        type: SkillType.LANGUAGE,
        aliases: [{ label: 'Golang', normalizedLabel: 'golang' }]
      });
      await seedSkills(golang);

      const result = await repo.search('Golang', 10);
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Go');
    });

    it('respects limit', async () => {
      const skills = Array.from({ length: 5 }, (_, i) =>
        createSkill({ label: `JavaScript${i}`, type: SkillType.LANGUAGE })
      );
      await seedSkills(...skills);

      const result = await repo.search('JavaScript', 2);
      expect(result).toHaveLength(2);
    });

    it('ranks exact label match above prefix matches', async () => {
      const kotlin = createSkill({ label: 'Kotlin', type: SkillType.LANGUAGE });
      const kotlinCoroutines = createSkill({ label: 'Kotlin Coroutines', type: SkillType.TECHNOLOGY });
      const kotlinMultiplatform = createSkill({ label: 'Kotlin Multiplatform Mobile', type: SkillType.TECHNOLOGY });
      await seedSkills(kotlin, kotlinCoroutines, kotlinMultiplatform);

      const result = await repo.search('kotlin', 10);
      expect(result).toHaveLength(3);
      expect(result[0].label).toBe('Kotlin');
    });

    it('returns empty array for no matches', async () => {
      const react = createSkill({ label: 'React' });
      await seedSkills(react);

      const result = await repo.search('zzzznonexistent', 10);
      expect(result).toEqual([]);
    });
  });
});
