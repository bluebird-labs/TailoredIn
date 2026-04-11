import { z } from 'zod';
import { SkillTypeEnum } from './skill.schema.js';

export const RelationTypeEnum = z.enum(['essential', 'optional']);

export const OccupationSkillRelationSchema = z.object({
  occupationUri: z.string().url(),
  occupationLabel: z.string(),
  relationType: RelationTypeEnum,
  skillType: SkillTypeEnum,
  skillUri: z.string().url(),
  skillLabel: z.string()
});

export type OccupationSkillRelation = z.infer<typeof OccupationSkillRelationSchema>;
