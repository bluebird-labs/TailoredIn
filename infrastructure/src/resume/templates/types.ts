import type {
  BrilliantCVEducation,
  BrilliantCVExperience,
  BrilliantCVSkill,
  RawExperience
} from '../../brilliant-cv/types.js';
import type { Stack } from '../types.js';

export type ResumeTemplate = {
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
