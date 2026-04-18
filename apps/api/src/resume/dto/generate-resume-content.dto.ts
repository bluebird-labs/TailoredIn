import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GenerateResumeContentSchema = z.object({
  jobDescriptionId: z.string(),
  additionalPrompt: z.string().optional(),
  customInstructions: z.string().optional(),
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
