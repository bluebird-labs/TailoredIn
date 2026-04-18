import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateDisplaySettingsSchema = z.object({
  jobDescriptionId: z.string(),
  experienceHiddenBullets: z
    .array(
      z.object({
        experienceId: z.string(),
        hiddenBulletIndices: z.array(z.number().int().min(0))
      })
    )
    .optional(),
  hiddenEducationIds: z.array(z.string()).optional()
});

export class UpdateDisplaySettingsDto extends createZodDto(UpdateDisplaySettingsSchema) {}
