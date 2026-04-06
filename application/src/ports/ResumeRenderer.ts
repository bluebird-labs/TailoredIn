import type { ResumeTemplate } from '@tailoredin/domain';

export type ResumeRenderExperience = {
  title: string;
  companyName: string;
  location: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // null = current
  summary: string | null;
  bullets: string[];
};

export type ResumeRenderEducation = {
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
};

export type ResumeRenderInput = {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    linkedin: string | null; // slug only, e.g. "sylvain-estevez"
    github: string | null;
    website: string | null;
  };
  headlineSummary: string | null;
  experiences: ResumeRenderExperience[];
  educations: ResumeRenderEducation[];
  template: ResumeTemplate;
};

export interface ResumeRenderer {
  render(input: ResumeRenderInput): Promise<Uint8Array>;
}
