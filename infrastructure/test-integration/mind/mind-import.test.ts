import Path from 'node:path';
import type { MikroORM } from '@mikro-orm/postgresql';
import { MindDatasetParser } from '../../src/mind/MindDatasetParser.js';
import { MindImporter } from '../../src/mind/MindImporter.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

const FIXTURES_DIR = Path.resolve(import.meta.dirname, '../../test/mind/fixtures');
const TEST_VERSION = 'abc123def456';

describe('MindImporter', () => {
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
    const connection = orm.em.getConnection();
    const parser = new MindDatasetParser();
    const dataset = await parser.parse(FIXTURES_DIR);
    const importer = new MindImporter(connection);
    await importer.importAll(dataset, TEST_VERSION);
  }

  test('imports all tables from fixture data', async () => {
    await runImport();

    const skills = await countTable('mind_skills');
    const concepts = await countTable('mind_concepts');
    const relations = await countTable('mind_relations');

    // 3 programming languages + 2 frameworks = 5 skills
    expect(skills).toBe(5);
    // architectural_patterns: 6 (2 categories x 3 items) + technical_domains: 4 = 10
    expect(concepts).toBe(10);
    // React → JavaScript, Vue → JavaScript (impliesKnowingSkills)
    // JavaScript → Event-driven programming, React → Component-based architecture,
    // Vue → Component-based architecture (impliesKnowingConcepts)
    expect(relations).toBe(5);
  }, 60_000);

  test('import is idempotent — running twice yields same row counts', async () => {
    const countsBefore: Record<string, number> = {};
    const tables = ['mind_skills', 'mind_concepts', 'mind_relations'];

    for (const t of tables) {
      countsBefore[t] = await countTable(t);
    }

    // Run import again
    await runImport();

    for (const t of tables) {
      const after = await countTable(t);
      expect(after).toBe(countsBefore[t]);
    }
  }, 60_000);

  test('relations are derived correctly from impliesKnowing arrays', async () => {
    const connection = orm.em.getConnection();

    const skillRelations = await connection.execute(
      `SELECT "mind_source_name", "mind_target_name" FROM "mind_relations" WHERE "relation_type" = 'impliesKnowingSkills' ORDER BY "mind_source_name"`
    );
    expect(skillRelations).toHaveLength(2);
    expect(skillRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mind_source_name: 'React', mind_target_name: 'JavaScript' }),
        expect.objectContaining({ mind_source_name: 'Vue', mind_target_name: 'JavaScript' })
      ])
    );

    const conceptRelations = await connection.execute(
      `SELECT "mind_source_name", "mind_target_name" FROM "mind_relations" WHERE "relation_type" = 'impliesKnowingConcepts' ORDER BY "mind_source_name"`
    );
    expect(conceptRelations).toHaveLength(3);
    expect(conceptRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mind_source_name: 'JavaScript', mind_target_name: 'Event-driven programming' }),
        expect.objectContaining({ mind_source_name: 'React', mind_target_name: 'Component-based architecture' }),
        expect.objectContaining({ mind_source_name: 'Vue', mind_target_name: 'Component-based architecture' })
      ])
    );
  }, 60_000);

  test('categorized concepts store category correctly', async () => {
    const connection = orm.em.getConnection();
    const result = await connection.execute(
      `SELECT "mind_name", "mind_type", "category" FROM "mind_concepts" WHERE "mind_name" = 'Microservices'`
    );

    expect(result).toHaveLength(1);
    expect(result[0].mind_type).toBe('architectural_patterns');
    expect(result[0].category).toBe('Application Architecture Patterns');
  }, 60_000);

  test('plain string concepts have null category', async () => {
    const connection = orm.em.getConnection();
    const result = await connection.execute(
      `SELECT "mind_name", "mind_type", "category" FROM "mind_concepts" WHERE "mind_name" = 'Backend'`
    );

    expect(result).toHaveLength(1);
    expect(result[0].mind_type).toBe('technical_domains');
    expect(result[0].category).toBeNull();
  }, 60_000);

  test('skill JSONB fields are stored correctly', async () => {
    const connection = orm.em.getConnection();
    const result = await connection.execute(
      `SELECT "mind_type", "synonyms", "technical_domains", "mind_source_file", "mind_version" FROM "mind_skills" WHERE "mind_name" = 'JavaScript'`
    );

    expect(result).toHaveLength(1);
    const row = result[0];
    expect(row.mind_type).toEqual(['ProgrammingLanguage']);
    expect(row.synonyms).toEqual(['JS', 'ECMAScript']);
    expect(row.technical_domains).toEqual(['frontend', 'backend']);
    expect(row.mind_source_file).toBe('programming_languages');
    expect(row.mind_version).toBe(TEST_VERSION);
  }, 60_000);
});
