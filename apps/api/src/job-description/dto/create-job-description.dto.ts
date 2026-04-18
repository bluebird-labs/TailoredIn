import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateJobDescriptionSchema = z.object({
  company_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().nullish(),
  location: z.string().nullish(),
  salary_min: z.number().nullish(),
  salary_max: z.number().nullish(),
  salary_currency: z.string().nullish(),
  level: z.string().nullish(),
  location_type: z.string().nullish(),
  source: z.string().min(1),
  posted_at: z.string().nullish(),
  raw_text: z.string().nullish(),
  sought_hard_skills: z.array(z.string()).nullish(),
  sought_soft_skills: z.array(z.string()).nullish()
});

export class CreateJobDescriptionDto extends createZodDto(CreateJobDescriptionSchema) {}
