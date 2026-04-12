import { z } from 'zod';

const LinguistTypeEnum = z.enum(['programming', 'data', 'markup', 'prose']);

export const LinguistLanguageSchema = z.object({
  type: LinguistTypeEnum,
  color: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  extensions: z.array(z.string()).optional(),
  interpreters: z.array(z.string()).optional(),
  tm_scope: z.string().optional(),
  ace_mode: z.string().optional(),
  codemirror_mode: z.string().optional(),
  codemirror_mime_type: z.string().optional(),
  language_id: z.number().optional(),
  group: z.string().optional()
});

export type LinguistLanguage = z.infer<typeof LinguistLanguageSchema>;
