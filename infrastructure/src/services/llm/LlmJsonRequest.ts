import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export abstract class LlmJsonRequest<T extends z.ZodObject<z.ZodRawShape>> {
  public abstract get prompt(): string;
  public abstract get schema(): T;

  public get model(): string | undefined {
    return undefined;
  }

  public get maxTokens(): number | undefined {
    return undefined;
  }

  public getJsonSchema(): string {
    return JSON.stringify(zodToJsonSchema(this.schema, { target: 'openApi3' }));
  }
}
