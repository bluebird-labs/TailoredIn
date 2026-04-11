import { z } from 'zod';

export const SkillTypeEnum = z.enum(['skill/competence', 'knowledge']);
export const ReuseLevelEnum = z.enum(['sector-specific', 'cross-sector', 'transversal']);

export const SkillSchema = z.object({
  conceptType: z.literal('KnowledgeSkillCompetence'),
  conceptUri: z.string().url(),
  skillType: SkillTypeEnum,
  reuseLevel: ReuseLevelEnum,
  preferredLabel: z.string(),
  altLabels: z.string().optional(),
  hiddenLabels: z.string().optional(),
  status: z.string(),
  modifiedDate: z.string().optional(),
  scopeNote: z.string().optional(),
  definition: z.string().optional(),
  inScheme: z.string().optional(),
  description: z.string().optional()
});

export type Skill = z.infer<typeof SkillSchema>;
