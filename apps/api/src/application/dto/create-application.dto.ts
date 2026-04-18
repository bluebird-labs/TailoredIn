import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateApplicationSchema = z.object({
  company_id: z.string().uuid(),
  job_description_id: z.string().uuid().nullish(),
  notes: z.string().nullish()
});

export class CreateApplicationDto extends createZodDto(CreateApplicationSchema) {}
