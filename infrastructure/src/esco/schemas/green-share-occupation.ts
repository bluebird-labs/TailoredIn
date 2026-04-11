import { z } from 'zod';

export const GreenShareConceptTypeEnum = z.enum(['ISCO level 3', 'ISCO level 4', 'Occupation']);

export const GreenShareOccupationSchema = z.object({
  conceptType: GreenShareConceptTypeEnum,
  conceptUri: z.string().url(),
  code: z.string(),
  preferredLabel: z.string(),
  greenShare: z.coerce.number()
});

export type GreenShareOccupation = z.infer<typeof GreenShareOccupationSchema>;
