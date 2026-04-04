import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { Experience } from '@tailoredin/domain';
import { Profile } from '../../src/db/entities/profile/Profile.js';
import { PostgresExperienceRepository } from '../../src/repositories/PostgresExperienceRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

async function seedProfile(orm: MikroORM): Promise<string> {
  const profile = Profile.create({
    email: `test-${crypto.randomUUID()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    location: null,
    linkedinUrl: null,
    githubUrl: null,
    websiteUrl: null
  });
  orm.em.persist(profile);
  await orm.em.flush();
  return profile.id;
}

describe('PostgresExperienceRepository — accomplishments', () => {
  let orm: MikroORM;
  let repo: PostgresExperienceRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresExperienceRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('persists and retrieves accomplishments', async () => {
    const profileId = await seedProfile(orm);
    const exp = Experience.create({
      profileId,
      title: 'Senior Engineer',
      companyName: 'ACME',
      companyWebsite: null,
      location: 'Remote',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });

    exp.addAccomplishment({
      title: 'Billing sharding',
      narrative: 'Led hash-based sharding migration, reducing P99 by 40%.',
      ordinal: 0
    });

    await repo.save(exp);

    const loaded = await repo.findByIdOrFail(exp.id.value);
    expect(loaded.accomplishments).toHaveLength(1);
    expect(loaded.accomplishments[0].title).toBe('Billing sharding');
  });

  it('deletes accomplishment on save', async () => {
    const profileId = await seedProfile(orm);
    const exp = Experience.create({
      profileId,
      title: 'Eng',
      companyName: 'Foo',
      companyWebsite: null,
      location: 'NY',
      startDate: '2020',
      endDate: '2022',
      summary: null,
      ordinal: 1
    });
    exp.addAccomplishment({ title: 'A', narrative: 'N', ordinal: 0 });
    await repo.save(exp);

    exp.removeAccomplishment(exp.accomplishments[0].id.value);
    await repo.save(exp);

    const loaded = await repo.findByIdOrFail(exp.id.value);
    expect(loaded.accomplishments).toHaveLength(0);
  });
});
