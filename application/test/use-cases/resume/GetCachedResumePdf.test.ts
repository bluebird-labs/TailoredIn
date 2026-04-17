import { JobDescription, type JobDescriptionRepository, JobSource } from '@tailoredin/domain';
import { GetCachedResumePdf } from '../../../src/use-cases/resume/GetCachedResumePdf.js';

function makeJd(pdf: Uint8Array | null, theme: string | null) {
  return new JobDescription({
    id: 'jd-00000000-0000-0000-0000-000000000001',
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
    resumeOutput: null,
    resumePdf: pdf,
    resumePdfTheme: theme,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

describe('GetCachedResumePdf', () => {
  test('returns pdf and theme when cached PDF exists', async () => {
    const pdfBytes = new Uint8Array([1, 2, 3, 4]);
    const jd = makeJd(pdfBytes, 'modern-cv');
    const repo: JobDescriptionRepository = {
      findById: jest.fn(async () => jd)
    } as unknown as JobDescriptionRepository;

    const useCase = new GetCachedResumePdf(repo);
    const result = await useCase.execute({ jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' });

    expect(result).not.toBeNull();
    expect(result!.pdf).toEqual(pdfBytes);
    expect(result!.theme).toBe('modern-cv');
  });

  test('returns null when no cached PDF exists', async () => {
    const jd = makeJd(null, null);
    const repo: JobDescriptionRepository = {
      findById: jest.fn(async () => jd)
    } as unknown as JobDescriptionRepository;

    const useCase = new GetCachedResumePdf(repo);
    const result = await useCase.execute({ jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' });

    expect(result).toBeNull();
  });

  test('returns null when JD does not exist', async () => {
    const repo: JobDescriptionRepository = {
      findById: jest.fn(async () => null)
    } as unknown as JobDescriptionRepository;

    const useCase = new GetCachedResumePdf(repo);
    const result = await useCase.execute({ jobDescriptionId: 'nonexistent' });

    expect(result).toBeNull();
  });

  test('defaults theme to brilliant-cv when theme is null', async () => {
    const pdfBytes = new Uint8Array([5, 6, 7]);
    const jd = makeJd(pdfBytes, null);
    const repo: JobDescriptionRepository = {
      findById: jest.fn(async () => jd)
    } as unknown as JobDescriptionRepository;

    const useCase = new GetCachedResumePdf(repo);
    const result = await useCase.execute({ jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001' });

    expect(result!.theme).toBe('brilliant-cv');
  });
});
