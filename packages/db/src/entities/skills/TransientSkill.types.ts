import { BaseEntityProps } from '../../BaseEntity.types.js';
import { SkillAffinity } from './SkillAffinity.js';

export type TransientSkillProps = {
  name: string;
  key: string;
  affinity: SkillAffinity;
  variants: string[];
} & BaseEntityProps;

export type TransientSkillCreateProps = Omit<TransientSkillProps, 'createdAt' | 'updatedAt' | 'key'>;
