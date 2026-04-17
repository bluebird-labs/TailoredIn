import type { MikroORM } from '@mikro-orm/postgresql';
import { Profile } from '@tailoredin/domain';
import { PostgresProfileRepository } from '../../src/resume/PostgresProfileRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresProfileRepository', () => {
  let orm: MikroORM;
  let repo: PostgresProfileRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresProfileRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Profile, {});
    orm.em.clear();
  });

  describe('findByIdOrFail', () => {
    it('throws EntityNotFoundError when profile does not exist', async () => {
      await expect(repo.findByIdOrFail(crypto.randomUUID())).rejects.toThrow('Profile');
    });

    it('returns profile when it exists', async () => {
      const profile = Profile.create({
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        about: 'A software engineer',
        phone: '+1234567890',
        location: 'NYC',
        linkedinUrl: 'https://linkedin.com/in/john',
        githubUrl: 'https://github.com/john',
        websiteUrl: 'https://john.dev'
      });
      orm.em.persist(profile);
      await orm.em.flush();
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(profile.id);
      expect(loaded.id).toBe(profile.id);
      expect(loaded.email).toBe('john@example.com');
      expect(loaded.firstName).toBe('John');
      expect(loaded.lastName).toBe('Doe');
      expect(loaded.about).toBe('A software engineer');
      expect(loaded.location).toBe('NYC');
    });
  });

  describe('save', () => {
    it('persists a new profile', async () => {
      const profile = Profile.create({
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        about: null,
        phone: null,
        location: null,
        linkedinUrl: null,
        githubUrl: null,
        websiteUrl: null
      });
      await repo.save(profile);
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(profile.id);
      expect(loaded.email).toBe('jane@example.com');
      expect(loaded.firstName).toBe('Jane');
    });

    it('updates existing profile', async () => {
      const profile = Profile.create({
        email: 'update@example.com',
        firstName: 'Before',
        lastName: 'Update',
        about: null,
        phone: null,
        location: null,
        linkedinUrl: null,
        githubUrl: null,
        websiteUrl: null
      });
      await repo.save(profile);
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(profile.id);
      loaded.firstName = 'After';
      loaded.about = 'Updated about';
      loaded.location = 'San Francisco';
      await repo.save(loaded);
      orm.em.clear();

      const reloaded = await repo.findByIdOrFail(profile.id);
      expect(reloaded.firstName).toBe('After');
      expect(reloaded.about).toBe('Updated about');
      expect(reloaded.location).toBe('San Francisco');
    });
  });
});
