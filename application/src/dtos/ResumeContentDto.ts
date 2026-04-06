export type ResumeExperienceBulletsDto = {
  experienceId: string;
  experienceTitle: string;
  companyName: string;
  bullets: string[];
};

export type ResumeContentDto = {
  experiences: ResumeExperienceBulletsDto[];
};
