export type ResumeContentGeneratorExperience = {
  id: string;
  title: string;
  companyName: string;
  summary: string | null;
  accomplishments: Array<{ title: string; narrative: string | null }>;
  minBullets: number;
  maxBullets: number;
};

export type ResumeContentGeneratorScope =
  | { type: 'headline' }
  | { type: 'experience'; experienceId: string };

export type ResumeContentGeneratorInput = {
  profile: { firstName: string; lastName: string; about: string | null };
  jobDescription: { title: string; description: string; rawText: string | null };
  experiences: ResumeContentGeneratorExperience[];
  additionalPrompt?: string;
  scope?: ResumeContentGeneratorScope;
};

export type ResumeContentGeneratorResult = {
  headline: string;
  experiences: Array<{
    experienceId: string;
    experienceTitle: string;
    companyName: string;
    summary: string;
    bullets: string[];
  }>;
  requestSchema: Record<string, unknown>;
};

export interface ResumeContentGenerator {
  generate(input: ResumeContentGeneratorInput): Promise<ResumeContentGeneratorResult>;
}
