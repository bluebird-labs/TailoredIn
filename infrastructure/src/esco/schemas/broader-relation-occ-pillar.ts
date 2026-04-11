import { z } from 'zod';

export const OccPillarConceptTypeEnum = z.enum(['ISCOGroup', 'Occupation']);

export const BroaderRelationOccPillarSchema = z.object({
  conceptType: OccPillarConceptTypeEnum,
  conceptUri: z.string().url(),
  conceptLabel: z.string(),
  broaderType: OccPillarConceptTypeEnum,
  broaderUri: z.string().url(),
  broaderLabel: z.string()
});

export type BroaderRelationOccPillar = z.infer<typeof BroaderRelationOccPillarSchema>;
