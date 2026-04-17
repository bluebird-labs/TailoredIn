import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateApplicationSchema = z.object({
  job_description_id: z.string().uuid().nullish(),
  notes: z.string().nullish()
});

export class UpdateApplicationDto extends createZodDto(UpdateApplicationSchema) {}
