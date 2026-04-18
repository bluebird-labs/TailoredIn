import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateGenerationSettingsSchema = z.object({
  model_tier: z.enum(['fast', 'balanced', 'best']).optional(),
  bullet_min: z.number().int().min(1).max(20).optional(),
  bullet_max: z.number().int().min(1).max(20).optional(),
  prompts: z
    .array(
      z.object({
        scope: z.enum(['resume', 'headline', 'experience']),
        content: z.string().nullable()
      })
    )
    .optional()
});

export class UpdateGenerationSettingsDto extends createZodDto(UpdateGenerationSettingsSchema) {}
