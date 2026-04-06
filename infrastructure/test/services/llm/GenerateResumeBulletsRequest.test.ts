import { describe, expect, test } from 'bun:test';
import type { ResumeContentGeneratorInput } from '@tailoredin/application';
import { GenerateResumeBulletsRequest } from '../../../src/services/llm/GenerateResumeBulletsRequest.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<ResumeContentGeneratorInput> = {}): ResumeContentGeneratorInput {
  return {
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      about: 'Pragmatic engineer focused on shipping value'
    },
    headline: {
      summaryText: 'Full-stack engineer with 8 years of experience'
    },
    jobDescription: {
      title: 'Senior Software Engineer',
      description: 'Build scalable systems at high-growth startup',
      rawText: 'Senior Software Engineer — full raw text of the JD'
    },
    experiences: [
      {
        id: 'exp-aaa-111',
        title: 'Staff Engineer',
        companyName: 'TechCorp',
        summary: 'Led platform engineering initiatives',
        accomplishments: [
          { title: 'Reduced deploy time by 60%', narrative: 'Introduced GitHub Actions pipelines' },
          { title: 'Mentored 4 junior engineers', narrative: null }
        ],
        minBullets: 2,
        maxBullets: 12
      },
      {
        id: 'exp-bbb-222',
        title: 'Software Engineer',
        companyName: 'StartupCo',
        summary: null,
        accomplishments: [{ title: 'Launched payments feature', narrative: 'Integrated Stripe API' }],
        minBullets: 2,
        maxBullets: 10
      }
    ],
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumeBulletsRequest', () => {
  describe('schema validation', () => {
    test('validates correct structure with valid bullets', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const validPayload = {
        experiences: [
          {
            experienceId: 'exp-aaa-111',
            summary: 'Led platform engineering initiatives across distributed teams.',
            bullets: [
              'Reduced deployment time by 60% by introducing automated CI/CD pipelines with GitHub Actions and containerised builds',
              'Mentored four junior engineers through structured code reviews and weekly one-on-ones resulting in measurable skill growth'
            ]
          }
        ]
      };

      const result = request.schema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects bullets shorter than 80 characters', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const shortBullet = 'Too short bullet'; // < 80 chars
      const payload = {
        experiences: [
          {
            experienceId: 'exp-aaa-111',
            bullets: [shortBullet]
          }
        ]
      };

      const result = request.schema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    test('rejects bullets longer than 350 characters', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const longBullet = 'A'.repeat(351);
      const payload = {
        experiences: [
          {
            experienceId: 'exp-aaa-111',
            bullets: [longBullet]
          }
        ]
      };

      const result = request.schema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    test('accepts bullets at the boundary lengths (80 and 350 chars)', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const exactMin = 'A'.repeat(80);
      const exactMax = 'A'.repeat(350);
      const payload = {
        experiences: [
          {
            experienceId: 'exp-aaa-111',
            summary: 'Summary text that is between 20 and 300 characters long for this test.',
            bullets: [exactMin, exactMax]
          }
        ]
      };

      const result = request.schema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    test('rejects payload missing required experienceId field', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const payload = {
        experiences: [
          {
            // missing experienceId
            bullets: ['A'.repeat(100)]
          }
        ]
      };

      const result = request.schema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    test('rejects payload missing required bullets field', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const payload = {
        experiences: [
          {
            experienceId: 'exp-aaa-111'
            // missing bullets
          }
        ]
      };

      const result = request.schema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('prompt content', () => {
    test('contains firstName and lastName', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Jane');
      expect(prompt).toContain('Smith');
    });

    test('contains about section', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Pragmatic engineer focused on shipping value');
    });

    test('contains headlineSummary', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Full-stack engineer with 8 years of experience');
    });

    test('contains JD title and description', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Senior Software Engineer');
      expect(prompt).toContain('Build scalable systems at high-growth startup');
    });

    test('contains experience IDs, titles, and company names', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('exp-aaa-111');
      expect(prompt).toContain('Staff Engineer');
      expect(prompt).toContain('TechCorp');
      expect(prompt).toContain('exp-bbb-222');
      expect(prompt).toContain('Software Engineer');
      expect(prompt).toContain('StartupCo');
    });

    test('contains min/max bullet count instructions per experience', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Generate between 2 and 12 bullets');
      expect(prompt).toContain('Generate between 2 and 10 bullets');
    });

    test('contains strict derivation / do not invent rules', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      // Rules from the prompt template
      expect(prompt).toContain('Do NOT invent');
      expect(prompt).toContain('Strict derivation');
    });

    test('includes null headline as (not provided) placeholder', () => {
      const request = new GenerateResumeBulletsRequest(makeInput({ headline: null }));
      const prompt = request.prompt;

      expect(prompt).toContain('(not provided)');
    });

    test('includes null about as (not provided) placeholder', () => {
      const request = new GenerateResumeBulletsRequest(
        makeInput({ profile: { firstName: 'Jane', lastName: 'Smith', about: null } })
      );
      const prompt = request.prompt;

      expect(prompt).toContain('(not provided)');
    });

    test('includes raw JD text when provided', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Senior Software Engineer — full raw text of the JD');
    });

    test('omits raw JD section when rawText is null', () => {
      const input = makeInput();
      input.jobDescription = { ...input.jobDescription, rawText: null };
      const request = new GenerateResumeBulletsRequest(input);
      const prompt = request.prompt;

      // The raw text section should be empty (replaced with empty string)
      expect(prompt).not.toContain('Raw Text:');
    });

    test('includes accomplishment narratives in the prompt', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Reduced deploy time by 60%');
      expect(prompt).toContain('Introduced GitHub Actions pipelines');
      expect(prompt).toContain('Launched payments feature');
      expect(prompt).toContain('Integrated Stripe API');
    });

    test('includes experience summary when present', () => {
      const request = new GenerateResumeBulletsRequest(makeInput());
      const prompt = request.prompt;

      expect(prompt).toContain('Led platform engineering initiatives');
    });
  });
});
