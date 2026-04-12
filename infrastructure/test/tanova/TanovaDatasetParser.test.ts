import { describe, expect, test } from 'bun:test';
import Path from 'node:path';
import { TanovaSkillSchema, TanovaTaxonomySchema } from '../../src/tanova/schemas/tanova-skill.js';
import { TanovaDatasetParser } from '../../src/tanova/TanovaDatasetParser.js';

const FIXTURE = Path.resolve(import.meta.dirname, 'fixtures/taxonomy.json');

describe('TanovaDatasetParser', () => {
  const parser = new TanovaDatasetParser();

  test('parses fixture JSON into flat skill array', async () => {
    const { skills, version } = await parser.parse(FIXTURE);

    expect(version).toBe('1.0.0-test');
    expect(skills).toHaveLength(4);
  });

  test('flattens skills from all categories and subcategories', async () => {
    const { skills } = await parser.parse(FIXTURE);

    const ids = skills.map(s => s.id);
    expect(ids).toContain('javascript');
    expect(ids).toContain('typescript');
    expect(ids).toContain('postgresql');
    expect(ids).toContain('agile');
  });

  test('preserves category and subcategory from source data', async () => {
    const { skills } = await parser.parse(FIXTURE);

    const js = skills.find(s => s.id === 'javascript')!;
    expect(js.category).toBe('technology');
    expect(js.subcategory).toBe('programming_languages');

    const agile = skills.find(s => s.id === 'agile')!;
    expect(agile.category).toBe('business');
    expect(agile.subcategory).toBe('project_management');
  });

  test('preserves all skill fields', async () => {
    const { skills } = await parser.parse(FIXTURE);

    const js = skills.find(s => s.id === 'javascript')!;
    expect(js.canonical_name).toBe('JavaScript');
    expect(js.aliases).toEqual(['JS', 'ECMAScript']);
    expect(js.tags).toEqual(['frontend', 'backend', 'web']);
    expect(js.description).toBe('A high-level, interpreted programming language.');
    expect(js.parent_skills).toEqual([]);
    expect(js.child_skills).toEqual(['typescript']);
    expect(js.related_skills).toEqual(['typescript', 'nodejs']);
    expect(js.transferability).toEqual({ typescript: 0.95, python: 0.6 });
    expect(js.proficiency_levels?.beginner?.markers).toEqual([
      'Can write basic scripts',
      'Understands variables and functions'
    ]);
    expect(js.typical_roles).toEqual(['Frontend Developer', 'Full Stack Developer']);
    expect(js.industry_demand).toBe('very_high');
    expect(js.prerequisites).toEqual([]);
  });

  test('handles skills with optional fields omitted', async () => {
    const { skills } = await parser.parse(FIXTURE);

    const agile = skills.find(s => s.id === 'agile')!;
    expect(agile.transferability).toBeUndefined();
    expect(agile.proficiency_levels).toBeUndefined();
  });
});

describe('TanovaSkillSchema', () => {
  test('rejects skill missing required id', () => {
    const result = TanovaSkillSchema.safeParse({ canonical_name: 'Test' });
    expect(result.success).toBe(false);
  });

  test('rejects skill missing required canonical_name', () => {
    const result = TanovaSkillSchema.safeParse({ id: 'test' });
    expect(result.success).toBe(false);
  });

  test('defaults array fields to empty arrays', () => {
    const result = TanovaSkillSchema.parse({ id: 'test', canonical_name: 'Test' });
    expect(result.aliases).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.parent_skills).toEqual([]);
    expect(result.child_skills).toEqual([]);
    expect(result.related_skills).toEqual([]);
    expect(result.typical_roles).toEqual([]);
    expect(result.prerequisites).toEqual([]);
  });

  test('rejects invalid industry_demand value', () => {
    const result = TanovaSkillSchema.safeParse({
      id: 'test',
      canonical_name: 'Test',
      industry_demand: 'extreme'
    });
    expect(result.success).toBe(false);
  });
});

describe('TanovaTaxonomySchema', () => {
  test('rejects taxonomy missing version', () => {
    const result = TanovaTaxonomySchema.safeParse({
      last_updated: '2026-01-01',
      categories: {}
    });
    expect(result.success).toBe(false);
  });

  test('accepts taxonomy with empty categories', () => {
    const result = TanovaTaxonomySchema.safeParse({
      version: '1.0.0',
      last_updated: '2026-01-01',
      categories: {}
    });
    expect(result.success).toBe(true);
  });
});
