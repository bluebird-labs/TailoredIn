import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import type { Archetype } from '@tailoredin/domain';
import { ResumeDataSeeder } from '../../src/db/seeds/ResumeDataSeeder.js';
import { PostgresArchetypeConfigRepository } from '../../src/repositories/PostgresArchetypeConfigRepository.js';
import { PostgresUserRepository } from '../../src/repositories/PostgresUserRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresArchetypeConfigRepository', () => {
  let orm: MikroORM;
  let repo: PostgresArchetypeConfigRepository;
  let userId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    await orm.seeder.seed(ResumeDataSeeder);

    repo = new PostgresArchetypeConfigRepository(orm);
    const userRepo = new PostgresUserRepository(orm);
    const user = await userRepo.findSingle();
    userId = user.id.value;
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('findByIdOrFail returns an archetype with positions', async () => {
    const ormArchetypes = await orm.em.find((await import('../../src/db/entities/archetypes/Archetype.js')).Archetype, {
      user: userId
    });
    expect(ormArchetypes.length).toBeGreaterThan(0);

    const archetype = await repo.findByIdOrFail(ormArchetypes[0].id);
    expect(archetype.id.value).toBe(ormArchetypes[0].id);
    expect(archetype.archetypeKey).toBeString();
    expect(archetype.positions.length).toBeGreaterThan(0);
  });

  test('findByUserAndKey returns null for non-existent key', async () => {
    const archetype = await repo.findByUserAndKey(userId, 'nonexistent' as Archetype);
    expect(archetype).toBeNull();
  });

  test('delete removes an archetype', async () => {
    const ormArchetypes = await orm.em
      .fork()
      .find((await import('../../src/db/entities/archetypes/Archetype.js')).Archetype, { user: userId });
    const countBefore = ormArchetypes.length;
    expect(countBefore).toBeGreaterThan(0);

    await repo.delete(ormArchetypes[0].id);

    const ormArchetypesAfter = await orm.em
      .fork()
      .find((await import('../../src/db/entities/archetypes/Archetype.js')).Archetype, { user: userId });
    expect(ormArchetypesAfter.length).toBe(countBefore - 1);
  });
});
