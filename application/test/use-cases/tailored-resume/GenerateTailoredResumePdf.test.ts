import { describe, expect, test } from 'bun:test';
import { ContentSelection, LlmProposal, TailoredResume, TailoredResumeId } from '@tailoredin/domain';
import type { ResumeContentDto } from '../../../src/dtos/ResumeContentDto.js';
import type { ResumeContentFactory } from '../../../src/ports/ResumeContentFactory.js';
import type { ResumeRenderer } from '../../../src/ports/ResumeRenderer.js';
import type { TailoredResumeRepository } from '../../../src/ports/TailoredResumeRepository.js';
import { GenerateTailoredResumePdf } from '../../../src/use-cases/tailored-resume/GenerateTailoredResumePdf.js';

const EMPTY_CONTENT: ResumeContentDto = {
  personal: {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    header_quote: ''
  },
  keywords: [],
  experience: [],
  education: [],
  skills: []
};

const NOW = new Date('2025-01-01');

function makeDraftResume(id = 'resume-abc'): TailoredResume {
  return new TailoredResume({
    id: new TailoredResumeId(id),
    profileId: 'profile-1',
    jdContent: 'Looking for an engineer',
    llmProposals: LlmProposal.empty(),
    contentSelection: ContentSelection.empty(),
    headlineText: 'Senior Engineer',
    status: 'draft',
    pdfPath: null,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockResumeRepo(resume: TailoredResume | null, onSave?: (r: TailoredResume) => void): TailoredResumeRepository {
  return {
    findById: async () => resume,
    findByProfileId: async () => (resume ? [resume] : []),
    save: async (r: TailoredResume) => {
      onSave?.(r);
    }
  };
}

function mockContentFactory(): ResumeContentFactory {
  return {
    make: async () => EMPTY_CONTENT,
    makeFromSelection: async () => EMPTY_CONTENT
  };
}

function mockRenderer(renderedPath: string): ResumeRenderer {
  return {
    render: async () => renderedPath
  };
}

describe('GenerateTailoredResumePdf', () => {
  test('calls finalize() with the renderer-returned path and saves the aggregate', async () => {
    const resume = makeDraftResume('resume-123');
    let saved: TailoredResume | undefined;

    const useCase = new GenerateTailoredResumePdf(
      mockResumeRepo(resume, r => {
        saved = r;
      }),
      mockContentFactory(),
      mockRenderer('/output/resume-123.pdf')
    );

    const result = await useCase.execute({ resumeId: 'resume-123' });

    expect(result.pdfPath).toBe('/output/resume-123.pdf');
    expect(saved).toBeDefined();
    expect(saved!.pdfPath).toBe('/output/resume-123.pdf');
    expect(saved!.status).toBe('finalized');
  });

  test('returns the pdfPath from the renderer, not a caller-supplied path', async () => {
    const resume = makeDraftResume('resume-456');

    const useCase = new GenerateTailoredResumePdf(
      mockResumeRepo(resume),
      mockContentFactory(),
      mockRenderer('/some/renderer/decided/path.pdf')
    );

    const result = await useCase.execute({ resumeId: 'resume-456' });

    expect(result.pdfPath).toBe('/some/renderer/decided/path.pdf');
    expect(resume.pdfPath).toBe('/some/renderer/decided/path.pdf');
  });

  test('throws when resume is not found', async () => {
    const useCase = new GenerateTailoredResumePdf(
      mockResumeRepo(null),
      mockContentFactory(),
      mockRenderer('/irrelevant.pdf')
    );

    expect(useCase.execute({ resumeId: 'missing' })).rejects.toThrow('TailoredResume not found: missing');
  });
});
