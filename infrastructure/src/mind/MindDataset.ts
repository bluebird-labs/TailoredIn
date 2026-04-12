import type { MindConcept } from './schemas/mind-concept.js';
import type { MindSkill } from './schemas/mind-skill.js';

export type MindParsedSkill = MindSkill & { sourceFile: string };
export type MindParsedConcept = MindConcept & { mindType: string };

export type MindDataset = {
  readonly skills: readonly MindParsedSkill[];
  readonly concepts: readonly MindParsedConcept[];
};
