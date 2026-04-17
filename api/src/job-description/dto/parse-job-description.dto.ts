import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ParseJobDescriptionSchema = z.object({
  text: z.string().min(1)
});

export class ParseJobDescriptionDto extends createZodDto(ParseJobDescriptionSchema) {}
