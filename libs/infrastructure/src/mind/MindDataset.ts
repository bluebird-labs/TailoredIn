import type { MindSkill } from './schemas/mind-skill.js';

export type MindParsedSkill = MindSkill & { sourceFile: string };

export type MindParsedConcept = {
  readonly name: string;
  readonly category: string | null;
  readonly mindType: string;
};

export type MindDataset = {
  readonly skills: readonly MindParsedSkill[];
  readonly concepts: readonly MindParsedConcept[];
};
