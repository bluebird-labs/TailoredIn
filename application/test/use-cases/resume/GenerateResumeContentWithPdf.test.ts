import type { ResumeContentDto } from '../../../src/dtos/ResumeContentDto.js';
import type { GenerateResumeContent } from '../../../src/use-cases/resume/GenerateResumeContent.js';
import { GenerateResumeContentWithPdf } from '../../../src/use-cases/resume/GenerateResumeContentWithPdf.js';
import type { GenerateResumePdf } from '../../../src/use-cases/resume/GenerateResumePdf.js';

function makeContentResult(): ResumeContentDto {
  return {
    headline: 'Staff Engineer | 5+ Years',
    experiences: [{ experienceId: 'exp-1', experienceTitle: 'Engineer', companyName: 'Acme', bullets: ['Did things'] }]
  };
}

describe('GenerateResumeContentWithPdf', () => {
  test('calls generateContent then generatePdf and returns content', async () => {
    const contentResult = makeContentResult();
    const generateContent = { execute: jest.fn(async () => contentResult) } as unknown as GenerateResumeContent;
    const generatePdf = { execute: jest.fn(async () => new Uint8Array([1, 2, 3])) } as unknown as GenerateResumePdf;

    const useCase = new GenerateResumeContentWithPdf(generateContent, generatePdf);
    const result = await useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-1' });

    expect(result).toEqual(contentResult);
    expect(generateContent.execute).toHaveBeenCalledWith({ profileId: 'profile-1', jobDescriptionId: 'jd-1' });
    expect(generatePdf.execute).toHaveBeenCalledWith({ profileId: 'profile-1', jobDescriptionId: 'jd-1' });
  });

  test('returns content even if PDF generation fails', async () => {
    const contentResult = makeContentResult();
    const generateContent = { execute: jest.fn(async () => contentResult) } as unknown as GenerateResumeContent;
    const generatePdf = {
      execute: jest.fn(async () => {
        throw new Error('Typst crashed');
      })
    } as unknown as GenerateResumePdf;

    const useCase = new GenerateResumeContentWithPdf(generateContent, generatePdf);
    const result = await useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-1' });

    expect(result).toEqual(contentResult);
  });

  test('propagates content generation errors', async () => {
    const generateContent = {
      execute: jest.fn(async () => {
        throw new Error('LLM timeout');
      })
    } as unknown as GenerateResumeContent;
    const generatePdf = { execute: jest.fn(async () => new Uint8Array()) } as unknown as GenerateResumePdf;

    const useCase = new GenerateResumeContentWithPdf(generateContent, generatePdf);
    await expect(useCase.execute({ profileId: 'profile-1', jobDescriptionId: 'jd-1' })).rejects.toThrow('LLM timeout');
    expect(generatePdf.execute).not.toHaveBeenCalled();
  });

  test('passes input through to content generation', async () => {
    const contentResult = makeContentResult();
    const generateContent = { execute: jest.fn(async () => contentResult) } as unknown as GenerateResumeContent;
    const generatePdf = { execute: jest.fn(async () => new Uint8Array()) } as unknown as GenerateResumePdf;

    const useCase = new GenerateResumeContentWithPdf(generateContent, generatePdf);
    await useCase.execute({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-1',
      additionalPrompt: 'Focus on leadership',
      scope: { type: 'headline' }
    });

    expect(generateContent.execute).toHaveBeenCalledWith({
      profileId: 'profile-1',
      jobDescriptionId: 'jd-1',
      additionalPrompt: 'Focus on leadership',
      scope: { type: 'headline' }
    });
  });
});
