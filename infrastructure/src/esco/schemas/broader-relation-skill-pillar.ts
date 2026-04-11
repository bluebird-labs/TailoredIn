import { z } from 'zod';

export const SkillPillarConceptTypeEnum = z.enum(['SkillGroup', 'KnowledgeSkillCompetence']);

export const BroaderRelationSkillPillarSchema = z.object({
  conceptType: SkillPillarConceptTypeEnum,
  conceptUri: z.string().url(),
  conceptLabel: z.string(),
  broaderType: SkillPillarConceptTypeEnum,
  broaderUri: z.string().url(),
  broaderLabel: z.string()
});

export type BroaderRelationSkillPillar = z.infer<typeof BroaderRelationSkillPillarSchema>;
