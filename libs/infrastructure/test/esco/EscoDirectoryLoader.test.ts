import { join } from 'node:path';
import { ZodError } from 'zod';
import { EscoDirectoryLoader } from '../../src/esco/EscoDirectoryLoader.js';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures', 'esco-dataset-v1.2.1-classification-en-csv');

describe('EscoDirectoryLoader', () => {
  const loader = new EscoDirectoryLoader();

  test('loads all 19 ESCO files from the fixture directory', async () => {
    const result = await loader.load(FIXTURES_DIR);

    expect(Object.keys(result)).toHaveLength(19);
  });

  test('maps filenames to camelCase keys with full paths', async () => {
    const result = await loader.load(FIXTURES_DIR);

    expect(result.skills).toBe(join(FIXTURES_DIR, 'skills_en.csv'));
    expect(result.occupations).toBe(join(FIXTURES_DIR, 'occupations_en.csv'));
    expect(result.iscoGroups).toBe(join(FIXTURES_DIR, 'ISCOGroups_en.csv'));
    expect(result.skillSkillRelations).toBe(join(FIXTURES_DIR, 'skillSkillRelations_en.csv'));
  });

  test('throws ZodError when a required file is missing', async () => {
    const incomplete = join(import.meta.dirname, 'fixtures');

    await expect(loader.load(incomplete)).rejects.toBeInstanceOf(ZodError);
  });

  test('throws when directory does not exist', async () => {
    await expect(loader.load('/nonexistent')).rejects.toThrow();
  });
});
