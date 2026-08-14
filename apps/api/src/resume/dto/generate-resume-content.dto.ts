import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GenerateResumeContentSchema = z.object({
  jobDescriptionId: z.string(),
  /** undefined = leave the stored instruction for this scope unchanged; null or '' = clear it; string = set it */
  customInstructions: z.string().nullable().optional(),
  includeCurrentVersion: z.boolean().optional(),
  bulletOverrides: z
    .array(z.object({ experienceId: z.string(), min: z.number().int().min(0), max: z.number().int().min(0) }))
    .optional(),
  scope: z
    .discriminatedUnion('type', [
      z.object({ type: z.literal('headline') }),
      z.object({ type: z.literal('experience'), experienceId: z.string() }),
      z.object({ type: z.literal('summary'), experienceId: z.string() }),
      z.object({
        type: z.literal('bullet'),
        experienceId: z.string(),
        bulletIndex: z.number().min(0),
        instructions: z.string()
      })
    ])
    .optional()
});

export class GenerateResumeContentDto extends createZodDto(GenerateResumeContentSchema) {}
