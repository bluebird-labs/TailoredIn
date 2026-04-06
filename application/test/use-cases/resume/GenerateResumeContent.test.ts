import { describe, expect, mock, test } from 'bun:test';
import {
  EntityNotFoundError,
  Experience,
  ExperienceId,
  type ExperienceRepository,
  type JobDescriptionRepository,
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
    id: { value: 'profile-1' },
    firstName: 'John',
    lastName: 'Doe',
    about: 'Experienced software engineer',
    ...overrides
  };
}

function makeExperience(
  overrides: { id?: string; startDate?: string; title?: string; companyName?: string; profileId?: string } = {}
) {
  return new Experience({
    id: new ExperienceId(overrides.id ?? 'exp-aaaa-0000-0000-0000-000000000001'),
    profileId: overrides.profileId ?? 'profile-1',
    title: overrides.title ?? 'Software Engineer',
    companyName: overrides.companyName ?? 'Acme Corp',
    companyWebsite: null,
    companyId: null,
    location: 'New York, NY',
    startDate: overrides.startDate ?? '2023-01',
    endDate: '2024-01',
    summary: null,
    ordinal: 0,
    accomplishments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeJobDescription(overrides: Record<string, unknown> = {}) {
  return {
    id: { value: 'jd-1' },
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
    save: mock(() => Promise.resolve())
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

function mockGenerator(
  result: ReturnType<typeof makeGeneratorResult>
): ResumeContentGenerator & { generate: ReturnType<typeof mock> } {
  return { generate: mock(() => Promise.resolve(result)) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumeContent', () => {
  test('happy path: returns ResumeContentDto with headline and bullets from generator output', async () => {
    const profile = makeProfile();
    const jd = makeJobDescription();
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

    const generator = mockGenerator(generatorResult);

    const useCase = new GenerateResumeContent(
      mockProfileRepo(profile),
      mockExperienceRepo([exp1, exp2]),
      mockJobDescriptionRepo(jd),
      mockResumeContentRepo(),
      generator
    );

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
    const profile = makeProfile();
    const jd = makeJobDescription();

    // Intentionally in wrong order
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

    const useCase = new GenerateResumeContent(
      mockProfileRepo(profile),
      mockExperienceRepo([expOld, expNew, expMid]),
      mockJobDescriptionRepo(jd),
      mockResumeContentRepo(),
      generator
    );

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    const ids = capturedInput!.experiences.map(e => e.id);
    expect(ids).toEqual(['exp-new', 'exp-mid', 'exp-old']);
  });

  test('all experiences get the same bullet limits {min:2, max:20}', async () => {
    const profile = makeProfile();
    const jd = makeJobDescription();

    const experiences = [
      makeExperience({ id: 'e1', startDate: '2024-01' }),
      makeExperience({ id: 'e2', startDate: '2023-01' }),
      makeExperience({ id: 'e3', startDate: '2022-01' }),
      makeExperience({ id: 'e4', startDate: '2021-01' }),
      makeExperience({ id: 'e5', startDate: '2020-01' }),
      makeExperience({ id: 'e6', startDate: '2019-01' })
    ];

    let capturedInput: ResumeContentGeneratorInput | null = null;
    const generator: ResumeContentGenerator = {
      generate: mock((input: ResumeContentGeneratorInput) => {
        capturedInput = input;
        return Promise.resolve(makeGeneratorResult([]));
      })
    };

    const useCase = new GenerateResumeContent(
      mockProfileRepo(profile),
      mockExperienceRepo(experiences),
      mockJobDescriptionRepo(jd),
      mockResumeContentRepo(),
      generator
    );

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    for (const exp of capturedInput!.experiences) {
      expect(exp).toMatchObject({ minBullets: 2, maxBullets: 20 });
    }
  });

  test('JD not found: throws EntityNotFoundError', async () => {
    const profile = makeProfile();

    const useCase = new GenerateResumeContent(
      mockProfileRepo(profile),
      mockExperienceRepo([]),
      mockJobDescriptionRepo(null),
      mockResumeContentRepo(),
      mockGenerator(makeGeneratorResult([]))
    );

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

    const useCase = new GenerateResumeContent(
      mockProfileRepo(profile),
      mockExperienceRepo([]),
      mockJobDescriptionRepo(jd),
      mockResumeContentRepo(),
      generator
    );

    await useCase.execute({ jobDescriptionId: 'jd-1' });

    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.profile).toEqual({ firstName: 'Alice', lastName: 'Smith', about: 'Full-stack developer' });
    expect(capturedInput!.jobDescription).toEqual({
      title: 'Principal Engineer',
      description: 'Lead architecture',
      rawText: 'Raw JD text'
    });
  });
});
