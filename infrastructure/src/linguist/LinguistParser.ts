import { Logger } from '@tailoredin/core';
import YAML from 'yaml';
import type { ZodError } from 'zod';
import { type LinguistLanguage, LinguistLanguageSchema } from './schemas/linguist-language.js';

export type ParsedLinguistLanguage = { name: string } & LinguistLanguage;

export class LinguistParser {
  private readonly log = Logger.create('linguist-parser');

  public async parse(filePath: string): Promise<ParsedLinguistLanguage[]> {
    const content = await Bun.file(filePath).text();
    const raw = YAML.parse(content) as Record<string, unknown>;

    const validated: ParsedLinguistLanguage[] = [];
    const errors = new Map<string, ZodError>();

    for (const [name, entry] of Object.entries(raw)) {
      const result = LinguistLanguageSchema.safeParse(entry);
      if (result.success) {
        validated.push({ name, ...result.data });
      } else {
        errors.set(name, result.error);
      }
    }

    if (errors.size > 0) {
      for (const [name, error] of errors) {
        this.log.error(`Validation failed for "${name}": ${error.message}`);
      }
      throw new Error(`Linguist YAML validation failed for ${errors.size} entries`);
    }

    this.log.info(`Parsed ${validated.length} languages`);
    return validated;
  }
}
