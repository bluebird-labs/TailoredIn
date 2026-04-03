import { describe, expect, test } from 'bun:test';
import type { MakeResumeContentFromSelectionInput } from '@tailoredin/application';
import type { ExperienceRepository } from '@tailoredin/domain';
import {
  Accomplishment,
  AccomplishmentId,
  ContentSelection,
  type EducationRepository,
  Experience,
  ExperienceId,
  Profile,
  ProfileId,
  type ProfileRepository,
  type SkillCategoryRepository
} from '@tailoredin/domain';
import { DatabaseResumeContentFactory } from '../../src/services/DatabaseResumeContentFactory.js';

// --- Fixtures ---

const now = new Date();

function makeAccomplishment(id: string, experienceId: string, ordinal: number, title: string): Accomplishment {
  return new Accomplishment({
    id: new AccomplishmentId(id),
    experienceId,
    title,
    narrative: '',
    skillTags: [],
    ordinal,
    createdAt: now,
    updatedAt: now
  });
}

function makeExperience(id: string, accomplishments: Accomplishment[]): Experience {
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
    accomplishments,
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
  test('happy path: selected accomplishments drive highlights', async () => {
    const a1 = makeAccomplishment('a1', 'exp-1', 0, 'Led migration to microservices');
    const a2 = makeAccomplishment('a2', 'exp-1', 1, 'Reduced deploy time by 40%');
    const exp = makeExperience('exp-1', [a1, a2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', accomplishmentIds: ['a1', 'a2'] }],
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
    const a1 = makeAccomplishment('a1', 'exp-1', 0, 'First accomplishment');
    const a2 = makeAccomplishment('a2', 'exp-1', 1, 'Second accomplishment');
    const exp = makeExperience('exp-1', [a1, a2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', accomplishmentIds: ['a2', 'a1'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience[0].highlights[0]).toBe('Second accomplishment.');
    expect(result.experience[0].highlights[1]).toBe('First accomplishment.');
  });

  test('missing accomplishment is skipped silently', async () => {
    const a1 = makeAccomplishment('a1', 'exp-1', 0, 'Existing accomplishment');
    const exp = makeExperience('exp-1', [a1]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', accomplishmentIds: ['a1', 'nonexistent-id'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience[0].highlights).toEqual(['Existing accomplishment.']);
  });

  test('empty accomplishmentIds produces empty highlights but experience still present', async () => {
    const a1 = makeAccomplishment('a1', 'exp-1', 0, 'Some accomplishment');
    const exp = makeExperience('exp-1', [a1]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', accomplishmentIds: [] }],
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
    const a1 = makeAccomplishment('a1', 'exp-1', 0, 'Accomplishment for exp1');
    const a2 = makeAccomplishment('a2', 'exp-2', 0, 'Accomplishment for exp2');
    const exp1 = makeExperience('exp-1', [a1]);
    const exp2 = makeExperience('exp-2', [a2]);

    const cs = new ContentSelection({
      experienceSelections: [
        { experienceId: 'exp-1', accomplishmentIds: ['a1'] },
        { experienceId: 'exp-2', accomplishmentIds: ['a2'] }
      ],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });

    const factory = makeFactory([exp1, exp2]);
    const result = await factory.makeFromSelection(makeInput(cs));

    expect(result.experience).toHaveLength(2);
    expect(result.experience[0].highlights).toEqual(['Accomplishment for exp1.']);
    expect(result.experience[1].highlights).toEqual(['Accomplishment for exp2.']);
  });

  test('trailing period handling: added if missing, not doubled', async () => {
    const a1 = makeAccomplishment('a1', 'exp-1', 0, 'No period at end');
    const a2 = makeAccomplishment('a2', 'exp-1', 1, 'Already has period.');
    const exp = makeExperience('exp-1', [a1, a2]);

    const cs = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', accomplishmentIds: ['a1', 'a2'] }],
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
