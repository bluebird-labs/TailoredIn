import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import type { ResumeExperience } from '@tailoredin/domain';
import { Company, JobDescription, JobSource, Profile, ResumeContent } from '@tailoredin/domain';
import { PostgresResumeContentRepository } from '../../src/resume/PostgresResumeContentRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresResumeContentRepository', () => {
  let orm: MikroORM;
  let repo: PostgresResumeContentRepository;
  let profileId: string;
  let jobDescriptionId: string;
  let otherJobDescriptionId: string;

  const sampleExperience: ResumeExperience = {
    experienceId: crypto.randomUUID(),
    summary: 'Led engineering team',
    bullets: ['Built microservices', 'Improved latency by 40%'],
    hiddenBulletIndices: []
  };

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresResumeContentRepository(orm);

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
    const otherJd = JobDescription.create({
      companyId: company.id,
      title: 'Staff Engineer',
      description: 'Lead engineering initiatives',
      source: JobSource.GREENHOUSE
    });
    orm.em.persist(jd);
    orm.em.persist(otherJd);
    await orm.em.flush();

    profileId = profile.id;
    jobDescriptionId = jd.id;
    otherJobDescriptionId = otherJd.id;
    orm.em.clear();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(ResumeContent, {});
    orm.em.clear();
  });

  function createResumeContent(overrides?: Partial<Parameters<typeof ResumeContent.create>[0]>) {
    return ResumeContent.create({
      profileId,
      jobDescriptionId,
      headline: 'Senior Software Engineer',
      experiences: [sampleExperience],
      prompt: 'Generate a professional resume.',
      schema: null,
      ...overrides
    });
  }

  async function seedResumeContent(
    overrides?: Partial<Parameters<typeof ResumeContent.create>[0]>
  ): Promise<ResumeContent> {
    const rc = createResumeContent(overrides);
    orm.em.persist(rc);
    await orm.em.flush();
    orm.em.clear();
    return rc;
  }

  describe('findById', () => {
    it('returns null when not found', async () => {
      const result = await repo.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('returns resume content when found', async () => {
      const rc = await seedResumeContent({ headline: 'Staff Engineer' });

      const result = await repo.findById(rc.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(rc.id);
      expect(result!.headline).toBe('Staff Engineer');
      expect(result!.profileId).toBe(profileId);
      expect(result!.experiences).toHaveLength(1);
      expect(result!.experiences[0].summary).toBe('Led engineering team');
    });
  });

  describe('findLatestByJobDescriptionId', () => {
    it('returns null when not found', async () => {
      const result = await repo.findLatestByJobDescriptionId(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('returns latest by createdAt DESC when multiple exist', async () => {
      const rc1 = createResumeContent({ headline: 'Oldest' });
      const rc2 = createResumeContent({ headline: 'Newest' });

      orm.em.persist(rc1);
      orm.em.persist(rc2);
      await orm.em.flush();

      const conn = orm.em.getConnection();
      await conn.execute(`UPDATE resume_contents SET created_at = '2024-01-01' WHERE id = ?`, [rc1.id]);
      await conn.execute(`UPDATE resume_contents SET created_at = '2024-03-01' WHERE id = ?`, [rc2.id]);
      orm.em.clear();

      const result = await repo.findLatestByJobDescriptionId(jobDescriptionId);
      expect(result).not.toBeNull();
      expect(result!.headline).toBe('Newest');
    });

    it('scopes to the correct job description', async () => {
      await seedResumeContent({ headline: 'For JD1', jobDescriptionId });
      await seedResumeContent({ headline: 'For JD2', jobDescriptionId: otherJobDescriptionId });

      const result = await repo.findLatestByJobDescriptionId(otherJobDescriptionId);
      expect(result).not.toBeNull();
      expect(result!.headline).toBe('For JD2');
    });
  });

  describe('save', () => {
    it('persists new resume content', async () => {
      const rc = createResumeContent({
        headline: 'Engineering Leader',
        hiddenEducationIds: ['edu-1', 'edu-2'],
        schema: { version: 1 }
      });
      await repo.save(rc);
      orm.em.clear();

      const loaded = await repo.findById(rc.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.headline).toBe('Engineering Leader');
      expect(loaded!.hiddenEducationIds).toEqual(['edu-1', 'edu-2']);
      expect(loaded!.schema).toEqual({ version: 1 });
      expect(loaded!.prompt).toBe('Generate a professional resume.');
    });
  });

  describe('update', () => {
    it('updates only mutable fields', async () => {
      const rc = await seedResumeContent({
        headline: 'Original Headline',
        prompt: 'Original prompt',
        schema: { v: 1 }
      });

      const loaded = await repo.findById(rc.id);
      const updatedExperiences: ResumeExperience[] = [
        { experienceId: crypto.randomUUID(), summary: 'New summary', bullets: ['New bullet'], hiddenBulletIndices: [0] }
      ];
      const updated = new ResumeContent({
        id: loaded!.id,
        profileId: loaded!.profileId,
        jobDescriptionId: loaded!.jobDescriptionId,
        headline: 'Changed Headline',
        experiences: updatedExperiences,
        hiddenEducationIds: ['hidden-1'],
        prompt: 'Changed prompt',
        schema: { v: 2 },
        score: { overall: 90, requirements: [], summary: 'Great' },
        createdAt: loaded!.createdAt,
        updatedAt: new Date()
      });

      await repo.update(updated);
      orm.em.clear();

      const reloaded = await repo.findById(rc.id);
      // Mutable fields should be updated
      expect(reloaded!.experiences).toHaveLength(1);
      expect(reloaded!.experiences[0].summary).toBe('New summary');
      expect(reloaded!.hiddenEducationIds).toEqual(['hidden-1']);
      expect(reloaded!.score).toEqual({ overall: 90, requirements: [], summary: 'Great' });

      // Immutable fields should remain unchanged
      expect(reloaded!.headline).toBe('Original Headline');
      expect(reloaded!.prompt).toBe('Original prompt');
      expect(reloaded!.schema).toEqual({ v: 1 });
    });

    it('throws when resume content not found', async () => {
      const rc = createResumeContent();
      // Don't persist — ID won't exist in DB
      expect(repo.update(rc)).rejects.toThrow();
    });
  });
});
