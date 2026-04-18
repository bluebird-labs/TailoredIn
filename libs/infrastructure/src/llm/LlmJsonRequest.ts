import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export abstract class LlmJsonRequest<T extends z.ZodObject<z.ZodRawShape>> {
  public abstract get prompt(): string;
  public abstract get schema(): T;

  /** Validation errors from a previous attempt, set by the retry loop. */
  public previousValidationErrors: string[] = [];

  public get model(): string | undefined {
    return undefined;
  }

  public get maxTokens(): number | undefined {
    return undefined;
  }

  public getInput(): Record<string, unknown> | undefined {
    return undefined;
  }

  public getJsonSchema(): Record<string, unknown> {
    return zodToJsonSchema(this.schema, { target: 'openApi3' }) as Record<string, unknown>;
  }

  /** Builds a prompt suffix with previous validation errors, if any. */
  protected buildValidationErrorsSuffix(): string {
    if (this.previousValidationErrors.length === 0) return '';
    const errorList = this.previousValidationErrors.map(e => `- ${e}`).join('\n');
    return `\n\n## IMPORTANT: Previous attempt was rejected\n\nYour previous response failed validation with these errors:\n${errorList}\n\nFix ALL of the above issues in this attempt. Pay close attention to character length limits.`;
  }
}
