import { BaseEntityProps } from '../../BaseEntity.types';
import { SkillAffinity } from './SkillAffinity';

export type TransientSkillProps = {
  name: string;
  key: string;
  affinity: SkillAffinity;
  variants: string[];
} & BaseEntityProps;

export type TransientSkillCreateProps = Omit<TransientSkillProps, 'createdAt' | 'updatedAt' | 'key'>;
