export type ResumeContentGeneratorExperience = {
  id: string;
  title: string;
  companyName: string;
  summary: string | null;
  accomplishments: Array<{ title: string; narrative: string | null }>;
  minBullets: number;
  maxBullets: number;
};

export type ResumeContentGeneratorInput = {
  profile: { firstName: string; lastName: string; about: string | null };
  headline: { summaryText: string } | null;
  jobDescription: { title: string; description: string; rawText: string | null };
  experiences: ResumeContentGeneratorExperience[];
};

export type ResumeContentGeneratorResult = {
  experiences: Array<{
    experienceId: string;
    experienceTitle: string;
    companyName: string;
    bullets: string[];
  }>;
};

export interface ResumeContentGenerator {
  generate(input: ResumeContentGeneratorInput): Promise<ResumeContentGeneratorResult>;
}
