import { z } from 'zod';
import { SkillTypeEnum } from './skill.js';

const SkillRelationTypeEnum = z.enum(['essential', 'optional']);

export const SkillSkillRelationSchema = z.object({
  originalSkillUri: z.string().url(),
  originalSkillType: SkillTypeEnum,
  relationType: SkillRelationTypeEnum,
  relatedSkillType: SkillTypeEnum,
  relatedSkillUri: z.string().url()
});

export type SkillSkillRelation = z.infer<typeof SkillSkillRelationSchema>;
