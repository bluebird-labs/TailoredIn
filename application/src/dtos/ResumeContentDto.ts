export type ResumeExperienceBulletsDto = {
  experienceId: string;
  experienceTitle: string;
  companyName: string;
  bullets: string[];
};

export type ResumeContentDto = {
  headline: string;
  experiences: ResumeExperienceBulletsDto[];
};
