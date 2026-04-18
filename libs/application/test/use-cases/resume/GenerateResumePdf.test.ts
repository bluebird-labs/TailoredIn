import {
  type EducationRepository,
  EntityNotFoundError,
  Experience,
  type ExperienceRepository,
  JobDescription,
  type JobDescriptionRepository,
  JobSource,
  type ProfileRepository,
  ResumeContent,
  type ResumeContentRepository
} from '@tailoredin/domain';
import type { ResumeRenderer } from '../../../src/ports/ResumeRenderer.js';
import type { ResumeRendererFactory } from '../../../src/ports/ResumeRendererFactory.js';
import { GenerateResumePdf } from '../../../src/use-cases/resume/GenerateResumePdf.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile() {
  return {
    id: 'profile-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    location: 'New York, NY',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: null,
    websiteUrl: null,
    about: 'Engineer'
  };
}

function makeJd() {
  return JobDescription.create({
    companyId: 'company-1',
    title: 'Staff Engineer',
    description: 'Build things',
    source: JobSource.UPLOAD
  });
}

function makeResumeContent(
  experiences: Array<{
    experienceId: string;
    summary: string;
    bullets: string[];
    hiddenBulletIndices?: number[];
  }> = DEFAULT_EXPERIENCES,
  headline = 'Staff Engineer | 5+ Years of Experience',
  hiddenEducationIds: string[] = []
) {
  return new ResumeContent({
    id: 'rc-00000000-0000-0000-0000-000000000001',
    profileId: 'profile-1',
    jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001',
    headline,
    experiences: experiences.map(e => ({ ...e, hiddenBulletIndices: e.hiddenBulletIndices ?? [] })),
    hiddenEducationIds,
    prompt: 'test prompt',
    schema: {},
    score: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

const DEFAULT_EXPERIENCES = [
  {
    experienceId: 'exp-00000000-0000-0000-0000-000000000001',
    summary: 'Built scalable systems',
    bullets: ['Designed and implemented distributed systems']
  }
];

function makeExperience() {
  return new Experience({
    id: 'exp-00000000-0000-0000-0000-000000000001',
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme',
    companyWebsite: null,
    companyAccent: null,
    companyId: null,
    location: 'NY',
    startDate: '2022-01',
    endDate: 'Present',
    summary: null,
    ordinal: 0,
    bulletMin: 2,
    bulletMax: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

function makeEducation() {
  return {
    id: 'edu-00000000-0000-0000-0000-000000000001',
    profileId: 'profile-1',
    degreeTitle: 'BSc CS',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: null
  };
}

function mockResumeContentRepo(resumeContent: ResumeContent | null): ResumeContentRepository {
  return {
    findById: jest.fn(async () => resumeContent),
    findLatestByJobDescriptionId: jest.fn(async () => resumeContent),
    save: jest.fn(async () => {}),
    update: jest.fn(async () => {})
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumePdf', () => {
  function makeUseCase(resumeContent: ResumeContent | null = makeResumeContent()) {
    const fakePdf = new Uint8Array([1, 2, 3]);

    const fakeRenderer: ResumeRenderer = {
      render: jest.fn(async () => fakePdf)
    };

    const fakeFactory: ResumeRendererFactory = {
      get: jest.fn(() => fakeRenderer)
    };

    const jd = makeJd();
    const profile = makeProfile();
    const experience = makeExperience();
    const education = makeEducation();

    const profileRepo: ProfileRepository = {
      findByIdOrFail: jest.fn(async () => profile)
    } as unknown as ProfileRepository;
    const experienceRepo: ExperienceRepository = {
      findAll: jest.fn(async () => [experience])
    } as unknown as ExperienceRepository;
    const educationRepo: EducationRepository = {
      findAll: jest.fn(async () => [education])
    } as unknown as EducationRepository;
    const jdRepo: JobDescriptionRepository = {
      findById: jest.fn(async () => jd),
      save: jest.fn(async () => {})
    } as unknown as JobDescriptionRepository;
    const resumeContentRepo = mockResumeContentRepo(resumeContent);

    const useCase = new GenerateResumePdf(
      profileRepo,
      experienceRepo,
      educationRepo,
      jdRepo,
      resumeContentRepo,
      fakeFactory
    );

    return { useCase, fakeFactory, fakeRenderer, jdRepo, jd };
  }

  test('calls factory.get with the provided theme', async () => {
    const { useCase, fakeFactory } = makeUseCase();
    await useCase.execute({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001',
      theme: 'imprecv'
    });
    expect(fakeFactory.get).toHaveBeenCalledWith('imprecv');
  });

  test('uses brilliant-cv when theme is omitted', async () => {
    const { useCase, fakeFactory } = makeUseCase();
    await useCase.execute({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001'
    });
    expect(fakeFactory.get).toHaveBeenCalledWith('brilliant-cv');
  });

  test('passes stored headline as headlineSummary to renderer', async () => {
    const { useCase, fakeRenderer } = makeUseCase();
    await useCase.execute({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001'
    });
    const renderInput = (fakeRenderer.render as jest.Mock).mock.calls[0][0] as {
      headlineSummary: string;
    };
    expect(renderInput.headlineSummary).toBe('Staff Engineer | 5+ Years of Experience');
  });

  test('caches PDF bytes and theme on the job description', async () => {
    const { useCase, jd, jdRepo } = makeUseCase();
    await useCase.execute({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001'
    });
    expect(jd.resumePdf).toEqual(new Uint8Array([1, 2, 3]));
    expect(jd.resumePdfTheme).toBe('brilliant-cv');
    expect((jdRepo.save as jest.Mock).mock.calls).toHaveLength(1);
  });

  test('caches the requested theme', async () => {
    const { useCase, jd } = makeUseCase();
    await useCase.execute({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001',
      theme: 'modern-cv'
    });
    expect(jd.resumePdfTheme).toBe('modern-cv');
  });

  test('throws EntityNotFoundError when JD does not exist', async () => {
    const profile = makeProfile();
    const profileRepo: ProfileRepository = {
      findByIdOrFail: jest.fn(async () => profile)
    } as unknown as ProfileRepository;
    const experienceRepo: ExperienceRepository = {
      findAll: jest.fn(async () => [])
    } as unknown as ExperienceRepository;
    const educationRepo: EducationRepository = { findAll: jest.fn(async () => []) } as unknown as EducationRepository;
    const jdRepo: JobDescriptionRepository = {
      findById: jest.fn(async () => null),
      save: jest.fn(async () => {})
    } as unknown as JobDescriptionRepository;
    const resumeContentRepo = mockResumeContentRepo(null);

    const fakeRenderer: ResumeRenderer = {
      render: jest.fn(async () => new Uint8Array([1, 2, 3]))
    };

    const fakeFactory: ResumeRendererFactory = {
      get: jest.fn(() => fakeRenderer)
    };

    const useCase = new GenerateResumePdf(
      profileRepo,
      experienceRepo,
      educationRepo,
      jdRepo,
      resumeContentRepo,
      fakeFactory
    );
    await expect(useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'nonexistent' })).rejects.toThrow(
      EntityNotFoundError
    );
  });

  test('throws when resume content has not been generated', async () => {
    const { useCase } = makeUseCase(null);
    await expect(
      useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' })
    ).rejects.toThrow('Resume content has not been generated yet');
  });

  test('filters out hidden bullets by index', async () => {
    const rc = makeResumeContent([
      {
        experienceId: 'exp-00000000-0000-0000-0000-000000000001',
        summary: 'Built things',
        bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3'],
        hiddenBulletIndices: [1]
      }
    ]);
    const { useCase, fakeRenderer } = makeUseCase(rc);
    await useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' });

    const renderInput = (fakeRenderer.render as jest.Mock).mock.calls[0][0] as {
      experiences: Array<{ bullets: string[] }>;
    };
    expect(renderInput.experiences[0].bullets).toEqual(['Bullet 1', 'Bullet 3']);
  });

  test('shows all bullets when no indices are hidden', async () => {
    const rc = makeResumeContent([
      {
        experienceId: 'exp-00000000-0000-0000-0000-000000000001',
        summary: 'Built things',
        bullets: ['Bullet 1', 'Bullet 2', 'Bullet 3'],
        hiddenBulletIndices: []
      }
    ]);
    const { useCase, fakeRenderer } = makeUseCase(rc);
    await useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' });

    const renderInput = (fakeRenderer.render as jest.Mock).mock.calls[0][0] as {
      experiences: Array<{ bullets: string[] }>;
    };
    expect(renderInput.experiences[0].bullets).toEqual(['Bullet 1', 'Bullet 2', 'Bullet 3']);
  });

  test('filters out hidden educations', async () => {
    const rc = makeResumeContent(DEFAULT_EXPERIENCES, 'Staff Engineer | 5+ Years of Experience', [
      'edu-00000000-0000-0000-0000-000000000001'
    ]);
    const { useCase, fakeRenderer } = makeUseCase(rc);
    await useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' });

    const renderInput = (fakeRenderer.render as jest.Mock).mock.calls[0][0] as {
      educations: Array<{ degreeTitle: string }>;
    };
    expect(renderInput.educations).toEqual([]);
  });
});
