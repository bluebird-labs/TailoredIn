import { injectable } from '@needle-di/core';
import { type ZodError, type ZodObject, type ZodRawShape, type ZodTypeAny, z } from 'zod';
import { parseCSVContent } from 'zod-csv';
import { EscoCsvParseError } from './EscoCsvParseError.js';

@injectable()
export class EscoCsvParser {
  /**
   * Parses a CSV file and validates every row against the given Zod schema.
   *
   * Empty CSV cells (empty strings) are converted to `undefined` before
   * validation so that `z.string().optional()` fields work correctly.
   *
   * @throws {EscoCsvParseError} when one or more rows fail validation
   */
  public async parse<T extends ZodObject<ZodRawShape>>(filePath: string, schema: T): Promise<z.infer<T>[]> {
    const content = await Bun.file(filePath).text();

    const headers = this.extractHeaders(content);
    const extractionSchema = this.buildExtractionSchema(headers);
    const csvResult = parseCSVContent(content, extractionSchema);

    const validated: z.infer<T>[] = [];
    const errors = new Map<number, ZodError>();

    for (let i = 0; i < csvResult.allRows.length; i++) {
      const preprocessed = this.preprocessRow(csvResult.allRows[i]);
      const result = schema.safeParse(preprocessed);
      if (result.success) {
        validated.push(result.data);
      } else {
        errors.set(i, result.error);
      }
    }

    if (errors.size > 0) {
      throw new EscoCsvParseError(filePath, errors);
    }

    return validated;
  }

  /**
   * Extracts the header names from the first line of CSV content.
   */
  private extractHeaders(content: string): string[] {
    const firstLine = content.slice(0, content.indexOf('\n')).trim();
    return firstLine.split(',');
  }

  /**
   * Builds a permissive schema keyed by CSV headers in their original
   * order. zod-csv maps schema keys to columns positionally, so the
   * extraction schema must mirror the CSV column order.
   */
  private buildExtractionSchema(headers: string[]): ZodObject<ZodRawShape> {
    const shape: Record<string, ZodTypeAny> = {};
    for (const header of headers) {
      shape[header] = z.string().optional();
    }
    return z.object(shape);
  }

  /**
   * Converts empty strings to `undefined` so optional Zod fields
   * (`.optional()`, `.url().optional()`) receive the correct sentinel.
   */
  private preprocessRow(row: Record<string, string | undefined>): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(row)) {
      result[key] = value === '' ? undefined : value;
    }
    return result;
  }
}
