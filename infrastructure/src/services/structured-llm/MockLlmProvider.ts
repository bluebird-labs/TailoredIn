import type { StructuredLlmRequest } from '@tailoredin/application';
import type { ZodTypeAny, z } from 'zod';
import type { LlmProviderBackend } from './LlmProviderBackend.js';

export class MockLlmProvider implements LlmProviderBackend {
  public async generate<TInput extends z.ZodType, TOutput extends z.ZodType>(
    request: Omit<StructuredLlmRequest<TInput, TOutput>, 'provider'>
  ): Promise<z.infer<TOutput>> {
    const defaults = deriveDefaults(request.outputSchema);
    return request.outputSchema.parse(defaults);
  }
}

function deriveDefaults(schema: ZodTypeAny): unknown {
  const def = schema._def;

  switch (def.typeName) {
    case 'ZodString':
      return '';
    case 'ZodNumber':
      return 0;
    case 'ZodBoolean':
      return false;
    case 'ZodArray':
      return [];
    case 'ZodObject':
    case 'ZodStrictObject': {
      const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;
      const result: Record<string, unknown> = {};
      for (const [key, fieldSchema] of Object.entries(shape)) {
        result[key] = deriveDefaults(fieldSchema as ZodTypeAny);
      }
      return result;
    }
    case 'ZodEnum':
      return def.values[0];
    case 'ZodNativeEnum': {
      const values = Object.values(def.values as Record<string, string | number>);
      return values[0];
    }
    case 'ZodNullable':
      return null;
    case 'ZodOptional':
      return undefined;
    case 'ZodDefault':
      return def.defaultValue();
    case 'ZodLiteral':
      return def.value;
    case 'ZodEffects':
      return deriveDefaults(def.schema);
    case 'ZodUnion':
      return deriveDefaults(def.options[0]);
    case 'ZodRecord':
      return {};
    case 'ZodTuple':
      return (def.items as ZodTypeAny[]).map(deriveDefaults);
    default:
      return undefined;
  }
}
