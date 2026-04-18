import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SyncSkillsSchema = z.object({
  skill_ids: z.array(z.string().uuid())
});

export class SyncSkillsDto extends createZodDto(SyncSkillsSchema) {}
