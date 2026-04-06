import { describe, expect, mock, test } from 'bun:test';
import {
  type EducationRepository,
  EntityNotFoundError,
  Experience,
  ExperienceId,
  type ExperienceRepository,
  JobDescription,
  JobDescriptionId,
  type JobDescriptionRepository,
  JobSource,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeContentGenerator } from '../../../src/ports/ResumeContentGenerator.js';
import type { ResumeRenderer } from '../../../src/ports/ResumeRenderer.js';
import type { ResumeRendererFactory } from '../../../src/ports/ResumeRendererFactory.js';
import { GenerateResumePdf } from '../../../src/use-cases/resume/GenerateResumePdf.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile() {
  return {
    id: { value: 'profile-1' },
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
  return new JobDescription({
    id: new JobDescriptionId('jd-00000000-0000-0000-0000-000000000001'),
    companyId: 'company-1',
    title: 'Staff Engineer',
    description: 'Build things',
    rawText: null,
    url: null,
    location: null,
    salaryRange: null,
    level: null,
    locationType: null,
    source: JobSource.UPLOAD,
    postedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeExperience() {
  return new Experience({
    id: new ExperienceId('exp-00000000-0000-0000-0000-000000000001'),
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme',
    companyWebsite: null,
    companyId: null,
    location: 'NY',
    startDate: '2022-01',
    endDate: null,
    summary: null,
    ordinal: 0,
    accomplishments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

function makeEducation() {
  return {
    id: { value: 'edu-00000000-0000-0000-0000-000000000001' },
    profileId: 'profile-1',
    degreeTitle: 'BSc CS',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: null
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumePdf', () => {
  function makeUseCase() {
    const fakePdf = new Uint8Array([1, 2, 3]);

    const fakeRenderer: ResumeRenderer = {
      render: mock(async () => fakePdf)
    };

    const fakeFactory: ResumeRendererFactory = {
      get: mock(() => fakeRenderer)
    };

    const fakeGenerator: ResumeContentGenerator = {
      generate: mock(async () => ({
        headline: 'Staff Engineer | 5+ Years of Experience',
        experiences: [{ experienceId: 'exp-00000000-0000-0000-0000-000000000001', summary: null, bullets: ['Bullet'] }]
      }))
    };

    const jd = makeJd();
    const profile = makeProfile();
    const experience = makeExperience();
    const education = makeEducation();

    const profileRepo: ProfileRepository = { findSingle: mock(async () => profile) } as unknown as ProfileRepository;
    const experienceRepo: ExperienceRepository = {
      findAll: mock(async () => [experience])
    } as unknown as ExperienceRepository;
    const educationRepo: EducationRepository = {
      findAll: mock(async () => [education])
    } as unknown as EducationRepository;
    const jdRepo: JobDescriptionRepository = { findById: mock(async () => jd) } as unknown as JobDescriptionRepository;

    const useCase = new GenerateResumePdf(
      profileRepo,
      experienceRepo,
      educationRepo,
      jdRepo,
      fakeGenerator,
      fakeFactory
    );

    return { useCase, fakeFactory, fakeRenderer, fakeGenerator };
  }

  test('calls factory.get with the provided theme', async () => {
    const { useCase, fakeFactory } = makeUseCase();
    await useCase.execute({
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001',
      theme: 'imprecv'
    });
    expect(fakeFactory.get).toHaveBeenCalledWith('imprecv');
  });

  test('uses brilliant-cv when theme is omitted', async () => {
    const { useCase, fakeFactory } = makeUseCase();
    await useCase.execute({
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001'
    });
    expect(fakeFactory.get).toHaveBeenCalledWith('brilliant-cv');
  });

  test('passes LLM-generated headline as headlineSummary to renderer', async () => {
    const { useCase, fakeRenderer } = makeUseCase();
    await useCase.execute({
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001'
    });
    const renderInput = (fakeRenderer.render as ReturnType<typeof mock>).mock.calls[0][0] as {
      headlineSummary: string;
    };
    expect(renderInput.headlineSummary).toBe('Staff Engineer | 5+ Years of Experience');
  });

  test('throws EntityNotFoundError when JD does not exist', async () => {
    const profile = makeProfile();
    const profileRepo: ProfileRepository = { findSingle: mock(async () => profile) } as unknown as ProfileRepository;
    const experienceRepo: ExperienceRepository = { findAll: mock(async () => []) } as unknown as ExperienceRepository;
    const educationRepo: EducationRepository = { findAll: mock(async () => []) } as unknown as EducationRepository;
    const jdRepo: JobDescriptionRepository = {
      findById: mock(async () => null)
    } as unknown as JobDescriptionRepository;

    const fakeGenerator: ResumeContentGenerator = {
      generate: mock(async () => ({
        headline: 'Test Headline',
        experiences: [{ experienceId: 'exp-00000000-0000-0000-0000-000000000001', summary: null, bullets: ['Bullet'] }]
      }))
    };

    const fakeRenderer: ResumeRenderer = {
      render: mock(async () => new Uint8Array([1, 2, 3]))
    };

    const fakeFactory: ResumeRendererFactory = {
      get: mock(() => fakeRenderer)
    };

    const useCase = new GenerateResumePdf(
      profileRepo,
      experienceRepo,
      educationRepo,
      jdRepo,
      fakeGenerator,
      fakeFactory
    );
    await expect(useCase.execute({ jobDescriptionId: 'nonexistent' })).rejects.toThrow(EntityNotFoundError);
  });
});
