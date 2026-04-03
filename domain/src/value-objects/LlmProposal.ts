import type { GeneratedExperience } from './GeneratedContent.js';

export class LlmProposal {
  public readonly headlineOptions: string[];
  public readonly rankedExperiences: Array<{ experienceId: string; rankedBulletIds: string[] }>;
  public readonly generatedExperiences: GeneratedExperience[];
  public readonly rankedSkillIds: string[];
  public readonly assessment: string;

  public constructor(props: {
    headlineOptions: string[];
    rankedExperiences: Array<{ experienceId: string; rankedBulletIds: string[] }>;
    generatedExperiences: GeneratedExperience[];
    rankedSkillIds: string[];
    assessment: string;
  }) {
    this.headlineOptions = props.headlineOptions;
    this.rankedExperiences = props.rankedExperiences;
    this.generatedExperiences = props.generatedExperiences;
    this.rankedSkillIds = props.rankedSkillIds;
    this.assessment = props.assessment;
  }

  public static empty(): LlmProposal {
    return new LlmProposal({
      headlineOptions: [],
      rankedExperiences: [],
      generatedExperiences: [],
      rankedSkillIds: [],
      assessment: ''
    });
  }
}
