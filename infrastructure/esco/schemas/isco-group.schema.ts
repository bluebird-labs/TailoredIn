import { z } from 'zod';

export const ISCOGroupSchema = z.object({
  conceptType: z.literal('ISCOGroup'),
  conceptUri: z.string().url(),
  code: z.string(),
  preferredLabel: z.string(),
  status: z.string(),
  altLabels: z.string().optional(),
  inScheme: z.string().optional(),
  description: z.string().optional()
});

export type ISCOGroup = z.infer<typeof ISCOGroupSchema>;
