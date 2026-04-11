import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { injectable } from '@needle-di/core';
import { z } from 'zod';

const file = z.string().endsWith('.csv');

export const EscoDirectorySchema = z.object({
  broaderRelationsOccPillar: file,
  broaderRelationsSkillPillar: file,
  conceptSchemes: file,
  dictionary: file,
  digCompSkillsCollection: file,
  digitalSkillsCollection: file,
  greenShareOcc: file,
  greenSkillsCollection: file,
  iscoGroups: file,
  languageSkillsCollection: file,
  occupations: file,
  occupationSkillRelations: file,
  researchOccupationsCollection: file,
  researchSkillsCollection: file,
  skillGroups: file,
  skills: file,
  skillsHierarchy: file,
  skillSkillRelations: file,
  transversalSkillsCollection: file
});

export type EscoDirectory = z.infer<typeof EscoDirectorySchema>;

const FILENAME_TO_KEY: Record<string, keyof EscoDirectory> = {
  'broaderRelationsOccPillar_en.csv': 'broaderRelationsOccPillar',
  'broaderRelationsSkillPillar_en.csv': 'broaderRelationsSkillPillar',
  'conceptSchemes_en.csv': 'conceptSchemes',
  'dictionary_en.csv': 'dictionary',
  'digCompSkillsCollection_en.csv': 'digCompSkillsCollection',
  'digitalSkillsCollection_en.csv': 'digitalSkillsCollection',
  'greenShareOcc_en.csv': 'greenShareOcc',
  'greenSkillsCollection_en.csv': 'greenSkillsCollection',
  'ISCOGroups_en.csv': 'iscoGroups',
  'languageSkillsCollection_en.csv': 'languageSkillsCollection',
  'occupations_en.csv': 'occupations',
  'occupationSkillRelations_en.csv': 'occupationSkillRelations',
  'researchOccupationsCollection_en.csv': 'researchOccupationsCollection',
  'researchSkillsCollection_en.csv': 'researchSkillsCollection',
  'skillGroups_en.csv': 'skillGroups',
  'skills_en.csv': 'skills',
  'skillsHierarchy_en.csv': 'skillsHierarchy',
  'skillSkillRelations_en.csv': 'skillSkillRelations',
  'transversalSkillsCollection_en.csv': 'transversalSkillsCollection'
};

@injectable()
export class EscoDirectoryLoader {
  public async load(directory: string): Promise<EscoDirectory> {
    const entries = await readdir(directory, { withFileTypes: true });
    const mapped: Record<string, string> = {};

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const key = FILENAME_TO_KEY[entry.name];
      if (key) {
        mapped[key] = join(directory, entry.name);
      }
    }

    return EscoDirectorySchema.parse(mapped);
  }
}
