import { z } from 'zod';
import { SkillTypeEnum } from './skill.js';

const RelationTypeEnum = z.enum(['essential', 'optional']);

export const OccupationSkillRelationSchema = z.object({
  occupationUri: z.string().url(),
  occupationLabel: z.string(),
  relationType: RelationTypeEnum,
  skillType: SkillTypeEnum.optional(),
  skillUri: z.string().url(),
  skillLabel: z.string()
});

export type OccupationSkillRelation = z.infer<typeof OccupationSkillRelationSchema>;
