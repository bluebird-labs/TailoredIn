export type ResumeExperienceBulletsDto = {
  experienceId: string;
  experienceTitle: string;
  companyName: string;
  bullets: string[];
};

export type ResumeContentDto = {
  headline: string;
  experiences: ResumeExperienceBulletsDto[];
  /**
   * Experiences whose generation failed and therefore kept their previous content.
   * Empty when everything regenerated successfully.
   */
  failedExperienceIds: string[];
};
