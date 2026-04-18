import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateExperienceSchema = z.object({
  title: z.string().min(1),
  company_name: z.string().min(1),
  company_website: z.string().optional(),
  company_accent: z.string().optional(),
  location: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  summary: z.string().optional(),
  ordinal: z.number().int().min(0),
  accomplishments: z.array(
    z.object({
      id: z.string().nullable(),
      title: z.string().min(1),
      narrative: z.string(),
      ordinal: z.number().int().min(0)
    })
  ),
  bullet_min: z.number().int().min(0).max(20).optional(),
  bullet_max: z.number().int().min(0).max(20).optional()
});

export class UpdateExperienceDto extends createZodDto(UpdateExperienceSchema) {}
