import { Collection } from '@mikro-orm/core';
import { JobStatusUpdate } from './JobStatusUpdate.js';
import { TransientJobProps } from './TransientJob.types.js';
import { Company } from '../companies/Company.js';
import { RefOrEntity } from '../../helpers.js';
import { SkillAffinity } from '../skills/SkillAffinity.js';
import { Skill } from '../skills/Skill.js';

export type JobScoresSkillScore = {
  score: number;
  matches: Skill[];
};

export type JobScoresProps = {
  salary: number | null;
  skills: Record<SkillAffinity, JobScoresSkillScore> & {
    total: JobScoresSkillScore;
  };
};

export type JobProps = TransientJobProps & {
  id: string;
  company: RefOrEntity<Company>;
  statusUpdates?: Collection<JobStatusUpdate>;
  scores?: JobScoresProps | null;
};

export type JobCreateProps = Omit<JobProps, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdates'>;
