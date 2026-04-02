import { describe, expect, test } from 'bun:test';
import type { MakeResumeContentInput } from '@tailoredin/application';
import {
  ApprovalStatus,
  Archetype,
  ArchetypeId,
  type ArchetypeRepository,
  Bullet,
  BulletId,
  BulletVariant,
  BulletVariantId,
  ContentSelection,
  type EducationRepository,
  Experience,
  ExperienceId,
  type ExperienceRepository,
  Profile,
  ProfileId,
  type ProfileRepository,
  type SkillCategoryRepository,
  TagProfile,
  TagSet
} from '@tailoredin/domain';
import { DatabaseResumeContentFactory } from '../../src/services/DatabaseResumeContentFactory.js';

// --- Fixtures ---

const now = new Date();

function makeVariant(id: string, bulletId: string, text: string): BulletVariant {
  return new BulletVariant({
    id: new BulletVariantId(id),
    bulletId,
    text,
    angle: 'default',
    tags: TagSet.empty(),
    source: 'manual',
    approvalStatus: ApprovalStatus.APPROVED,
    createdAt: now,
    updatedAt: now
  });
}

function makeBullet(
  id: string,
  experienceId: string,
  ordinal: number,
  content: string,
  variants: BulletVariant[]
): Bullet {
  return new Bullet({
    id: new BulletId(id),
    experienceId,
    content,
    ordinal,
    tags: TagSet.empty(),
    variants,
    createdAt: now,
    updatedAt: now
  });
}

function makeExperience(id: string, bullets: Bullet[]): Experience {
  return new Experience({
    id: new ExperienceId(id),
    profileId: 'profile-1',
    title: `Title for ${id}`,
    companyName: `Company for ${id}`,
    companyWebsite: null,
    location: 'Remote',
    startDate: '2023-01',
    endDate: '2024-01',
    summary: null,
    ordinal: 0,
    bullets,
    createdAt: now,
    updatedAt: now
  });
}

const defaultProfile = new Profile({
  id: new ProfileId('profile-1'),
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  location: 'Remote',
  linkedinUrl: null,
  githubUrl: null,
  websiteUrl: null,
  createdAt: now,
  updatedAt: now
});

const defaultInput: MakeResumeContentInput = {
  profileId: 'profile-1',
  archetypeId: 'archetype-1',
  keywords: []
};

// --- Stubs ---

function stubProfileRepo(): ProfileRepository {
  return {
    findSingle: async () => defaultProfile,
    save: async () => {}
  };
}

function stubArchetypeRepo(contentSelection: ContentSelection): ArchetypeRepository {
  const archetype = new Archetype({
    id: new ArchetypeId('archetype-1'),
    profileId: 'profile-1',
    key: 'test',
    label: 'Test',
    headlineId: 'headline-1',
    headlineText: 'A great engineer',
    tagProfile: TagProfile.empty(),
    contentSelection,
    createdAt: now,
    updatedAt: now
  });
  return {
    findByIdOrFail: async () => archetype,
    findAll: async () => [archetype],
    save: async () => {},
    delete: async () => {}
  };
}

function stubExperienceRepo(experiences: Experience[]): ExperienceRepository {
  return {
    findByIdOrFail: async (id: string) => {
      const exp = experiences.find(e => e.id.value === id);
      if (!exp) throw new Error(`Not found: ${id}`);
      return exp;
    },
    findAll: async () => experiences,
    save: async () => {},
    delete: async () => {}
  };
}

function stubEducationRepo(): EducationRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
    save: async () => {},
    delete: async () => {}
  };
}

function stubSkillCategoryRepo(): SkillCategoryRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findByItemIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
    save: async () => {},
    delete: async () => {}
  };
}

function makeFactory(contentSelection: ContentSelection, experiences: Experience[]): DatabaseResumeContentFactory {
  return new DatabaseResumeContentFactory(
    stubProfileRepo(),
    stubArchetypeRepo(contentSelection),
    stubExperienceRepo(experiences),
    stubEducationRepo(),
    stubSkillCategoryRepo()
  );
}

// --- Tests ---

describe('DatabaseResumeContentFactory', () => {
  test('happy path: selected variants drive highlights', async () => {
    const v1 = makeVariant('v1', 'b1', 'Led migration to microservices');
    const v2 = makeVariant('v2', 'b2', 'Reduced deploy time by 40%');
    const b1 = makeBullet('b1', 'exp-1', 0, 'Original bullet 1', [v1, makeVariant('v1-alt', 'b1', 'Alt variant')]);
    const b2 = makeBullet('b2', 'exp-1', 1, 'Original bullet 2', [v2]);
    const exp = makeExperience('exp-1', [b1, b2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletVariantIds: ['v1', 'v2'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory(cs, [exp]);
    const result = await factory.make(defaultInput);

    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].highlights).toEqual(['Led migration to microservices.', 'Reduced deploy time by 40%.']);
  });

  test('selection order is preserved', async () => {
    const v1 = makeVariant('v1', 'b1', 'First variant');
    const v2 = makeVariant('v2', 'b2', 'Second variant');
    const b1 = makeBullet('b1', 'exp-1', 0, 'Bullet 1', [v1]);
    const b2 = makeBullet('b2', 'exp-1', 1, 'Bullet 2', [v2]);
    const exp = makeExperience('exp-1', [b1, b2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletVariantIds: ['v2', 'v1'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory(cs, [exp]);
    const result = await factory.make(defaultInput);

    expect(result.experience[0].highlights[0]).toBe('Second variant.');
    expect(result.experience[0].highlights[1]).toBe('First variant.');
  });

  test('missing variant is skipped silently', async () => {
    const v1 = makeVariant('v1', 'b1', 'Existing variant');
    const b1 = makeBullet('b1', 'exp-1', 0, 'Bullet 1', [v1]);
    const exp = makeExperience('exp-1', [b1]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletVariantIds: ['v1', 'nonexistent-id'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory(cs, [exp]);
    const result = await factory.make(defaultInput);

    expect(result.experience[0].highlights).toEqual(['Existing variant.']);
  });

  test('empty bulletVariantIds produces empty highlights but experience still present', async () => {
    const v1 = makeVariant('v1', 'b1', 'Some variant');
    const b1 = makeBullet('b1', 'exp-1', 0, 'Bullet 1', [v1]);
    const exp = makeExperience('exp-1', [b1]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletVariantIds: [] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory(cs, [exp]);
    const result = await factory.make(defaultInput);

    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].highlights).toEqual([]);
    expect(result.experience[0].title).toBe('Title for exp-1');
  });

  test('multiple experiences with different selections', async () => {
    const v1 = makeVariant('v1', 'b1', 'Variant for exp1');
    const v2 = makeVariant('v2', 'b2', 'Variant for exp2');
    const b1 = makeBullet('b1', 'exp-1', 0, 'Bullet 1', [v1]);
    const b2 = makeBullet('b2', 'exp-2', 0, 'Bullet 2', [v2]);
    const exp1 = makeExperience('exp-1', [b1]);
    const exp2 = makeExperience('exp-2', [b2]);

    const cs = new ContentSelection({
      experienceSelections: [
        { experienceId: 'exp-1', bulletVariantIds: ['v1'] },
        { experienceId: 'exp-2', bulletVariantIds: ['v2'] }
      ],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory(cs, [exp1, exp2]);
    const result = await factory.make(defaultInput);

    expect(result.experience).toHaveLength(2);
    expect(result.experience[0].highlights).toEqual(['Variant for exp1.']);
    expect(result.experience[1].highlights).toEqual(['Variant for exp2.']);
  });

  test('trailing period handling: added if missing, not doubled', async () => {
    const v1 = makeVariant('v1', 'b1', 'No period at end');
    const v2 = makeVariant('v2', 'b2', 'Already has period.');
    const b1 = makeBullet('b1', 'exp-1', 0, 'Bullet 1', [v1]);
    const b2 = makeBullet('b2', 'exp-1', 1, 'Bullet 2', [v2]);
    const exp = makeExperience('exp-1', [b1, b2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletVariantIds: ['v1', 'v2'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory(cs, [exp]);
    const result = await factory.make(defaultInput);

    expect(result.experience[0].highlights).toEqual(['No period at end.', 'Already has period.']);
  });
});
