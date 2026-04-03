import { inject, injectable } from '@needle-di/core';
import type { ResumeTailoringService } from '@tailoredin/application';
import { LlmProposal } from '@tailoredin/domain';
import OpenAI from 'openai';
import { OPENAI_CONFIG, type OpenAiConfig } from './OpenAiLlmService.js';

const TAILOR_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headlineOptions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
    selectedExperiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          experienceId: { type: 'string' },
          selectedAccomplishmentIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['experienceId', 'selectedAccomplishmentIds'],
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
  required: ['headlineOptions', 'selectedExperiences', 'generatedExperiences', 'rankedSkillIds', 'assessment'],
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
            "You are a professional resume tailoring assistant. You receive a job description and a candidate's resume wardrobe — a collection of experiences, each with accomplishment narratives written in the candidate's own words.\n\nYour task:\n1. Select the most relevant accomplishments for each experience (return their IDs in selectedAccomplishmentIds).\n2. For each experience, write 2–4 concise resume bullet points (starting with an action verb) that directly address the job requirements. Draw from the selected accomplishment narratives — do not copy verbatim, synthesize and quantify.\n3. Suggest 1–3 headline options tailored to the role.\n4. Rank relevant skill IDs.\n5. Provide a brief fit assessment."
        },
        {
          role: 'user',
          content: `## Job Description\n\n${jdContent}\n\n## Resume Wardrobe\n\n${rawMarkdown}`
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
      selectedExperiences: Array<{ experienceId: string; selectedAccomplishmentIds: string[] }>;
      generatedExperiences: Array<{ experienceId: string; bulletTexts: string[] }>;
      rankedSkillIds: string[];
      assessment: string;
    };

    return new LlmProposal({
      headlineOptions: parsed.headlineOptions,
      selectedExperiences: parsed.selectedExperiences,
      generatedExperiences: parsed.generatedExperiences,
      rankedSkillIds: parsed.rankedSkillIds,
      assessment: parsed.assessment
    });
  }
}
