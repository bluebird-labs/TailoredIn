import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Anthropic from '@anthropic-ai/sdk';
import type { ResumeContentGeneratorInput } from '@tailoredin/application';
import { z } from 'zod';
import { LlmJsonRequest } from './LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, '../prompts/generate-resume-bullets.md');

const regenerateExperienceSchema = z.object({
  experiences: z
    .array(
      z.object({
        experienceId: z.string(),
        summary: z.string().min(20).max(300),
        bullets: z.array(z.string().min(80).max(160))
      })
    )
    .length(1)
});

export class RegenerateExperienceRequest extends LlmJsonRequest<typeof regenerateExperienceSchema> {
  public readonly schema = regenerateExperienceSchema;
  private readonly requestModel: Anthropic.Messages.Model;

  public get model(): Anthropic.Messages.Model {
    return this.requestModel;
  }

  public constructor(
    private readonly input: ResumeContentGeneratorInput,
    private readonly experienceId: string,
    model: Anthropic.Messages.Model = 'claude-opus-4-6'
  ) {
    super();
    this.requestModel = model;
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
      .replace('{{jdTitle}}', this.input.jobDescription.title)
      .replace('{{jdDescription}}', this.input.jobDescription.description)
      .replace('{{jdRawText}}', jdRawTextSection)
      .replace('{{experiencesBlock}}', experiencesBlock);

    prompt += `\n\nIMPORTANT: Only regenerate the experience with ID "${this.experienceId}". Return exactly one experience entry in your response. Do NOT include a headline.`;

    const previousExperience = this.input.previousContent?.experiences?.find(e => e.experienceId === this.experienceId);
    if (previousExperience) {
      const bulletList = previousExperience.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
      prompt += `\n\nThe current bullets for this experience are:\n${bulletList}`;
      if (this.input.additionalPrompt) {
        prompt +=
          '\n\nThe user provided specific instructions below. Follow them precisely — if they ask to change a specific bullet, keep the others as-is. Only modify what is requested.';
      } else {
        prompt +=
          '\n\nNo specific instructions were given, so produce a meaningfully different version. Vary phrasing, emphasis, and which accomplishments to highlight.';
      }
    }

    if (this.input.composedPrompt) {
      prompt += `\n\n${this.input.composedPrompt}`;
    }

    if (this.input.additionalPrompt) {
      prompt += `\n\nAdditional instructions: ${this.input.additionalPrompt}`;
    }

    return prompt;
  }
}
