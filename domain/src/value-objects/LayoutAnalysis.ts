export type BlockLayout = {
  lineCount: number;
  pageNumbers: number[];
};

export type LayoutAnalysis = {
  totalPages: number;
  /**
   * Header section. lineCount for name is approximated from font sizes since the
   * header is rendered by the brilliant-cv package and cannot be instrumented directly.
   * headline and infoLine are also approximated.
   */
  header: {
    name: BlockLayout;
    headline: BlockLayout;
    infoLine: BlockLayout;
  };
  /**
   * Indexed 1:1 with ResumeContentDto.experience[].
   * company covers the full cv-entry block for that experience group.
   * roles[].title covers the role title + summary line.
   * roles[].bullets[i] covers bullet i.
   */
  experiences: Array<{
    company: BlockLayout;
    roles: Array<{
      title: BlockLayout;
      bullets: BlockLayout[];
    }>;
  }>;
  /** Indexed 1:1 with ResumeContentDto.education[]. */
  education: BlockLayout[];
  /** Indexed 1:1 with non-"interests" entries in ResumeContentDto.skills[]. */
  skills: BlockLayout[];
};
