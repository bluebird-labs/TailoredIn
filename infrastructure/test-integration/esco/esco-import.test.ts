import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import Path from 'node:path';
import type { MikroORM } from '@mikro-orm/postgresql';
import { EscoCsvParser } from '../../src/esco/EscoCsvParser.js';
import { EscoDatasetParser } from '../../src/esco/EscoDatasetParser.js';
import { EscoDirectoryLoader } from '../../src/esco/EscoDirectoryLoader.js';
import { EscoImporter } from '../../src/esco/EscoImporter.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

const FIXTURES_DIR = Path.resolve(
  import.meta.dirname,
  '../../test/esco/fixtures/esco-dataset-v1.2.1-classification-en-csv'
);

describe('EscoImporter', () => {
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

    // Fixture CSVs are incomplete subsets — disable FK checks during import
    await connection.execute(`SET session_replication_role = 'replica'`);

    const loader = new EscoDirectoryLoader();
    const directory = await loader.load(FIXTURES_DIR);
    const parser = new EscoDatasetParser(new EscoCsvParser());
    const dataset = await parser.parse(directory);

    const importer = new EscoImporter(connection);
    await importer.importAll(dataset);

    await connection.execute(`SET session_replication_role = 'origin'`);
  }

  test('imports all tables from fixture data', async () => {
    await runImport();

    const skills = await countTable('esco_skills');
    const occupations = await countTable('esco_occupations');
    const iscoGroups = await countTable('esco_isco_groups');
    const skillGroups = await countTable('esco_skill_groups');
    const conceptSchemes = await countTable('esco_concept_schemes');
    const dictionary = await countTable('esco_dictionary');
    const occSkillRels = await countTable('esco_occupation_skill_relations');
    const skillSkillRels = await countTable('esco_skill_skill_relations');
    const broaderOcc = await countTable('esco_broader_relations_occ_pillar');
    const broaderSkill = await countTable('esco_broader_relations_skill_pillar');
    const hierarchy = await countTable('esco_skills_hierarchy');
    const skillColls = await countTable('esco_skill_collections');
    const occColls = await countTable('esco_occupation_collections');
    const greenShare = await countTable('esco_green_share_occupations');

    // All concept tables should have rows
    expect(skills).toBeGreaterThan(0);
    expect(occupations).toBeGreaterThan(0);
    expect(iscoGroups).toBeGreaterThan(0);
    expect(skillGroups).toBeGreaterThan(0);
    expect(conceptSchemes).toBeGreaterThan(0);
    expect(dictionary).toBeGreaterThan(0);

    // Relationship tables
    expect(occSkillRels).toBeGreaterThan(0);
    expect(skillSkillRels).toBeGreaterThan(0);
    expect(broaderOcc).toBeGreaterThan(0);
    expect(broaderSkill).toBeGreaterThan(0);
    expect(hierarchy).toBeGreaterThan(0);

    // Collection tables
    expect(skillColls).toBeGreaterThan(0);
    expect(occColls).toBeGreaterThan(0);
    expect(greenShare).toBeGreaterThan(0);
  }, 60_000);

  test('import is idempotent — running twice yields same row counts', async () => {
    // First import already happened in previous test
    const countsBefore: Record<string, number> = {};
    const tables = [
      'esco_skills',
      'esco_occupations',
      'esco_isco_groups',
      'esco_skill_groups',
      'esco_concept_schemes',
      'esco_dictionary',
      'esco_occupation_skill_relations',
      'esco_skill_skill_relations',
      'esco_broader_relations_occ_pillar',
      'esco_broader_relations_skill_pillar',
      'esco_skills_hierarchy',
      'esco_skill_collections',
      'esco_occupation_collections',
      'esco_green_share_occupations'
    ];

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

  test('skill collections have correct collection_type discriminator values', async () => {
    const result = await orm.em
      .getConnection()
      .execute(`SELECT DISTINCT "collection_type" FROM "esco_skill_collections" ORDER BY "collection_type"`);
    const types = result.map((r: { collection_type: string }) => r.collection_type);

    expect(types).toContain('green');
    expect(types).toContain('digital');
    expect(types).toContain('digcomp');
    expect(types).toContain('transversal');
    expect(types).toContain('language');
    expect(types).toContain('research');
  }, 60_000);

  test('FK constraints exist on relationship tables', async () => {
    const fkQuery = `
      SELECT tc.table_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name LIKE 'esco_%'
      ORDER BY tc.table_name, tc.constraint_name
    `;
    const fks = await orm.em.getConnection().execute(fkQuery);
    const fkNames = fks.map((r: { constraint_name: string }) => r.constraint_name);

    expect(fkNames).toContain('esco_osr_occupation_fk');
    expect(fkNames).toContain('esco_osr_skill_fk');
    expect(fkNames).toContain('esco_ssr_original_fk');
    expect(fkNames).toContain('esco_ssr_related_fk');
    expect(fkNames).toContain('esco_sc_skill_fk');
    expect(fkNames).toContain('esco_oc_occupation_fk');
  }, 60_000);
});
