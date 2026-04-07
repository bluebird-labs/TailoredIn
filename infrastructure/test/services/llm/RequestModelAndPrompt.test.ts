import { describe, expect, test } from 'bun:test';
import type { ResumeContentGeneratorInput } from '@tailoredin/application';
import { GenerateResumeBulletsRequest } from '../../../src/services/llm/GenerateResumeBulletsRequest.js';
import { RegenerateExperienceRequest } from '../../../src/services/llm/RegenerateExperienceRequest.js';
import { RegenerateHeadlineRequest } from '../../../src/services/llm/RegenerateHeadlineRequest.js';

function makeInput(overrides: Partial<ResumeContentGeneratorInput> = {}): ResumeContentGeneratorInput {
  return {
    profile: { firstName: 'Jane', lastName: 'Smith', about: null },
    jobDescription: { title: 'Engineer', description: 'Build things', rawText: null },
    experiences: [
      {
        id: 'exp-1',
        title: 'Engineer',
        companyName: 'Acme',
        summary: null,
        accomplishments: [{ title: 'Shipped feature', narrative: null }],
        minBullets: 2,
        maxBullets: 5
      }
    ],
    ...overrides
  };
}

describe('Request model parameter', () => {
  test('GenerateResumeBulletsRequest defaults to claude-opus-4-6', () => {
    const request = new GenerateResumeBulletsRequest(makeInput());
    expect(request.model).toBe('claude-opus-4-6');
  });

  test('GenerateResumeBulletsRequest accepts custom model', () => {
    const request = new GenerateResumeBulletsRequest(makeInput(), 'claude-haiku-4-5');
    expect(request.model).toBe('claude-haiku-4-5');
  });

  test('RegenerateHeadlineRequest defaults to claude-opus-4-6', () => {
    const request = new RegenerateHeadlineRequest(makeInput());
    expect(request.model).toBe('claude-opus-4-6');
  });

  test('RegenerateHeadlineRequest accepts custom model', () => {
    const request = new RegenerateHeadlineRequest(makeInput(), 'claude-sonnet-4-6');
    expect(request.model).toBe('claude-sonnet-4-6');
  });

  test('RegenerateExperienceRequest defaults to claude-opus-4-6', () => {
    const request = new RegenerateExperienceRequest(makeInput(), 'exp-1');
    expect(request.model).toBe('claude-opus-4-6');
  });

  test('RegenerateExperienceRequest accepts custom model', () => {
    const request = new RegenerateExperienceRequest(makeInput(), 'exp-1', 'claude-haiku-4-5');
    expect(request.model).toBe('claude-haiku-4-5');
  });
});

describe('Request composedPrompt', () => {
  test('GenerateResumeBulletsRequest includes composedPrompt in prompt', () => {
    const request = new GenerateResumeBulletsRequest(
      makeInput({ composedPrompt: 'Always use active voice and past tense.' })
    );
    expect(request.prompt).toContain('Always use active voice and past tense.');
  });

  test('GenerateResumeBulletsRequest omits composedPrompt when not provided', () => {
    const request = new GenerateResumeBulletsRequest(makeInput());
    expect(request.prompt).not.toContain('Always use active voice');
  });

  test('RegenerateHeadlineRequest includes composedPrompt in prompt', () => {
    const request = new RegenerateHeadlineRequest(makeInput({ composedPrompt: 'Focus on leadership qualities.' }));
    expect(request.prompt).toContain('Focus on leadership qualities.');
  });

  test('RegenerateExperienceRequest includes composedPrompt in prompt', () => {
    const request = new RegenerateExperienceRequest(
      makeInput({ composedPrompt: 'Emphasize metrics and impact.' }),
      'exp-1'
    );
    expect(request.prompt).toContain('Emphasize metrics and impact.');
  });

  test('composedPrompt appears before additionalPrompt', () => {
    const request = new GenerateResumeBulletsRequest(
      makeInput({
        composedPrompt: 'COMPOSED_PROMPT_MARKER',
        additionalPrompt: 'ADDITIONAL_PROMPT_MARKER'
      })
    );
    const prompt = request.prompt;
    const composedIndex = prompt.indexOf('COMPOSED_PROMPT_MARKER');
    const additionalIndex = prompt.indexOf('ADDITIONAL_PROMPT_MARKER');
    expect(composedIndex).toBeGreaterThan(-1);
    expect(additionalIndex).toBeGreaterThan(-1);
    expect(composedIndex).toBeLessThan(additionalIndex);
  });
});
