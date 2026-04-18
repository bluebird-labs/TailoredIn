import type { MikroORM } from '@mikro-orm/postgresql';
import { Company, JobDescription, JobFitRequirement, JobFitScore, JobSource, Profile } from '@tailoredin/domain';
import { PostgresJobFitScoreRepository } from '../../src/job/PostgresJobFitScoreRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresJobFitScoreRepository', () => {
  let orm: MikroORM;
  let repo: PostgresJobFitScoreRepository;
  let profileId: string;
  let jobDescriptionId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresJobFitScoreRepository(orm);

    const profile = Profile.create({
      email: `test-${crypto.randomUUID()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      about: null,
      phone: null,
      location: null,
      linkedinUrl: null,
      githubUrl: null,
      websiteUrl: null
    });
    orm.em.persist(profile);

    const company = Company.create({
      name: 'Test Corp',
      domainName: `test-${crypto.randomUUID()}.com`,
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null
    });
    orm.em.persist(company);
    await orm.em.flush();

    const jd = JobDescription.create({
      companyId: company.id,
      title: 'Software Engineer',
      description: 'Build great software',
      source: JobSource.LINKEDIN
    });
    orm.em.persist(jd);
    await orm.em.flush();

    profileId = profile.id;
    jobDescriptionId = jd.id;
    orm.em.clear();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(JobFitRequirement, {});
    await orm.em.nativeDelete(JobFitScore, {});
    orm.em.clear();
  });

  function createScore(overrides?: Partial<Parameters<typeof JobFitScore.create>[0]>) {
    return JobFitScore.create({
      profileId,
      jobDescriptionId,
      overall: 85,
      summary: 'Strong match for this role.',
      requirements: [
        { requirement: '5+ years TypeScript', coverage: 'strong', reasoning: 'Has 7 years of TS experience.' },
        { requirement: 'Kubernetes experience', coverage: 'partial', reasoning: 'Some exposure via side projects.' },
        { requirement: 'ML background', coverage: 'absent', reasoning: 'No ML experience found.' }
      ],
      ...overrides
    });
  }

  describe('findByJobDescriptionId', () => {
    it('returns null when not found', async () => {
      const result = await repo.findByJobDescriptionId(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('returns score with populated requirements ordered by ordinal', async () => {
      const score = createScore();
      await repo.save(score);
      orm.em.clear();

      const loaded = await repo.findByJobDescriptionId(jobDescriptionId);
      expect(loaded).not.toBeNull();
      expect(loaded!.overall).toBe(85);
      expect(loaded!.summary).toBe('Strong match for this role.');
      expect(loaded!.requirements).toHaveLength(3);
      expect(loaded!.requirements[0].requirement).toBe('5+ years TypeScript');
      expect(loaded!.requirements[0].coverage).toBe('strong');
      expect(loaded!.requirements[1].coverage).toBe('partial');
      expect(loaded!.requirements[2].coverage).toBe('absent');
    });

    it('returns requirements in ordinal order', async () => {
      const score = createScore();
      await repo.save(score);
      orm.em.clear();

      const loaded = await repo.findByJobDescriptionId(jobDescriptionId);
      const ordinals = loaded!.requirements.map(r => r.ordinal);
      expect(ordinals).toEqual([0, 1, 2]);
    });
  });

  describe('findByJobDescriptionIds', () => {
    it('returns empty array for empty input', async () => {
      const result = await repo.findByJobDescriptionIds([]);
      expect(result).toEqual([]);
    });

    it('returns empty array when no scores exist', async () => {
      const result = await repo.findByJobDescriptionIds([crypto.randomUUID()]);
      expect(result).toEqual([]);
    });

    it('returns scores for matching job description IDs', async () => {
      const score = createScore();
      await repo.save(score);
      orm.em.clear();

      const result = await repo.findByJobDescriptionIds([jobDescriptionId]);
      expect(result).toHaveLength(1);
      expect(result[0].jobDescriptionId).toBe(jobDescriptionId);
      expect(result[0].overall).toBe(85);
      expect(result[0].requirements).toHaveLength(3);
    });

    it('returns only scores for requested IDs', async () => {
      const score = createScore();
      await repo.save(score);
      orm.em.clear();

      const result = await repo.findByJobDescriptionIds([jobDescriptionId, crypto.randomUUID()]);
      expect(result).toHaveLength(1);
      expect(result[0].jobDescriptionId).toBe(jobDescriptionId);
    });
  });

  describe('save', () => {
    it('persists a new score with requirements', async () => {
      const score = createScore();
      await repo.save(score);
      orm.em.clear();

      const loaded = await repo.findByJobDescriptionId(jobDescriptionId);
      expect(loaded).not.toBeNull();
      expect(loaded!.profileId).toBe(profileId);
      expect(loaded!.jobDescriptionId).toBe(jobDescriptionId);
      expect(loaded!.requirements).toHaveLength(3);
    });

    it('replaces existing score on save (upsert behavior)', async () => {
      const original = createScore({ overall: 70, summary: 'Decent match.' });
      await repo.save(original);
      orm.em.clear();

      const replacement = createScore({
        overall: 95,
        summary: 'Excellent match.',
        requirements: [{ requirement: 'TypeScript mastery', coverage: 'strong', reasoning: 'Expert level.' }]
      });
      await repo.save(replacement);
      orm.em.clear();

      const loaded = await repo.findByJobDescriptionId(jobDescriptionId);
      expect(loaded).not.toBeNull();
      expect(loaded!.overall).toBe(95);
      expect(loaded!.summary).toBe('Excellent match.');
      expect(loaded!.requirements).toHaveLength(1);
      expect(loaded!.requirements[0].requirement).toBe('TypeScript mastery');
    });

    it('cleans up old requirements when replacing', async () => {
      const original = createScore({
        requirements: [
          { requirement: 'Req A', coverage: 'strong', reasoning: 'R' },
          { requirement: 'Req B', coverage: 'partial', reasoning: 'R' },
          { requirement: 'Req C', coverage: 'absent', reasoning: 'R' }
        ]
      });
      await repo.save(original);
      orm.em.clear();

      const replacement = createScore({
        requirements: [{ requirement: 'New Req', coverage: 'strong', reasoning: 'R' }]
      });
      await repo.save(replacement);
      orm.em.clear();

      // Verify no orphan requirements remain
      const count = await orm.em.count(JobFitRequirement, {});
      expect(count).toBe(1);
    });
  });
});
