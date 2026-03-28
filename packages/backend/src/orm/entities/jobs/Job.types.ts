import { Collection } from '@mikro-orm/core';
import { JobStatusUpdate } from './JobStatusUpdate';
import { TransientJobProps } from './TransientJob.types';
import { Company } from '../companies/Company';
import { RefOrEntity } from '../../helpers';
import { SkillAffinity } from '../skills/SkillAffinity';
import { Skill } from '../skills/Skill';

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
