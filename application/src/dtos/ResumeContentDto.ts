/** Resume content in the BrilliantCV/Typst template format. */
export type ResumePersonalDto = {
  first_name: string;
  last_name: string;
  github: string;
  linkedin: string;
  email: string;
  phone: string;
  location: string;
  header_quote: string;
};

export type ResumeExperienceDto = {
  title: string;
  society: string;
  date: string;
  location: string;
  summary: string;
  highlights: string[];
};

export type ResumeEducationDto = {
  title: string;
  society: string;
  date: string;
  location: string;
};

export type ResumeSkillDto = {
  type: string;
  info: string;
};

export type ResumeContentDto = {
  personal: ResumePersonalDto;
  keywords: string[];
  experience: ResumeExperienceDto[];
  skills: ResumeSkillDto[];
  education: ResumeEducationDto[];
};
