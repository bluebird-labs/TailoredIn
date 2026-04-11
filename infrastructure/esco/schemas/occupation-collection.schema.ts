import { z } from 'zod';

/**
 * Schema for researchOccupationsCollection_en.csv — a tagged subset of
 * the main Occupation entity with denormalized broader concept info.
 */
export const OccupationCollectionSchema = z.object({
  conceptType: z.literal('Occupation'),
  conceptUri: z.string().url(),
  preferredLabel: z.string(),
  status: z.string(),
  altLabels: z.string().optional(),
  description: z.string().optional(),
  broaderConceptUri: z.string().optional(),
  broaderConceptPT: z.string().optional()
});

export type OccupationCollection = z.infer<typeof OccupationCollectionSchema>;
