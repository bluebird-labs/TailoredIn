import type { Collection } from '@mikro-orm/core';
import type { RefOrEntity } from '../../helpers.js';
import type { Company } from '../companies/Company.js';
import type { Skill } from '../skills/Skill.js';
import type { SkillAffinity } from '../skills/SkillAffinity.js';
import type { JobStatusUpdate } from './JobStatusUpdate.js';
import type { TransientJobProps } from './TransientJob.types.js';

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
