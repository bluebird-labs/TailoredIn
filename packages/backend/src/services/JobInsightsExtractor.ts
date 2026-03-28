import OpenAI from 'openai';
import { JobDescriptionItemRole, JobDescriptionItemsExtractor } from './JobDescriptionItemsExtractor';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BrilliantCVContent } from '../../brilliant-cv/types';
import { Archetype } from '../resume-generator/data/types';
import { Job } from '../orm/entities/jobs/Job';
import { Company } from '../orm/entities/companies/Company';
import { inject, injectable } from 'inversify';
import { DI } from '../di/DI';
import { SkillName } from '../orm/entities/skills/SkillName';

export type ExtractJobApplicationInsightsInput = {
  job: Job;
  company: Company;
  resume: BrilliantCVContent;
};

export type ExtractJobPostingInsightsInput = {
  job: Job;
  company: Company;
};

const JobPostingInsightsExtractionSchema = z.strictObject({
  website: z.string().nullable().describe(`The company's website or null if not very confident`),
  archetype: z.nativeEnum(Archetype).describe(`The closest matching position archetype`)
});

const JobApplicationInsightsExtractionSchema = z.strictObject({
  keywords: z.array(z.nativeEnum(SkillName)).describe(`The list of matching keywords from your skills list`),
  core: z.array(z.string()).describe(`The list of of most core important skills from the description`)
});

export type JobPostingInsights = z.infer<typeof JobPostingInsightsExtractionSchema>;
export type JobApplicationInsights = z.infer<typeof JobApplicationInsightsExtractionSchema>;

const archetypeDetails: Record<Archetype, string> = {
  [Archetype.HAND_ON_MANAGER]:
    'An engineering manager who is expected to be hands-on and spend a significant part of their time coding, as opposed to a full time manager focusing only on management',
  [Archetype.LEADER_MANAGER]:
    'A possibly senior engineering manager or director or head of engineering who is expected to spend their time managing teams rather than coding',
  [Archetype.IC]:
    'An engineer or senior engineering who is not expected to manage individuals or projects and spend their whole time coding',
  [Archetype.LEAD_IC]:
    'An experienced engineer who is expected to demonstrate leadership, guide teams and participate in management'
};

@injectable()
export class JobInsightsExtractor {
  public constructor(@inject(DI.AiProvider) private readonly openAiClient: OpenAI) {}

  public async extractJobPostingInsights(input: ExtractJobPostingInsightsInput): Promise<JobPostingInsights> {
    const flatJobDescription = this.flattenJobDescription(input.job, input.company);
    const cachePrevent = Date.now().toString();

    const completion = await this.openAiClient.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            `You are an experienced software engineer searching for a job, you want to analyze the position requirements and learn about the company.\n` +
            `Equipped with a job description, you must find the following information:\n` +
            `- The url of the company's website. This needs to be very accurate, output null if not fully confident\n` +
            `- The position's archetype derived from the job description by assessing the balance between hands-on and leadership requirements\n`
        },
        {
          role: 'user',
          content: `${cachePrevent} Here is the job description:\n${flatJobDescription}`
        },
        {
          role: 'user',
          content:
            `Here are the possible archetypes:\n` +
            Object.entries(archetypeDetails).map(([archetype, details]) => {
              return `- ${archetype}: ${details}`;
            })
        }
      ],
      response_format: zodResponseFormat(JobPostingInsightsExtractionSchema, 'event')
    });

    return (
      completion.choices[0].message.parsed ?? {
        website: null,
        archetype: Archetype.IC
      }
    );
  }

  public async extractApplicationInsights(input: ExtractJobApplicationInsightsInput): Promise<JobApplicationInsights> {
    const flatJobDescription = this.flattenJobDescription(input.job, input.company);

    const completion = await this.openAiClient.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'developer',
          content:
            `You are an experienced software engineer searching for a job, you want to analyze the position requirements and fine tune your resume to match the job description.\n` +
            `Equipped with your resume, a job description and the list of technical skills that you excel at, you must find the following information:\n` +
            `- If any, a list of up to 20 technology keywords that are both mentioned in the job description and listed in your skills list. It is very important to not list a skill if it is not mentioned in the job description, in that case simply output less keywords\n` +
            '- If any, a list of up to 5 core skills or traits that are very important in the job description but are not demonstrated in your resume content'
        },
        {
          role: 'user',
          content:
            `Here is the job description:\n` +
            `"${flatJobDescription}"\n` +
            `Here is your resume in JSON format:\n` +
            `${JSON.stringify(input.resume, null, 2)}\n` +
            `Here is your list of skills in JSON format:\n` +
            `${JSON.stringify(Object.values(SkillName), null, 2)}`
        }
      ],
      response_format: zodResponseFormat(JobApplicationInsightsExtractionSchema, 'event')
    });

    return (
      completion.choices[0].message.parsed ?? {
        keywords: [],
        core: []
      }
    );
  }

  private flattenJobDescription(job: Job, company: Company): string {
    const positionDescription = `${company.name} is looking for a ${job.title} in ${job.locationRaw}`;

    return JobDescriptionItemsExtractor.extractItemsFromJob(job)
      .reduce<string[]>(
        (desc, item) => {
          switch (item.role) {
            case JobDescriptionItemRole.TITLE:
            case JobDescriptionItemRole.TEXT:
              desc.push(item.text);
              break;
            case JobDescriptionItemRole.LIST:
              desc.push(...item.text);
              break;
            default:
              break;
          }

          return desc;
        },
        [positionDescription]
      )
      .join('\n');
  }
}
