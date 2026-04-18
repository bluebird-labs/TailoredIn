import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SearchSkillsSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export class SearchSkillsDto extends createZodDto(SearchSkillsSchema) {}
