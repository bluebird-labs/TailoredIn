import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Anthropic from '@anthropic-ai/sdk';
import type { ResumeContentGeneratorInput } from '@tailoredin/application';
import { z } from 'zod';
import { LlmJsonRequest } from './LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, '../prompts/generate-resume-bullets.md');

const generateResumeBulletsSchema = z.object({
  headline: z.string().min(10).max(400),
  experiences: z.array(
    z.object({
      experienceId: z.string(),
      summary: z.string().min(20).max(300),
      bullets: z.array(z.string().min(80).max(160))
    })
  )
});

export class GenerateResumeBulletsRequest extends LlmJsonRequest<typeof generateResumeBulletsSchema> {
  public readonly schema = generateResumeBulletsSchema;
  private readonly requestModel: Anthropic.Messages.Model;

  public get model(): Anthropic.Messages.Model {
    return this.requestModel;
  }

  public constructor(
    private readonly input: ResumeContentGeneratorInput,
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

    if (this.input.previousContent) {
      const parts: string[] = [
        '\n\n## Previous Version',
        'The previous resume content is shown below. Produce a meaningfully different version — vary structure, emphasis, and phrasing throughout.'
      ];
      if (this.input.previousContent.headline) {
        parts.push(`\nPrevious headline: "${this.input.previousContent.headline}"`);
      }
      for (const exp of this.input.previousContent.experiences ?? []) {
        const matchingExp = this.input.experiences.find(e => e.id === exp.experienceId);
        const label = matchingExp ? `${matchingExp.title} at ${matchingExp.companyName}` : exp.experienceId;
        const bulletList = exp.bullets.map(b => `- ${b}`).join('\n');
        parts.push(`\nPrevious bullets for ${label}:\n${bulletList}`);
      }
      prompt += parts.join('\n');
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
