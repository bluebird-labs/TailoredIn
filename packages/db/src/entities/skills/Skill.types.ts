import { TransientSkillProps } from './TransientSkill.types.js';

export type SkillProps = TransientSkillProps & {
  id: string;
};

export type SkillCreateProps = Omit<SkillProps, 'id' | 'createdAt' | 'updatedAt' | 'key'>;
export type SkillRefreshProps = Partial<SkillCreateProps>;
