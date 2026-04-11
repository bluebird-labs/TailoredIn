import { z } from 'zod';
import { ReuseLevelEnum, SkillTypeEnum } from './skill.schema.js';

/**
 * Shared schema for all skill collection files:
 * - greenSkillsCollection_en.csv
 * - digitalSkillsCollection_en.csv
 * - digCompSkillsCollection_en.csv
 * - transversalSkillsCollection_en.csv
 * - languageSkillsCollection_en.csv
 * - researchSkillsCollection_en.csv
 *
 * These are tagged subsets of the main Skill entity with denormalized broader concept info.
 */
export const SkillCollectionSchema = z.object({
  conceptType: z.literal('KnowledgeSkillCompetence'),
  conceptUri: z.string().url(),
  preferredLabel: z.string(),
  status: z.string(),
  skillType: SkillTypeEnum,
  reuseLevel: ReuseLevelEnum,
  altLabels: z.string().optional(),
  description: z.string().optional(),
  broaderConceptUri: z.string().optional(),
  broaderConceptPT: z.string().optional()
});

export type SkillCollection = z.infer<typeof SkillCollectionSchema>;
