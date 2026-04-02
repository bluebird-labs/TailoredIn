import type { StructuredLlmRequest } from '@tailoredin/application';
import type { z } from 'zod';

export interface LlmProviderBackend {
  generate<TInput extends z.ZodType, TOutput extends z.ZodType>(
    request: Omit<StructuredLlmRequest<TInput, TOutput>, 'provider'>
  ): Promise<z.infer<TOutput>>;
}
