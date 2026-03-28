import { BrilliantCVEducation, BrilliantCVExperience, BrilliantCVSkill, RawExperience } from '../../../brilliant-cv/types';
import { Stack } from '../data/types';

export type ResumeConfig = {
  social_networks: ('LinkedIn' | 'GitHub')[];
  headline: string;
  experience: RawExperience[];
  education: ('BS' | 'HS' | 'Cert')[];
  stack: Stack;
};

export type ResumeData = {
  headline: string;
  experience: BrilliantCVExperience[];
  skills: BrilliantCVSkill[];
  education: BrilliantCVEducation[];
};
