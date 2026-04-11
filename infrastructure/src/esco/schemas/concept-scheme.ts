import { z } from 'zod';

export const ConceptSchemeSchema = z.object({
  conceptType: z.literal('ConceptScheme'),
  conceptSchemeUri: z.string().url(),
  preferredLabel: z.string(),
  title: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  hasTopConcept: z.string().optional()
});

export type ConceptScheme = z.infer<typeof ConceptSchemeSchema>;
