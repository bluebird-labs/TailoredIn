import Path from 'node:path';
import type { MikroORM } from '@mikro-orm/postgresql';
import { TanovaDatasetParser } from '../../src/tanova/TanovaDatasetParser.js';
import { TanovaImporter } from '../../src/tanova/TanovaImporter.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

const FIXTURE = Path.resolve(import.meta.dirname, '../../test/tanova/fixtures/taxonomy.json');

describe('TanovaImporter', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await setupTestDatabase();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function countTable(table: string): Promise<number> {
    const result = await orm.em.getConnection().execute(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return result[0].count;
  }

  async function runImport(): Promise<void> {
    const parser = new TanovaDatasetParser();
    const { skills, version } = await parser.parse(FIXTURE);
    const connection = orm.em.getConnection();
    const importer = new TanovaImporter(connection);
    await importer.importAll(skills, version);
  }

  test('imports all skills from fixture data', async () => {
    await runImport();

    const count = await countTable('tanova_skills');
    expect(count).toBe(4);
  }, 60_000);

  test('import is idempotent — running twice yields same row count', async () => {
    const countBefore = await countTable('tanova_skills');

    await runImport();

    const countAfter = await countTable('tanova_skills');
    expect(countAfter).toBe(countBefore);
  }, 60_000);

  test('stores correct field values', async () => {
    const rows = await orm.em.getConnection().execute(`SELECT * FROM "tanova_skills" WHERE "tanova_id" = 'javascript'`);

    expect(rows).toHaveLength(1);
    const js = rows[0];
    expect(js.canonical_name).toBe('JavaScript');
    expect(js.category).toBe('technology');
    expect(js.subcategory).toBe('programming_languages');
    expect(js.industry_demand).toBe('very_high');
    expect(js.tanova_version).toBe('1.0.0-test');

    const aliases = typeof js.aliases === 'string' ? JSON.parse(js.aliases) : js.aliases;
    expect(aliases).toEqual(['JS', 'ECMAScript']);

    const tags = typeof js.tags === 'string' ? JSON.parse(js.tags) : js.tags;
    expect(tags).toEqual(['frontend', 'backend', 'web']);

    const transferability =
      typeof js.transferability === 'string' ? JSON.parse(js.transferability) : js.transferability;
    expect(transferability).toEqual({ typescript: 0.95, python: 0.6 });
  }, 60_000);

  test('stores skills from all categories', async () => {
    const rows = await orm.em
      .getConnection()
      .execute(`SELECT DISTINCT "category" FROM "tanova_skills" ORDER BY "category"`);
    const categories = (rows as { category: string }[]).map(r => r.category);
    expect(categories).toEqual(['business', 'technology']);
  }, 60_000);
});
