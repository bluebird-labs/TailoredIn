import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateEducationSchema = z.object({
  degree_title: z.string().min(1),
  institution_name: z.string().min(1),
  graduation_year: z.number().int().min(1900).max(2100),
  location: z.string().min(1).nullable(),
  honors: z.string().min(1).nullable(),
  ordinal: z.number().int().min(0),
  hidden_by_default: z.boolean()
});

export class UpdateEducationDto extends createZodDto(UpdateEducationSchema) {}
