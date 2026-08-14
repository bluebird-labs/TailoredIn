import {
  BusinessType,
  CompanyStage,
  type EducationRepository,
  type GenerationContext,
  GenerationScope,
  Industry,
  ModelTier,
  ResumeContent,
  type ResumeContentRepository
} from '@tailoredin/domain';
import type { ResumeElementGenerator } from '../../../src/ports/ResumeElementGenerator.js';
import type {
  GenerationContextBuilder,
  GenerationContextOptions
} from '../../../src/services/GenerationContextBuilder.js';
import type { ComposedPrompt } from '../../../src/services/prompt/ComposedPrompt.js';
import type { PromptRegistry } from '../../../src/services/prompt/PromptRegistry.js';
import { GenerateResumeContent } from '../../../src/use-cases/resume/GenerateResumeContent.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROFILE_ID = 'profile-1';
const JD_ID = 'jd-1';
const EXP_1 = 'exp-1';
const EXP_2 = 'exp-2';

/** The fake recipe hands the composed context straight through so tests can assert on it. */
type FakePrompt = { scope: GenerationScope; context: GenerationContext };

function makeContext(options: GenerationContextOptions): GenerationContext {
  return {
    profile: { id: PROFILE_ID, firstName: 'John', lastName: 'Doe', about: null, location: null },
    jobDescription: {
      id: JD_ID,
      title: 'Staff Engineer',
      description: 'Build things',
      rawText: null,
      soughtHardSkills: [],
      soughtSoftSkills: [],
      level: null
    },
    experiences: [
      {
        id: EXP_1,
        title: 'Engineer',
        companyName: 'Acme',
        summary: null,
        accomplishments: [],
        startDate: '2022-01',
        endDate: '2024-01',
        location: 'Paris',
        bulletMin: 2,
        bulletMax: 4,
        companyId: 'company-1'
      },
      {
        id: EXP_2,
        title: 'Developer',
        companyName: 'Globex',
        summary: null,
        accomplishments: [],
        startDate: '2019-01',
        endDate: '2022-01',
        location: 'Lyon',
        bulletMin: 2,
        bulletMax: 3,
        companyId: 'company-2'
      }
    ],
    companies: [
      {
        id: 'company-1',
        name: 'Acme',
        description: null,
        industry: Industry.SOFTWARE,
        stage: CompanyStage.SERIES_B,
        businessType: BusinessType.B2B
      }
    ],
    education: [],
    settings: { modelTier: ModelTier.BALANCED, bulletMin: 2, bulletMax: 5, adminPrompts: new Map() },
    userInstructions: options.userInstructions ?? null,
    currentVersion: options.currentVersion ?? null
  };
}

function makeExisting(
  prompt: string,
  experiences: Array<{ experienceId: string; summary: string; bullets: string[] }> = [
    { experienceId: EXP_1, summary: 'Old summary 1', bullets: ['Old bullet 1'] },
    { experienceId: EXP_2, summary: 'Old summary 2', bullets: ['Old bullet 2'] }
  ]
): ResumeContent {
  return new ResumeContent({
    id: 'rc-1',
    profileId: PROFILE_ID,
    jobDescriptionId: JD_ID,
    headline: 'Old headline',
    experiences: experiences.map(e => ({ ...e, hiddenBulletIndices: [] })),
    hiddenEducationIds: [],
    prompt,
    schema: null,
    score: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

type Harness = {
  useCase: GenerateResumeContent;
  buildOptions: GenerationContextOptions[];
  prompts: FakePrompt[];
  saved: ResumeContent[];
  generate: jest.Mock;
};

function makeHarness(existing: ResumeContent | null, generateImpl?: (prompt: FakePrompt) => Promise<unknown>): Harness {
  const buildOptions: GenerationContextOptions[] = [];
  const prompts: FakePrompt[] = [];
  const saved: ResumeContent[] = [];

  const contextBuilder = {
    build: jest.fn(async (_profileId: string, _jobDescriptionId: string, options: GenerationContextOptions = {}) => {
      buildOptions.push(options);
      return makeContext(options);
    })
  } as unknown as GenerationContextBuilder;

  const registry = {
    getRecipe: (scope: GenerationScope) => ({
      scope,
      compose: (context: GenerationContext) => ({ scope, context }) as unknown as ComposedPrompt
    })
  } as unknown as PromptRegistry;

  const generate = jest.fn(async (composed: ComposedPrompt) => {
    const prompt = composed as unknown as FakePrompt;
    prompts.push(prompt);
    if (generateImpl) return generateImpl(prompt);
    return defaultGeneratorResult(prompt);
  });
  const elementGenerator = { generate } as unknown as ResumeElementGenerator;

  const resumeContentRepository = {
    findLatestByJobDescriptionId: jest.fn(async () => existing),
    save: jest.fn(async (content: ResumeContent) => {
      saved.push(content);
    })
  } as unknown as ResumeContentRepository;

  const educationRepository = { findAll: jest.fn(async () => []) } as unknown as EducationRepository;

  const useCase = new GenerateResumeContent(
    contextBuilder,
    registry,
    elementGenerator,
    resumeContentRepository,
    educationRepository
  );

  return { useCase, buildOptions, prompts, saved, generate };
}

function defaultGeneratorResult(prompt: FakePrompt): unknown {
  switch (prompt.scope) {
    case GenerationScope.HEADLINE:
      return { headline: 'New headline' };
    case GenerationScope.EXPERIENCE:
      return { summary: `New summary for ${prompt.context.experiences[0]?.id}`, bullets: ['New bullet'] };
    case GenerationScope.EXPERIENCE_SUMMARY:
      return { summary: `New summary for ${prompt.context.experiences[0]?.id}` };
    case GenerationScope.BULLET:
      return { bullet: 'New bullet' };
    default:
      return {};
  }
}

function promptFor(prompts: FakePrompt[], scope: GenerationScope, experienceId?: string): FakePrompt {
  const found = prompts.find(
    p => p.scope === scope && (experienceId === undefined || p.context.experiences[0]?.id === experienceId)
  );
  if (!found) throw new Error(`No prompt captured for ${scope}${experienceId ? ` / ${experienceId}` : ''}`);
  return found;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumeContent — stored instruction merge', () => {
  test('undefined customInstructions preserves the stored instruction and still steers the generation', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    expect(JSON.parse(harness.saved[0]!.prompt)).toEqual({ resume: 'Be punchy' });
    expect(harness.buildOptions[0]?.userInstructions).toContain('Be punchy');
    expect(promptFor(harness.prompts, GenerationScope.HEADLINE).context.userInstructions).toContain('Be punchy');
  });

  test('undefined customInstructions on a scoped regeneration leaves other scopes untouched', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy', [`experience:${EXP_1}`]: 'Focus on scale' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      scope: { type: 'experience', experienceId: EXP_1 }
    });

    expect(JSON.parse(harness.saved[0]!.prompt)).toEqual({
      resume: 'Be punchy',
      [`experience:${EXP_1}`]: 'Focus on scale'
    });
  });

  test('null customInstructions clears the stored instruction for that scope only', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy', headline: 'Keep it short' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      customInstructions: null,
      scope: { type: 'headline' }
    });

    expect(JSON.parse(harness.saved[0]!.prompt)).toEqual({ resume: 'Be punchy' });
    const instructions = harness.buildOptions[0]?.userInstructions ?? '';
    expect(instructions).toContain('Be punchy');
    expect(instructions).not.toContain('Keep it short');
  });

  test('blank customInstructions clears the stored instruction', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy', headline: 'Keep it short' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      customInstructions: '   ',
      scope: { type: 'headline' }
    });

    expect(JSON.parse(harness.saved[0]!.prompt)).toEqual({ resume: 'Be punchy' });
  });

  test('a non-empty customInstructions is stored trimmed for the targeted scope', async () => {
    const harness = makeHarness(null);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      customInstructions: '  Lead with impact  '
    });

    expect(JSON.parse(harness.saved[0]!.prompt)).toEqual({ resume: 'Lead with impact' });
    expect(harness.buildOptions[0]?.userInstructions).toContain('Lead with impact');
  });
});

describe('GenerateResumeContent — effective instructions', () => {
  test('regenerating one experience includes the resume-wide steering plus the scoped one', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy', [`experience:${EXP_1}`]: 'Focus on scale' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      scope: { type: 'experience', experienceId: EXP_1 }
    });

    const instructions = promptFor(harness.prompts, GenerationScope.EXPERIENCE, EXP_1).context.userInstructions ?? '';
    expect(instructions).toContain('## Resume-wide direction');
    expect(instructions).toContain('Be punchy');
    expect(instructions).toContain('## Direction for this section (takes precedence over the resume-wide direction)');
    expect(instructions).toContain('Focus on scale');
    expect(instructions.indexOf('Be punchy')).toBeLessThan(instructions.indexOf('Focus on scale'));
  });

  test('a full generation gives each target its own resolved instructions', async () => {
    const existing = makeExisting(
      JSON.stringify({
        resume: 'Be punchy',
        headline: 'Mention platform work',
        [`experience:${EXP_1}`]: 'Focus on scale',
        [`experience:${EXP_2}`]: 'Focus on mentoring'
      })
    );
    const harness = makeHarness(existing);

    await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    const headline = promptFor(harness.prompts, GenerationScope.HEADLINE).context.userInstructions ?? '';
    expect(headline).toContain('Be punchy');
    expect(headline).toContain('Mention platform work');

    const first = promptFor(harness.prompts, GenerationScope.EXPERIENCE, EXP_1).context.userInstructions ?? '';
    expect(first).toContain('Be punchy');
    expect(first).toContain('Focus on scale');
    expect(first).not.toContain('Focus on mentoring');

    const second = promptFor(harness.prompts, GenerationScope.EXPERIENCE, EXP_2).context.userInstructions ?? '';
    expect(second).toContain('Focus on mentoring');
    expect(second).not.toContain('Focus on scale');
  });

  test('the resume-wide scope is not duplicated as a section direction', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    const instructions = harness.buildOptions[0]?.userInstructions ?? '';
    expect(instructions).toBe('## Resume-wide direction\nBe punchy');
  });

  test('no stored steering resolves to null instructions', async () => {
    const harness = makeHarness(makeExisting(''));

    await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    expect(harness.buildOptions[0]?.userInstructions).toBeNull();
    expect(promptFor(harness.prompts, GenerationScope.HEADLINE).context.userInstructions).toBeNull();
  });

  test('a bullet regeneration appends its one-off instruction after the stored steering', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy', [`experience:${EXP_1}`]: 'Focus on scale' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      scope: { type: 'bullet', experienceId: EXP_1, bulletIndex: 0, instructions: 'Add a metric' }
    });

    const instructions = promptFor(harness.prompts, GenerationScope.BULLET).context.userInstructions ?? '';
    expect(instructions).toContain('Be punchy');
    expect(instructions).toContain('Focus on scale');
    expect(instructions).toContain('## Direction for this bullet (takes precedence over the directions above)');
    expect(instructions.indexOf('Focus on scale')).toBeLessThan(instructions.indexOf('Add a metric'));
  });
});

describe('GenerateResumeContent — prior draft', () => {
  test('a full generation scopes the prior draft per target — no cross-experience contamination', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      includeCurrentVersion: true
    });

    // The shared base context never carries a prior draft — only the derived per-target contexts do.
    expect(harness.buildOptions[0]?.currentVersion).toBeNull();

    const headline = promptFor(harness.prompts, GenerationScope.HEADLINE).context.currentVersion ?? '';
    expect(headline).toBe('## Headline\nOld headline');

    const first = promptFor(harness.prompts, GenerationScope.EXPERIENCE, EXP_1).context.currentVersion ?? '';
    expect(first).toContain('Old summary 1');
    expect(first).toContain('1. Old bullet 1');
    expect(first).not.toContain('Old summary 2');
    expect(first).not.toContain('Old bullet 2');
    expect(first).not.toContain('Old headline');

    const second = promptFor(harness.prompts, GenerationScope.EXPERIENCE, EXP_2).context.currentVersion ?? '';
    expect(second).toContain('Old summary 2');
    expect(second).not.toContain('Old summary 1');
  });

  test('the prior draft never leaks into the instructions', async () => {
    const existing = makeExisting(JSON.stringify({ resume: 'Be punchy' }));
    const harness = makeHarness(existing);

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      includeCurrentVersion: true
    });

    for (const prompt of harness.prompts) {
      expect(prompt.context.userInstructions ?? '').not.toContain('Old');
    }
  });

  test('a full generation without includeCurrentVersion sends no prior draft to any target', async () => {
    const harness = makeHarness(makeExisting(''));

    await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    expect(harness.buildOptions[0]?.currentVersion).toBeNull();
    for (const prompt of harness.prompts) {
      expect(prompt.context.currentVersion).toBeNull();
    }
  });

  test('an experience-scoped regeneration only carries that experience prior draft', async () => {
    const harness = makeHarness(makeExisting(''));

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      includeCurrentVersion: true,
      scope: { type: 'experience', experienceId: EXP_1 }
    });

    const currentVersion = harness.buildOptions[0]?.currentVersion ?? '';
    expect(currentVersion).toContain('Old summary 1');
    expect(currentVersion).not.toContain('Old summary 2');
    expect(currentVersion).not.toContain('Old headline');
  });

  test('a headline regeneration only carries the previous headline', async () => {
    const harness = makeHarness(makeExisting(''));

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      includeCurrentVersion: true,
      scope: { type: 'headline' }
    });

    expect(harness.buildOptions[0]?.currentVersion).toBe('## Headline\nOld headline');
  });

  test('no prior draft is sent on a scoped regeneration unless asked for', async () => {
    const harness = makeHarness(makeExisting(''));

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      scope: { type: 'experience', experienceId: EXP_1 }
    });

    expect(harness.buildOptions[0]?.currentVersion).toBeNull();
  });
});

describe('GenerateResumeContent — failure reporting', () => {
  test('a failed experience is reported and keeps its previous content', async () => {
    const existing = makeExisting('');
    const harness = makeHarness(existing, async prompt => {
      if (prompt.scope === GenerationScope.EXPERIENCE && prompt.context.experiences[0]?.id === EXP_2) {
        throw new Error('schema validation failed');
      }
      return defaultGeneratorResult(prompt);
    });

    const result = await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    expect(result.failedExperienceIds).toEqual([EXP_2]);
    const failed = result.experiences.find(e => e.experienceId === EXP_2);
    expect(failed?.bullets).toEqual(['Old bullet 2']);
    const succeeded = result.experiences.find(e => e.experienceId === EXP_1);
    expect(succeeded?.bullets).toEqual(['New bullet']);
    expect(harness.saved[0]!.experiences.find(e => e.experienceId === EXP_2)?.summary).toBe('Old summary 2');
  });

  test('a successful full generation reports no failures', async () => {
    const harness = makeHarness(makeExisting(''));

    const result = await harness.useCase.execute({ profileId: PROFILE_ID, jobDescriptionId: JD_ID });

    expect(result.failedExperienceIds).toEqual([]);
    expect(result.headline).toBe('New headline');
  });

  test('scoped regenerations report no failures', async () => {
    const harness = makeHarness(makeExisting(''));

    const headline = await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      scope: { type: 'headline' }
    });
    const experience = await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      scope: { type: 'experience', experienceId: EXP_1 }
    });

    expect(headline.failedExperienceIds).toEqual([]);
    expect(experience.failedExperienceIds).toEqual([]);
  });
});

describe('GenerateResumeContent — bullet overrides', () => {
  test('bullet overrides are forwarded to the context builder', async () => {
    const harness = makeHarness(makeExisting(''));

    await harness.useCase.execute({
      profileId: PROFILE_ID,
      jobDescriptionId: JD_ID,
      bulletOverrides: [{ experienceId: EXP_1, min: 1, max: 2 }]
    });

    expect(harness.buildOptions[0]?.bulletOverrides).toEqual([{ experienceId: EXP_1, min: 1, max: 2 }]);
  });
});
