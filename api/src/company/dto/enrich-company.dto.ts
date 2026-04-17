import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const EnrichCompanySchema = z.object({
  url: z.string().min(1),
  context: z.string().optional()
});

export class EnrichCompanyDto extends createZodDto(EnrichCompanySchema) {}
