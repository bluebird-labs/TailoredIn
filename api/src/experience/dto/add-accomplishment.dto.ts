import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AddAccomplishmentSchema = z.object({
  title: z.string().min(1),
  narrative: z.string().min(1),
  ordinal: z.number().int().min(0)
});

export class AddAccomplishmentDto extends createZodDto(AddAccomplishmentSchema) {}
