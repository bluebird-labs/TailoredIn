import type { ZodError } from 'zod';

export class EscoCsvParseError extends Error {
  public readonly filePath: string;
  public readonly rowErrors: ReadonlyMap<number, ZodError>;

  public constructor(filePath: string, rowErrors: Map<number, ZodError>) {
    const count = rowErrors.size;
    super(`Failed to parse ESCO CSV: ${filePath} (${count} invalid row${count === 1 ? '' : 's'})`);
    this.name = 'EscoCsvParseError';
    this.filePath = filePath;
    this.rowErrors = rowErrors;
  }
}
