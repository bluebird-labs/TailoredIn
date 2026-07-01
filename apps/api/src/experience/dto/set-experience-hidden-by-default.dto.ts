import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SetExperienceHiddenByDefaultSchema = z.object({
  hidden_by_default: z.boolean()
});

export class SetExperienceHiddenByDefaultDto extends createZodDto(SetExperienceHiddenByDefaultSchema) {}
