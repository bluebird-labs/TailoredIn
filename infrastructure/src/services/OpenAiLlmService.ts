import { inject, injectable } from '@needle-di/core';

export const OPENAI_CONFIG = 'OpenAiConfig';
export type OpenAiConfig = { apiKey: string; project: string };

import type {
  ApplicationInsightsDto,
  ExtractApplicationInsightsInput,
  ExtractJobPostingInsightsInput,
  JobPostingInsightsDto,
  LlmService
} from '@tailoredin/application';
import { Archetype, SkillName } from '@tailoredin/domain';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const archetypeDetails: Record<Archetype, string> = {
  [Archetype.HAND_ON_MANAGER]:
    'An engineering manager who is expected to be hands-on and spend a significant part of their time coding',
  [Archetype.LEADER_MANAGER]:
    'A senior engineering manager or director who focuses on managing teams rather than coding',
  [Archetype.IC]: 'An engineer who is not expected to manage individuals and spends their whole time coding',
  [Archetype.LEAD_IC]: 'An experienced engineer who demonstrates leadership and guides teams',
  [Archetype.NERD]: 'A highly technical engineer focused on deep, cutting-edge technical work or research'
};

const PostingInsightsSchema = z.strictObject({
  website: z.string().nullable().describe("The company's website or null if not confident"),
  archetype: z.nativeEnum(Archetype).describe('The closest matching position archetype')
});

const ApplicationInsightsSchema = z.strictObject({
  keywords: z.array(z.nativeEnum(SkillName)).describe('Matching keywords from the skills list'),
  core: z.array(z.string()).describe('Most important skills from description not in resume')
});

@injectable()
export class OpenAiLlmService implements LlmService {
  private readonly client: OpenAI;

  constructor(config = inject(OPENAI_CONFIG) as OpenAiConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, project: config.project });
  }

  async extractJobPostingInsights(input: ExtractJobPostingInsightsInput): Promise<JobPostingInsightsDto> {
    const description = `${input.companyName} is looking for a ${input.jobTitle} in ${input.jobLocation}\n${input.jobDescription}`;

    const completion = await this.client.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an experienced software engineer analyzing a job description.\n' +
            'Find: (1) the company website URL (null if unsure), (2) the position archetype.\n' +
            'Archetypes:\n' +
            Object.entries(archetypeDetails)
              .map(([k, v]) => `- ${k}: ${v}`)
              .join('\n')
        },
        { role: 'user', content: description }
      ],
      response_format: zodResponseFormat(PostingInsightsSchema, 'insights')
    });

    return completion.choices[0].message.parsed ?? { website: null, archetype: Archetype.IC };
  }

  async extractApplicationInsights(input: ExtractApplicationInsightsInput): Promise<ApplicationInsightsDto> {
    const description = `${input.companyName} is looking for a ${input.jobTitle} in ${input.jobLocation}\n${input.jobDescription}`;

    const completion = await this.client.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'developer',
          content:
            'You are an experienced software engineer tailoring your resume to a job description.\n' +
            'Find: (1) up to 20 skill keywords mentioned in BOTH the job description and your skills list, ' +
            '(2) up to 5 important skills from the description not shown in the resume.'
        },
        {
          role: 'user',
          content:
            `Job description:\n"${description}"\n` +
            `Resume (JSON):\n${JSON.stringify(input.resumeContent, null, 2)}\n` +
            `Skills list (JSON):\n${JSON.stringify(Object.values(SkillName), null, 2)}`
        }
      ],
      response_format: zodResponseFormat(ApplicationInsightsSchema, 'insights')
    });

    const parsed = completion.choices[0].message.parsed ?? { keywords: [], core: [] };
    return { keywords: parsed.keywords, coreSkills: parsed.core };
  }
}
