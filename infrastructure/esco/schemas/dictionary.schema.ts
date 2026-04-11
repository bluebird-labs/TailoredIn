import { z } from 'zod';

export const DictionarySchema = z.object({
  filename: z.string(),
  'data header': z.string(),
  property: z.string().optional(),
  description: z.string().optional()
});

export type Dictionary = z.infer<typeof DictionarySchema>;
