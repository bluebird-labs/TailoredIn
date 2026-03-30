import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { SkillAffinity } from '@tailoredin/domain';
import { PostgresSkillRepository } from '../../src/repositories/PostgresSkillRepository.js';
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

  test('refreshAll inserts new skills', async () => {
    const result = await repo.refreshAll([
      { name: 'TypeScript', affinity: SkillAffinity.EXPERT, variants: ['TS'] },
      { name: 'Go', affinity: SkillAffinity.INTEREST, variants: ['Golang'] },
      { name: 'PHP', affinity: SkillAffinity.AVOID, variants: [] }
    ]);

    expect(result.createdCount).toBe(3);
    expect(result.updatedCount).toBe(0);
    expect(result.deletedCount).toBe(0);

    const all = await repo.findAll();
    expect(all).toHaveLength(3);
  });

  test('refreshAll updates existing and deletes removed skills', async () => {
    const result = await repo.refreshAll([
      { name: 'TypeScript', affinity: SkillAffinity.EXPERT, variants: ['TS', 'Typescript'] },
      { name: 'Rust', affinity: SkillAffinity.INTEREST, variants: [] }
    ]);

    expect(result.createdCount).toBe(1);
    expect(result.updatedCount).toBe(1);
    expect(result.deletedCount).toBe(2);

    const all = await repo.findAll();
    expect(all).toHaveLength(2);

    const ts = all.find(s => s.name === 'TypeScript');
    expect(ts).toBeDefined();
    expect(ts!.variants).toContain('Typescript');

    const rust = all.find(s => s.name === 'Rust');
    expect(rust).toBeDefined();
    expect(rust!.affinity).toBe(SkillAffinity.INTEREST);
  });

  test('findAll returns domain skill objects', async () => {
    const all = await repo.findAll();

    for (const skill of all) {
      expect(skill.id.value).toBeString();
      expect(skill.name).toBeString();
      expect(skill.key).toBeString();
      expect(skill.createdAt).toBeInstanceOf(Date);
    }
  });
});
