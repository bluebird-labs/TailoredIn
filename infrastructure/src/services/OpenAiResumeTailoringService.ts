import { inject, injectable } from '@needle-di/core';
import type { ResumeTailoringService } from '@tailoredin/application';
import { LlmProposal } from '@tailoredin/domain';
import OpenAI from 'openai';
import { OPENAI_CONFIG, type OpenAiConfig } from './OpenAiLlmService.js';

const TAILOR_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headlineOptions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
    rankedExperiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          experienceId: { type: 'string' },
          rankedBulletIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['experienceId', 'rankedBulletIds'],
        additionalProperties: false
      }
    },
    rankedSkillIds: { type: 'array', items: { type: 'string' } },
    assessment: { type: 'string' }
  },
  required: ['headlineOptions', 'rankedExperiences', 'rankedSkillIds', 'assessment'],
  additionalProperties: false
} as const;

@injectable()
export class OpenAiResumeTailoringService implements ResumeTailoringService {
  private readonly client: OpenAI;

  public constructor(config = inject(OPENAI_CONFIG) as OpenAiConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, project: config.project });
  }

  public async tailorFromJd(jdContent: string, rawMarkdown: string): Promise<LlmProposal> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You are a professional resume tailoring assistant. Analyze the job description and the candidate's raw resume, then provide structured tailoring recommendations to maximize the candidate's fit for the role."
        },
        {
          role: 'user',
          content: `## Job Description\n\n${jdContent}\n\n## Raw Resume\n\n${rawMarkdown}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'resume_tailoring',
          strict: true,
          schema: TAILOR_JSON_SCHEMA
        }
      }
    });

    const raw = completion.choices[0].message.content;
    if (!raw) throw new Error('Empty response from OpenAI resume tailoring');

    const parsed = JSON.parse(raw) as {
      headlineOptions: string[];
      rankedExperiences: Array<{ experienceId: string; rankedBulletIds: string[] }>;
      rankedSkillIds: string[];
      assessment: string;
    };

    return new LlmProposal({
      headlineOptions: parsed.headlineOptions,
      rankedExperiences: parsed.rankedExperiences,
      rankedSkillIds: parsed.rankedSkillIds,
      assessment: parsed.assessment
    });
  }
}
