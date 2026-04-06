import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ResumeContentGeneratorInput } from '@tailoredin/application';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { LlmJsonRequest } from './LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, '../prompts/generate-resume-bullets.md');

const generateResumeBulletsSchema = z.object({
  experiences: z.array(
    z.object({
      experienceId: z.string(),
      summary: z.string().min(20).max(300),
      bullets: z.array(z.string().min(80).max(350))
    })
  )
});

export class GenerateResumeBulletsRequest extends LlmJsonRequest<typeof generateResumeBulletsSchema> {
  public readonly schema = generateResumeBulletsSchema;
  public get model(): Anthropic.Messages.Model {
    return 'claude-haiku-4-5-20251001';
  }

  public constructor(private readonly input: ResumeContentGeneratorInput) {
    super();
  }

  public get prompt(): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');

    const experiencesBlock = this.input.experiences
      .map(exp => {
        const lines: string[] = [];
        lines.push(`### Experience ID: ${exp.id}`);
        lines.push(`Role: ${exp.title} at ${exp.companyName}`);
        if (exp.summary) {
          lines.push(exp.summary);
        }
        lines.push('Accomplishments:');
        for (const acc of exp.accomplishments) {
          const narrative = acc.narrative ? `: ${acc.narrative}` : '';
          lines.push(`- ${acc.title}${narrative}`);
        }
        lines.push(`Generate between ${exp.minBullets} and ${exp.maxBullets} bullets for this experience.`);
        return lines.join('\n');
      })
      .join('\n\n');

    const jdRawTextSection = this.input.jobDescription.rawText ? `Raw Text:\n${this.input.jobDescription.rawText}` : '';

    let prompt = template
      .replace('{{firstName}}', this.input.profile.firstName)
      .replace('{{lastName}}', this.input.profile.lastName)
      .replace('{{about}}', this.input.profile.about ?? '(not provided)')
      .replace('{{headlineSummary}}', this.input.headline?.summaryText ?? '(not provided)')
      .replace('{{jdTitle}}', this.input.jobDescription.title)
      .replace('{{jdDescription}}', this.input.jobDescription.description)
      .replace('{{jdRawText}}', jdRawTextSection)
      .replace('{{experiencesBlock}}', experiencesBlock);

    if (this.input.additionalPrompt) {
      prompt += `\n\nAdditional instructions: ${this.input.additionalPrompt}`;
    }

    return prompt;
  }
}
