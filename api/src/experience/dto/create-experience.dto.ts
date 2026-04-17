import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateExperienceSchema = z.object({
  title: z.string().min(1),
  company_name: z.string().min(1),
  company_website: z.string().optional(),
  company_accent: z.string().optional(),
  location: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  summary: z.string().optional(),
  ordinal: z.number().int().min(0)
});

export class CreateExperienceDto extends createZodDto(CreateExperienceSchema) {}
