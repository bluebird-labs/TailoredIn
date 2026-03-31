import { inject, injectable } from '@needle-di/core';

export const OPENAI_CONFIG = 'OpenAiConfig';
export type OpenAiConfig = { apiKey: string; project: string };

import type {
  ApplicationInsightsDto,
  CompanyBriefSectionsDto,
  ExtractApplicationInsightsInput,
  ExtractJobPostingInsightsInput,
  JobPostingInsightsDto,
  LlmGenerateCompanyBriefInput,
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

const CompanyBriefSchema = z.strictObject({
  productOverview: z
    .string()
    .describe('2-3 paragraph overview of what the company does, its products, and market position'),
  techStack: z.string().describe('Known or inferred technologies, languages, frameworks, and infrastructure'),
  culture: z.string().describe('Company culture, values, work style, and what they look for in candidates'),
  recentNews: z
    .string()
    .describe('Recent notable events: funding rounds, product launches, acquisitions, leadership changes'),
  keyPeople: z.string().describe('Key leadership: CEO, CTO, VP Eng, and other relevant executives with brief context')
});

const ApplicationInsightsSchema = z.strictObject({
  keywords: z.array(z.nativeEnum(SkillName)).describe('Matching keywords from the skills list'),
  core: z.array(z.string()).describe('Most important skills from description not in resume')
});

@injectable()
export class OpenAiLlmService implements LlmService {
  private readonly client: OpenAI;

  public constructor(config = inject(OPENAI_CONFIG) as OpenAiConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, project: config.project });
  }

  public async extractJobPostingInsights(input: ExtractJobPostingInsightsInput): Promise<JobPostingInsightsDto> {
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

  public async extractApplicationInsights(input: ExtractApplicationInsightsInput): Promise<ApplicationInsightsDto> {
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

  public async generateCompanyBrief(input: LlmGenerateCompanyBriefInput): Promise<CompanyBriefSectionsDto> {
    const context = [
      `Company: ${input.companyName}`,
      input.companyWebsite ? `Website: ${input.companyWebsite}` : null,
      `Job title: ${input.jobTitle}`,
      `Job description:\n${input.jobDescription}`
    ]
      .filter(Boolean)
      .join('\n');

    const completion = await this.client.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a career coach helping a software engineer prepare for a job interview. ' +
            'Generate a comprehensive company brief based on the provided information. ' +
            'Use your knowledge about the company to fill in details beyond what the job description provides. ' +
            'For sections where you have limited information, be honest about what is inferred vs confirmed. ' +
            'Write in a clear, professional style with bullet points where appropriate.'
        },
        { role: 'user', content: context }
      ],
      response_format: zodResponseFormat(CompanyBriefSchema, 'company_brief')
    });

    const parsed = completion.choices[0].message.parsed;
    if (!parsed) throw new Error('Failed to parse company brief response');
    return parsed;
  }
}
