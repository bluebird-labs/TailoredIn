import { z } from 'zod';

export const SkillsHierarchySchema = z.object({
  'Level 0 URI': z.string().url(),
  'Level 0 preferred term': z.string(),
  'Level 1 URI': z.string().url().optional(),
  'Level 1 preferred term': z.string().optional(),
  'Level 2 URI': z.string().url().optional(),
  'Level 2 preferred term': z.string().optional(),
  'Level 3 URI': z.string().url().optional(),
  'Level 3 preferred term': z.string().optional(),
  Description: z.string().optional(),
  'Scope note': z.string().optional(),
  'Level 0 code': z.string(),
  'Level 1 code': z.string().optional(),
  'Level 2 code': z.string().optional(),
  'Level 3 code': z.string().optional()
});

export type SkillsHierarchy = z.infer<typeof SkillsHierarchySchema>;
