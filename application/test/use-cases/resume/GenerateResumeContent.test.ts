import { describe, expect, mock, test } from 'bun:test';
import {
  Education,
  type EducationRepository,
  EntityNotFoundError,
  Experience,
  type ExperienceRepository,
  GenerationScope,
  GenerationSettings,
  type GenerationSettingsRepository,
  type JobDescriptionRepository,
  ModelTier,
  type ProfileRepository,
  type ResumeContentRepository
} from '@tailoredin/domain';
import type { ResumeContentGenerator, ResumeContentGeneratorInput } from '../../../src/ports/ResumeContentGenerator.js';
import { GenerateResumeContent } from '../../../src/use-cases/resume/GenerateResumeContent.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    firstName: 'John',
    lastName: 'Doe',
    about: 'Experienced software engineer',
    ...overrides
  };
}

function makeExperience(
  overrides: {
    id?: string;
    startDate?: string;
    title?: string;
    companyName?: string;
    profileId?: string;
    bulletMin?: number;
    bulletMax?: number;
  } = {}
) {
  return new Experience({
    id: overrides.id ?? 'exp-aaaa-0000-0000-0000-000000000001',
    profileId: overrides.profileId ?? 'profile-1',
    title: overrides.title ?? 'Software Engineer',
    companyName: overrides.companyName ?? 'Acme Corp',
    companyWebsite: null,
    companyAccent: null,
    companyId: null,
    location: 'New York, NY',
    startDate: overrides.startDate ?? '2023-01',
    endDate: '2024-01',
    summary: null,
    ordinal: 0,
    bulletMin: overrides.bulletMin ?? 2,
    bulletMax: overrides.bulletMax ?? 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeJobDescription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'jd-1',
    title: 'Senior Engineer',
    description: 'Build great things',
    rawText: 'Full raw text of the job posting',
    ...overrides
  };
}

function makeGeneratorResult(
  experiences: Array<{ experienceId: string; experienceTitle: string; companyName: string; bullets: string[] }>,
  headline = 'Senior Software Engineer | 10+ Years of Experience'
) {
  return {
    headline,
    experiences: experiences.map(e => ({ ...e, summary: 'Summary.' })),
    requestPrompt: 'test prompt',
    requestSchema: { type: 'object' }
  };
}

function mockResumeContentRepo(): ResumeContentRepository {
  return {
    findLatestByJobDescriptionId: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
    update: mock(() => Promise.resolve())
  };
}

function mockProfileRepo(profile: ReturnType<typeof makeProfile>): ProfileRepository {
  return {
    findSingle: mock(() => Promise.resolve(profile as never)),
    save: mock(() => Promise.resolve())
  };
}

function mockExperienceRepo(experiences: Experience[]): ExperienceRepository {
  return {
    findAll: mock(() => Promise.resolve(experiences)),
    findByIdOrFail: mock(() => Promise.reject(new Error('Not implemented'))),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

function mockJobDescriptionRepo(jd: ReturnType<typeof makeJobDescription> | null): JobDescriptionRepository {
  return {
    findById: mock(() => Promise.resolve(jd as never)),
    findByCompanyId: mock(() => Promise.resolve([])),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

function makeEducation(overrides: { id?: string; hiddenByDefault?: boolean } = {}) {
  return new Education({
    id: overrides.id ?? 'edu-0000-0000-0000-000000000001',
    profileId: 'profile-1',
    degreeTitle: 'B.S. Computer Science',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: null,
    ordinal: 0,
    hiddenByDefault: overrides.hiddenByDefault ?? false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function mockEducationRepo(educations: Education[] = []): EducationRepository {
  return {
    findAll: mock(() => Promise.resolve(educations)),
    findByIdOrFail: mock(() => Promise.reject(new Error('Not implemented'))),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

function mockGenerator(
  result: ReturnType<typeof makeGeneratorResult>
): ResumeContentGenerator & { generate: ReturnType<typeof mock> } {
  return { generate: mock(() => Promise.resolve(result)) };
}

function mockGenerationSettingsRepo(settings: GenerationSettings | null = null): GenerationSettingsRepository {
  return {
    findByProfileId: mock(() => Promise.resolve(settings)),
    save: mock(() => Promise.resolve())
  };
}

function createUseCase(opts: {
  profile?: ReturnType<typeof makeProfile>;
  experiences?: Experience[];
  jd?: ReturnType<typeof makeJobDescription> | null;
  generator?: ResumeContentGenerator;
  educations?: Education[];
  settings?: GenerationSettings | null;
}) {
  return new GenerateResumeContent(
    mockProfileRepo(opts.profile ?? makeProfile()),
    mockExperienceRepo(opts.experiences ?? []),
    mockJobDescriptionRepo('jd' in opts ? opts.jd : makeJobDescription()),
    mockResumeContentRepo(),
    opts.generator ?? mockGenerator(makeGeneratorResult([])),
    mockEducationRepo(opts.educations),
    mockGenerationSettingsRepo(opts.settings ?? null)
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumeContent', () => {
  test('happy path: returns ResumeContentDto with headline and bullets from generator output', async () => {
    const exp1 = makeExperience({
      id: 'exp-1111',
      title: 'Lead Engineer',
      companyName: 'Corp A',
      startDate: '2022-01'
    });
    const exp2 = makeExperience({ id: 'exp-2222', title: 'Engineer', companyName: 'Corp B', startDate: '2020-01' });

    const generatorResult = makeGeneratorResult(
      [
        {
          experienceId: 'exp-1111',
          experienceTitle: 'Lead Engineer',
          companyName: 'Corp A',
          bullets: ['Led a team of 5 engineers to deliver a new platform']
        },
        {
          experienceId: 'exp-2222',
          experienceTitle: 'Engineer',
          companyName: 'Corp B',
          bullets: ['Built microservices using Node.js and Kubernetes']
        }
      ],
      'Lead Engineer | 5+ Years of Experience'
    );

    const useCase = createUseCase({
      experiences: [exp1, exp2],
      generator: mockGenerator(generatorResult)
    });

    const result = await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(result.headline).toBe('Lead Engineer | 5+ Years of Experience');
    expect(result.experiences).toHaveLength(2);
    expect(result.experiences[0]).toEqual({
      experienceId: 'exp-1111',
      experienceTitle: 'Lead Engineer',
      companyName: 'Corp A',
      bullets: ['Led a team of 5 engineers to deliver a new platform']
    });
    expect(result.experiences[1]).toEqual({
      experienceId: 'exp-2222',
      experienceTitle: 'Engineer',
      companyName: 'Corp B',
      bullets: ['Built microservices using Node.js and Kubernetes']
    });
  });

  test('experiences are sorted by startDate descending before passed to generator', async () => {
    const expOld = makeExperience({
      id: 'exp-old',
      startDate: '2018-01',
      title: 'Junior Dev',
      companyName: 'Old Corp'
    });
    const expNew = makeExperience({
      id: 'exp-new',
      startDate: '2023-06',
      title: 'Senior Dev',
      companyName: 'New Corp'
    });
    const expMid = makeExperience({ id: 'exp-mid', startDate: '2020-03', title: 'Mid Dev', companyName: 'Mid Corp' });

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(
          makeGeneratorResult([
            { experienceId: 'exp-new', experienceTitle: 'Senior Dev', companyName: 'New Corp', bullets: [] },
            { experienceId: 'exp-mid', experienceTitle: 'Mid Dev', companyName: 'Mid Corp', bullets: [] },
            { experienceId: 'exp-old', experienceTitle: 'Junior Dev', companyName: 'Old Corp', bullets: [] }
          ])
        );
      })
    };

    const useCase = createUseCase({
      experiences: [expOld, expNew, expMid],
      generator
    });

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    const ids = capturedInput!.experiences.map(e => e.id);
    expect(ids).toEqual(['exp-new', 'exp-mid', 'exp-old']);
  });

  test('uses experience-level bullet limits', async () => {
    const experiences = [
      makeExperience({ id: 'e1', startDate: '2024-01', bulletMin: 3, bulletMax: 7 }),
      makeExperience({ id: 'e2', startDate: '2023-01', bulletMin: 1, bulletMax: 4 })
    ];

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([]));
      })
    };

    const useCase = createUseCase({ experiences, generator, settings: null });

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    const e1 = capturedInput!.experiences.find(e => e.id === 'e1');
    const e2 = capturedInput!.experiences.find(e => e.id === 'e2');
    expect(e1).toMatchObject({ minBullets: 3, maxBullets: 7 });
    expect(e2).toMatchObject({ minBullets: 1, maxBullets: 4 });
  });

  test('session bullet overrides take precedence over experience defaults', async () => {
    const experiences = [
      makeExperience({ id: 'exp-a', startDate: '2024-01', bulletMin: 3, bulletMax: 8 }),
      makeExperience({ id: 'exp-b', startDate: '2023-01', bulletMin: 3, bulletMax: 8 })
    ];

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([]));
      })
    };

    const useCase = createUseCase({ experiences, generator });

    await useCase.execute({
      jobDescriptionId: 'jd-1',
      bulletOverrides: [{ experienceId: 'exp-a', min: 1, max: 2 }]
    });

    expect(capturedInput).not.toBeNull();
    const expA = capturedInput!.experiences.find(e => e.id === 'exp-a');
    const expB = capturedInput!.experiences.find(e => e.id === 'exp-b');
    expect(expA).toMatchObject({ minBullets: 1, maxBullets: 2 });
    expect(expB).toMatchObject({ minBullets: 3, maxBullets: 8 });
  });

  test('model ID is resolved from settings tier and passed to generator', async () => {
    const settings = GenerationSettings.createDefault('profile-1');
    settings.updateModelTier(ModelTier.BEST);

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([]));
      })
    };

    const useCase = createUseCase({ generator, settings });

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.model).toBe('claude-opus-4-6');
  });

  test('composed prompt layers resume + scope + additional prompts', async () => {
    const settings = GenerationSettings.createDefault('profile-1');
    settings.setPrompt(GenerationScope.RESUME, 'Always use past tense');
    settings.setPrompt(GenerationScope.HEADLINE, 'Be concise');

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([], 'Test Headline'));
      })
    };

    const useCase = createUseCase({ generator, settings });

    await useCase.execute({
      jobDescriptionId: 'jd-1',
      additionalPrompt: 'Focus on leadership',
      scope: { type: 'headline' }
    });

    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.composedPrompt).toBe('Always use past tense\n\nBe concise\n\nFocus on leadership');
  });

  test('composed prompt omits missing layers', async () => {
    const settings = GenerationSettings.createDefault('profile-1');
    // No prompts set

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([]));
      })
    };

    const useCase = createUseCase({ generator, settings });

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.composedPrompt).toBeUndefined();
  });

  test('JD not found: throws EntityNotFoundError', async () => {
    const useCase = createUseCase({ jd: null });

    await expect(useCase.execute({ jobDescriptionId: 'missing-jd' })).rejects.toThrow(EntityNotFoundError);
  });

  test('generator input has correct profile and jd fields', async () => {
    const profile = makeProfile({ firstName: 'Alice', lastName: 'Smith', about: 'Full-stack developer' });
    const jd = makeJobDescription({
      title: 'Principal Engineer',
      description: 'Lead architecture',
      rawText: 'Raw JD text'
    });

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([]));
      })
    };

    const useCase = createUseCase({ profile, jd, generator });

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.profile).toEqual({ firstName: 'Alice', lastName: 'Smith', about: 'Full-stack developer' });
    expect(capturedInput!.jobDescription).toEqual({
      title: 'Principal Engineer',
      description: 'Lead architecture',
      rawText: 'Raw JD text'
    });
  });

  test('new resume content hides educations marked as hiddenByDefault', async () => {
    const generator = mockGenerator(makeGeneratorResult([]));

    const visibleEdu = makeEducation({ id: 'edu-visible', hiddenByDefault: false });
    const hiddenEdu = makeEducation({ id: 'edu-hidden', hiddenByDefault: true });

    const resumeContentRepo = mockResumeContentRepo();
    const useCase = new GenerateResumeContent(
      mockProfileRepo(makeProfile()),
      mockExperienceRepo([]),
      mockJobDescriptionRepo(makeJobDescription()),
      resumeContentRepo,
      generator,
      mockEducationRepo([visibleEdu, hiddenEdu]),
      mockGenerationSettingsRepo(null)
    );

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    const savedResumeContent = (resumeContentRepo.save as ReturnType<typeof mock>).mock.calls[0][0];
    expect(savedResumeContent.hiddenEducationIds).toEqual(['edu-hidden']);
  });
});
