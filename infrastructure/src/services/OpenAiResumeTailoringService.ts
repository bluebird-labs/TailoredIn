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
    generatedExperiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          experienceId: { type: 'string' },
          bulletTexts: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }
        },
        required: ['experienceId', 'bulletTexts'],
        additionalProperties: false
      }
    },
    rankedSkillIds: { type: 'array', items: { type: 'string' } },
    assessment: { type: 'string' }
  },
  required: ['headlineOptions', 'rankedExperiences', 'generatedExperiences', 'rankedSkillIds', 'assessment'],
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
            "You are a professional resume tailoring assistant. You will receive a job description and a candidate's full resume chest — a rich collection of all their experiences with verbose bullet descriptions and narratives. Your task is to:\n1. Write targeted, concise bullet points (1–2 sentences each, starting with an action verb) for each experience that directly address the job's requirements. Use the verbose descriptions and narratives as raw material — do not copy them verbatim.\n2. Also return ranked bullet IDs from the chest as a fallback reference.\n3. Suggest 1–3 headline options tailored to the role.\n4. Rank relevant skill IDs.\n5. Provide a brief assessment of the candidate's fit."
        },
        {
          role: 'user',
          content: `## Job Description\n\n${jdContent}\n\n## Resume Chest (all experiences + verbose descriptions)\n\n${rawMarkdown}`
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
      generatedExperiences: Array<{ experienceId: string; bulletTexts: string[] }>;
      rankedSkillIds: string[];
      assessment: string;
    };

    return new LlmProposal({
      headlineOptions: parsed.headlineOptions,
      rankedExperiences: parsed.rankedExperiences,
      generatedExperiences: parsed.generatedExperiences,
      rankedSkillIds: parsed.rankedSkillIds,
      assessment: parsed.assessment
    });
  }
}
