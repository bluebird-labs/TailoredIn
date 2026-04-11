import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { EscoCsvParser } from '../../src/esco/EscoCsvParser.js';
import type { EscoDataset } from '../../src/esco/EscoDataset.js';
import { EscoDatasetParser } from '../../src/esco/EscoDatasetParser.js';
import { EscoDirectoryLoader } from '../../src/esco/EscoDirectoryLoader.js';

const FIXTURES_DIR = join(import.meta.dir, 'fixtures', 'esco-dataset-v1.2.1-classification-en-csv');

describe('EscoDatasetParser', () => {
  const loader = new EscoDirectoryLoader();
  const parser = new EscoDatasetParser(new EscoCsvParser());

  let dataset: EscoDataset;

  test('parses all 19 files into a typed dataset', async () => {
    const directory = await loader.load(FIXTURES_DIR);
    dataset = await parser.parse(directory);

    const keys = Object.keys(dataset);
    expect(keys).toHaveLength(19);

    for (const key of keys) {
      const rows = dataset[key as keyof EscoDataset];
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  test('skills have correct typed fields', () => {
    expect(dataset.skills[0].conceptType).toBe('KnowledgeSkillCompetence');
    expect(dataset.skills[0].conceptUri).toContain('http://');
    expect(['skill/competence', 'knowledge']).toContain(dataset.skills[0].skillType);
  });

  test('occupations have correct typed fields', () => {
    expect(dataset.occupations[0].conceptType).toBe('Occupation');
    expect(dataset.occupations[0].code).toBeDefined();
    expect(dataset.occupations[0].iscoGroup).toBeDefined();
  });

  test('greenShareOcc has numeric greenShare values', () => {
    for (const row of dataset.greenShareOcc) {
      expect(typeof row.greenShare).toBe('number');
      expect(row.greenShare).toBeGreaterThanOrEqual(0);
    }
  });

  test('all skill collections share the KnowledgeSkillCompetence concept type', () => {
    const collectionKeys = [
      'greenSkillsCollection',
      'digitalSkillsCollection',
      'digCompSkillsCollection',
      'transversalSkillsCollection',
      'languageSkillsCollection',
      'researchSkillsCollection'
    ] as const;

    for (const key of collectionKeys) {
      for (const row of dataset[key]) {
        expect(row.conceptType).toBe('KnowledgeSkillCompetence');
      }
    }
  });

  test('researchOccupationsCollection has Occupation concept type', () => {
    for (const row of dataset.researchOccupationsCollection) {
      expect(row.conceptType).toBe('Occupation');
    }
  });

  test('skillsHierarchy has Level 0 codes for all rows', () => {
    for (const row of dataset.skillsHierarchy) {
      expect(row['Level 0 code']).toBeDefined();
      expect(row['Level 0 URI']).toContain('http://');
    }
  });
});
