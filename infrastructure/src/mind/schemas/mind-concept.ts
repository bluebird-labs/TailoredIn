import { z } from 'zod';

// Categorized concept files have: { category: string, <items_key>: string[] }
// where the items key varies by file (patterns, tasks, concepts, application_domains).
// Plain concept files are just string arrays: ["Backend", "Frontend", ...].
export const MindCategorizedConceptSchema = z
  .object({ category: z.string().min(1) })
  .catchall(z.array(z.string()).optional());

export type MindCategorizedConcept = z.infer<typeof MindCategorizedConceptSchema>;
