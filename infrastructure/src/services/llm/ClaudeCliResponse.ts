import { z } from 'zod';

export const claudeCliResponseSchema = z
  .object({
    is_error: z.boolean(),
    result: z.string(),
    structured_output: z.unknown().optional()
  })
  .passthrough();

export type ClaudeCliResponse = z.infer<typeof claudeCliResponseSchema>;
