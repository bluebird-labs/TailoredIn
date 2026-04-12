import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Logger } from '@tailoredin/core';
import type { ZodError } from 'zod';
import type { MindDataset, MindParsedConcept, MindParsedSkill } from './MindDataset.js';
import { MindCategorizedConceptSchema } from './schemas/mind-concept.js';
import { MindSkillSchema } from './schemas/mind-skill.js';

export class MindDatasetParser {
  private readonly log = Logger.create('mind-parser');

  public async parse(repoRoot: string): Promise<MindDataset> {
    const skillsDir = join(repoRoot, 'skills');
    const conceptsDir = join(repoRoot, 'concepts');

    const [skills, concepts] = await Promise.all([this.parseSkills(skillsDir), this.parseConcepts(conceptsDir)]);

    this.log.info(`Parsed ${skills.length} skills, ${concepts.length} concepts`);
    return { skills, concepts };
  }

  private async parseSkills(skillsDir: string): Promise<MindParsedSkill[]> {
    const files = await this.listJsonFiles(skillsDir);
    const allSkills: MindParsedSkill[] = [];
    const errors: { file: string; index: number; error: ZodError }[] = [];

    for (const file of files) {
      const sourceFile = basename(file, '.json');
      if (sourceFile.startsWith('_')) continue;

      const raw = await this.readJsonArray(join(skillsDir, file));
      for (let i = 0; i < raw.length; i++) {
        const result = MindSkillSchema.safeParse(raw[i]);
        if (result.success) {
          allSkills.push({ ...result.data, sourceFile });
        } else {
          errors.push({ file, index: i, error: result.error });
        }
      }
    }

    if (errors.length > 0) {
      const messages = errors.map(e => `${e.file}[${e.index}]: ${e.error.message}`);
      throw new Error(`MIND skill validation failed (${errors.length} errors):\n${messages.join('\n')}`);
    }

    return allSkills;
  }

  /**
   * Concept files come in two shapes:
   * 1. Plain string arrays: ["Backend", "Frontend", ...]
   * 2. Categorized objects: [{ category: "...", <items_key>: ["...", ...] }, ...]
   *
   * Both are flattened into MindParsedConcept rows. Categorized concepts get the
   * category field populated; plain strings get category = null.
   */
  private async parseConcepts(conceptsDir: string): Promise<MindParsedConcept[]> {
    const files = await this.listJsonFiles(conceptsDir);
    const allConcepts: MindParsedConcept[] = [];

    for (const file of files) {
      const mindType = basename(file, '.json');
      const raw = await this.readJsonArray(join(conceptsDir, file));

      if (raw.length === 0) continue;

      if (typeof raw[0] === 'string') {
        // Plain string array — each string is a concept name
        for (const item of raw) {
          if (typeof item === 'string' && item.length > 0) {
            allConcepts.push({ name: item, category: null, mindType });
          }
        }
      } else {
        // Categorized objects — extract items from each category
        for (const item of raw) {
          const result = MindCategorizedConceptSchema.safeParse(item);
          if (!result.success) continue;

          const { category, ...rest } = result.data;
          // The items key varies by file — find the first string array that isn't 'category'
          for (const [key, values] of Object.entries(rest)) {
            if (key === 'category' || !Array.isArray(values)) continue;
            for (const name of values) {
              if (typeof name === 'string' && name.length > 0) {
                allConcepts.push({ name, category, mindType });
              }
            }
          }
        }
      }
    }

    return allConcepts;
  }

  private async listJsonFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir);
    return entries.filter(f => f.endsWith('.json')).sort();
  }

  private async readJsonArray(filePath: string): Promise<unknown[]> {
    const text = await Bun.file(filePath).text();
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected JSON array in ${filePath}, got ${typeof parsed}`);
    }
    return parsed;
  }
}
