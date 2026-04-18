import { z } from 'zod';

const IndustryDemandEnum = z.enum(['very_high', 'high', 'medium', 'low']);

const ProficiencyLevelSchema = z.object({
  markers: z.array(z.string()),
  typical_experience: z.string()
});

export const TanovaSkillSchema = z.object({
  id: z.string(),
  canonical_name: z.string(),
  aliases: z.array(z.string()).default([]),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  parent_skills: z.array(z.string()).default([]),
  child_skills: z.array(z.string()).default([]),
  related_skills: z.array(z.string()).default([]),
  transferability: z.record(z.string(), z.number()).optional(),
  proficiency_levels: z
    .object({
      beginner: ProficiencyLevelSchema.optional(),
      intermediate: ProficiencyLevelSchema.optional(),
      advanced: ProficiencyLevelSchema.optional(),
      expert: ProficiencyLevelSchema.optional()
    })
    .optional(),
  typical_roles: z.array(z.string()).default([]),
  industry_demand: IndustryDemandEnum.optional(),
  prerequisites: z.array(z.string()).default([]),
  last_updated: z.string().optional()
});

export type TanovaSkill = z.infer<typeof TanovaSkillSchema>;

const SubcategorySchema = z.object({
  name: z.string(),
  skills: z.array(TanovaSkillSchema)
});

const CategorySchema = z.object({
  name: z.string(),
  subcategories: z.record(z.string(), SubcategorySchema)
});

export const TanovaTaxonomySchema = z.object({
  version: z.string(),
  last_updated: z.string(),
  categories: z.record(z.string(), CategorySchema)
});
