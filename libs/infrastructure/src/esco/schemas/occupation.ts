import { z } from 'zod';

export const OccupationSchema = z.object({
  conceptType: z.literal('Occupation'),
  conceptUri: z.string().url(),
  iscoGroup: z.string(),
  preferredLabel: z.string(),
  altLabels: z.string().optional(),
  hiddenLabels: z.string().optional(),
  status: z.string(),
  modifiedDate: z.string().optional(),
  regulatedProfessionNote: z.string().optional(),
  scopeNote: z.string().optional(),
  definition: z.string().optional(),
  inScheme: z.string().optional(),
  description: z.string().optional(),
  code: z.string(),
  naceCode: z.string().optional()
});

export type Occupation = z.infer<typeof OccupationSchema>;
