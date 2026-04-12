import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import Path from 'node:path';
import type { MikroORM } from '@mikro-orm/postgresql';
import { LinguistImporter } from '../../src/linguist/LinguistImporter.js';
import { LinguistParser } from '../../src/linguist/LinguistParser.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

const FIXTURE_PATH = Path.resolve(import.meta.dirname, '../../test/linguist/fixtures/languages-fixture.yml');

describe('LinguistImporter', () => {
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
    const parser = new LinguistParser();
    const languages = await parser.parse(FIXTURE_PATH);
    const connection = orm.em.getConnection();
    const importer = new LinguistImporter(connection);
    await importer.importAll(languages, 'test-version');
  }

  test('imports all languages from fixture data', async () => {
    await runImport();

    const count = await countTable('linguist_languages');
    expect(count).toBe(6);
  }, 60_000);

  test('import is idempotent — running twice yields same row counts', async () => {
    const countBefore = await countTable('linguist_languages');

    await runImport();

    const countAfter = await countTable('linguist_languages');
    expect(countAfter).toBe(countBefore);
  }, 60_000);

  test('JSONB fields are stored correctly', async () => {
    const rows = await orm.em
      .getConnection()
      .execute(
        `SELECT "aliases", "extensions", "interpreters" FROM "linguist_languages" WHERE "linguist_name" = 'JavaScript'`
      );

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.aliases).toEqual(['js', 'node']);
    expect(row.extensions).toEqual(['.js', '.mjs', '.jsx']);
    expect(row.interpreters).toEqual(['node', 'nodejs']);
  }, 60_000);

  test('version field is set correctly', async () => {
    const rows = await orm.em
      .getConnection()
      .execute(`SELECT "linguist_version" FROM "linguist_languages" WHERE "linguist_name" = 'JavaScript'`);

    expect(rows).toHaveLength(1);
    expect(rows[0].linguist_version).toBe('test-version');
  }, 60_000);

  test('handles languages with no optional fields', async () => {
    const rows = await orm.em
      .getConnection()
      .execute(
        `SELECT "color", "aliases", "extensions", "interpreters", "tm_scope", "ace_mode", "linguist_group" FROM "linguist_languages" WHERE "linguist_name" = 'Minimal'`
      );

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.color).toBeNull();
    expect(row.aliases).toEqual([]);
    expect(row.extensions).toEqual([]);
    expect(row.interpreters).toEqual([]);
    expect(row.tm_scope).toBeNull();
    expect(row.ace_mode).toBeNull();
    expect(row.linguist_group).toBeNull();
  }, 60_000);
});
