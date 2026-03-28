/** Raw experience entry as defined in resume template configs. */
export type RawExperience = {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  location: string;
  summary: string;
  highlights: string[];
};

export type BrilliantCVExperience = {
  title: string;
  society: string; // may contain Typst markup like #smallcaps[(contract)]
  date: string;
  location: string;
  summary: string;
  highlights: string[];
};

export type BrilliantCVEducation = {
  title: string;
  society: string;
  date: string;
  location: string;
};

export type BrilliantCVSkill = {
  type: string;
  info: string; // items joined with " #h-bar() "
};

export type BrilliantCVPersonal = {
  first_name: string;
  last_name: string;
  github: string;
  linkedin: string;
  email: string;
  phone: string;
  location: string;
  header_quote: string;
};

export type BrilliantCVContent = {
  personal: BrilliantCVPersonal;
  awesome_color: string; // hex like "#178FEA" or preset: "skyblue" | "red" | "nephritis" | "concrete" | "darknight"
  keywords: string[];
  experience: BrilliantCVExperience[];
  skills: BrilliantCVSkill[];
  education: BrilliantCVEducation[];
};
