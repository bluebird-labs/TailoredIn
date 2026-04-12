import { z } from 'zod';

export const MindConceptSchema = z.object({
  name: z.string().min(1),
  synonyms: z.array(z.string()).default([])
});

export type MindConcept = z.infer<typeof MindConceptSchema>;
