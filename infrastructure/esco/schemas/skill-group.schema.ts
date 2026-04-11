import { z } from 'zod';

export const SkillGroupSchema = z.object({
  conceptType: z.literal('SkillGroup'),
  conceptUri: z.string().url(),
  preferredLabel: z.string(),
  altLabels: z.string().optional(),
  hiddenLabels: z.string().optional(),
  status: z.string(),
  modifiedDate: z.string().optional(),
  scopeNote: z.string().optional(),
  inScheme: z.string().optional(),
  description: z.string().optional(),
  code: z.string()
});

export type SkillGroup = z.infer<typeof SkillGroupSchema>;
