import type { SkillDto } from './SkillDto.js';

export type ExperienceSkillDto = {
  readonly id: string;
  readonly skillId: string;
  readonly skill: SkillDto;
};
