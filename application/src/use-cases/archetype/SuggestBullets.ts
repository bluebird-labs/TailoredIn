import type { ExperienceRepository } from '@tailoredin/domain';
import { err, ok, type Result } from '@tailoredin/domain';
import { z } from 'zod';
import type { LlmProviderKey, StructuredLlmClient } from '../../ports/StructuredLlmClient.js';

export type SuggestBulletsInput = {
  jobDescription: string;
  provider: LlmProviderKey;
};

export type BulletSuggestion = {
  bulletId: string;
  score: number;
  reasoning: string;
};

export type SuggestBulletsOutput = {
  suggestions: BulletSuggestion[];
  summary: string;
};

const inputSchema = z.object({
  jobDescription: z.string(),
  bullets: z.array(
    z.object({
      bulletId: z.string(),
      experienceId: z.string(),
      company: z.string(),
      title: z.string(),
      content: z.string(),
      roleTags: z.array(z.string()),
      skillTags: z.array(z.string())
    })
  )
});

const outputSchema = z.object({
  suggestions: z.array(
    z.object({
      bulletId: z.string(),
      score: z.number(),
      reasoning: z.string()
    })
  ),
  summary: z.string()
});

const PROMPT = `You are a resume optimization expert. Given a job description and a list of resume bullet points, score each bullet for relevance to the job.

For each bullet, assign a score from 0 to 100:
- 80-100: Directly relevant — mentions skills, technologies, or achievements the job requires
- 60-79: Moderately relevant — transferable skills or adjacent domain experience
- 40-59: Somewhat relevant — general professional value but weak connection to this role
- 0-39: Low relevance — doesn't align with the job requirements

Consider:
1. Keyword and skill alignment with the job description
2. Domain relevance (e.g. fintech bullet for a fintech role)
3. Impact and specificity of the achievement
4. Seniority alignment (leadership bullets for leadership roles)

Return a score and one-sentence reasoning for EVERY bullet provided. Also include a brief summary of your overall matching strategy.`;

export class SuggestBullets {
  public constructor(
    private readonly experienceRepo: ExperienceRepository,
    private readonly llmClient: StructuredLlmClient
  ) {}

  public async execute(input: SuggestBulletsInput): Promise<Result<SuggestBulletsOutput, Error>> {
    const experiences = await this.experienceRepo.findAll();
    const allBullets = experiences.flatMap(exp =>
      exp.accomplishments.map(b => ({
        bulletId: b.id.value,
        experienceId: exp.id.value,
        company: exp.companyName,
        title: exp.title,
        content: b.narrative,
        roleTags: [] as string[],
        skillTags: b.skillTags,
      }))
    );

    if (allBullets.length === 0) {
      return err(new Error('No bullets found. Add experience bullets before requesting suggestions.'));
    }

    try {
      const result = await this.llmClient.generate({
        prompt: PROMPT,
        inputSchema,
        outputSchema,
        context: { jobDescription: input.jobDescription, bullets: allBullets },
        provider: input.provider
      });
      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
