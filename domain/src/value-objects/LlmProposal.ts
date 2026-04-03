import type { GeneratedExperience } from './GeneratedContent.js';

export class LlmProposal {
  public readonly headlineOptions: string[];
  public readonly selectedExperiences: Array<{ experienceId: string; selectedAccomplishmentIds: string[] }>;
  public readonly generatedExperiences: GeneratedExperience[];
  public readonly rankedSkillIds: string[];
  public readonly assessment: string;

  public constructor(props: {
    headlineOptions: string[];
    selectedExperiences: Array<{ experienceId: string; selectedAccomplishmentIds: string[] }>;
    generatedExperiences: GeneratedExperience[];
    rankedSkillIds: string[];
    assessment: string;
  }) {
    this.headlineOptions = props.headlineOptions;
    this.selectedExperiences = props.selectedExperiences;
    this.generatedExperiences = props.generatedExperiences;
    this.rankedSkillIds = props.rankedSkillIds;
    this.assessment = props.assessment;
  }

  public static empty(): LlmProposal {
    return new LlmProposal({
      headlineOptions: [],
      selectedExperiences: [],
      generatedExperiences: [],
      rankedSkillIds: [],
      assessment: ''
    });
  }
}
