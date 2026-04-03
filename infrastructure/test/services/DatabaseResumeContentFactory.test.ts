import { describe, expect, test } from 'bun:test';
import type { MakeResumeContentFromSelectionInput } from '@tailoredin/application';
import type { ExperienceRepository } from '@tailoredin/domain';
import {
  Bullet,
  BulletId,
  ContentSelection,
  type EducationRepository,
  Experience,
  ExperienceId,
  Profile,
  ProfileId,
  type ProfileRepository,
  type SkillCategoryRepository,
  TagSet
} from '@tailoredin/domain';
import { DatabaseResumeContentFactory } from '../../src/services/DatabaseResumeContentFactory.js';

// --- Fixtures ---

const now = new Date();

function makeBullet(id: string, experienceId: string, ordinal: number, content: string): Bullet {
  return new Bullet({
    id: new BulletId(id),
    experienceId,
    content,
    verboseDescription: null,
    status: 'active',
    ordinal,
    tags: TagSet.empty(),
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
    narrative: null,
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

// --- Stubs ---

function stubProfileRepo(): ProfileRepository {
  return {
    findSingle: async () => defaultProfile,
    save: async () => {}
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

function makeFactory(experiences: Experience[]): DatabaseResumeContentFactory {
  return new DatabaseResumeContentFactory(
    stubProfileRepo(),
    stubExperienceRepo(experiences),
    stubEducationRepo(),
    stubSkillCategoryRepo()
  );
}

function makeInput(
  contentSelection: ContentSelection,
  overrides?: Partial<MakeResumeContentFromSelectionInput>
): MakeResumeContentFromSelectionInput {
  return {
    profileId: 'profile-1',
    headlineText: 'A great engineer',
    experienceSelections: contentSelection.experienceSelections,
    educationIds: contentSelection.educationIds,
    skillCategoryIds: contentSelection.skillCategoryIds,
    skillItemIds: contentSelection.skillItemIds,
    keywords: [],
    ...overrides
  };
}

// --- Tests ---

describe('DatabaseResumeContentFactory', () => {
  test('happy path: selected bullets drive highlights', async () => {
    const b1 = makeBullet('b1', 'exp-1', 0, 'Led migration to microservices');
    const b2 = makeBullet('b2', 'exp-1', 1, 'Reduced deploy time by 40%');
    const exp = makeExperience('exp-1', [b1, b2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletIds: ['b1', 'b2'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].highlights).toEqual(['Led migration to microservices.', 'Reduced deploy time by 40%.']);
  });

  test('selection order is preserved', async () => {
    const b1 = makeBullet('b1', 'exp-1', 0, 'First bullet');
    const b2 = makeBullet('b2', 'exp-1', 1, 'Second bullet');
    const exp = makeExperience('exp-1', [b1, b2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletIds: ['b2', 'b1'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience[0].highlights[0]).toBe('Second bullet.');
    expect(result.experience[0].highlights[1]).toBe('First bullet.');
  });

  test('missing bullet is skipped silently', async () => {
    const b1 = makeBullet('b1', 'exp-1', 0, 'Existing bullet');
    const exp = makeExperience('exp-1', [b1]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletIds: ['b1', 'nonexistent-id'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience[0].highlights).toEqual(['Existing bullet.']);
  });

  test('empty bulletIds produces empty highlights but experience still present', async () => {
    const b1 = makeBullet('b1', 'exp-1', 0, 'Some bullet');
    const exp = makeExperience('exp-1', [b1]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletIds: [] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience).toHaveLength(1);
    expect(result.experience[0].highlights).toEqual([]);
    expect(result.experience[0].title).toBe('Title for exp-1');
  });

  test('multiple experiences with different selections', async () => {
    const b1 = makeBullet('b1', 'exp-1', 0, 'Bullet for exp1');
    const b2 = makeBullet('b2', 'exp-2', 0, 'Bullet for exp2');
    const exp1 = makeExperience('exp-1', [b1]);
    const exp2 = makeExperience('exp-2', [b2]);

    const cs = new ContentSelection({
      experienceSelections: [
        { experienceId: 'exp-1', bulletIds: ['b1'] },
        { experienceId: 'exp-2', bulletIds: ['b2'] }
      ],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp1, exp2]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience).toHaveLength(2);
    expect(result.experience[0].highlights).toEqual(['Bullet for exp1.']);
    expect(result.experience[1].highlights).toEqual(['Bullet for exp2.']);
  });

  test('trailing period handling: added if missing, not doubled', async () => {
    const b1 = makeBullet('b1', 'exp-1', 0, 'No period at end');
    const b2 = makeBullet('b2', 'exp-1', 1, 'Already has period.');
    const exp = makeExperience('exp-1', [b1, b2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletIds: ['b1', 'b2'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience[0].highlights).toEqual(['No period at end.', 'Already has period.']);
  });
});
