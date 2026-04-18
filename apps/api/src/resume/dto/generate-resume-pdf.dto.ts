import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GenerateResumePdfSchema = z.object({
  jobDescriptionId: z.string(),
  theme: z.enum(['brilliant-cv', 'imprecv', 'modern-cv', 'linked-cv']).optional()
});

export class GenerateResumePdfDto extends createZodDto(GenerateResumePdfSchema) {}
