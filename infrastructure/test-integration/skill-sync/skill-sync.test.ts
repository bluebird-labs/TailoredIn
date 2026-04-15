import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { SkillSyncService } from '../../src/skill-sync/SkillSyncService.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('SkillSyncService', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await setupTestDatabase();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    const conn = orm.em.getConnection();
    // Clean domain tables
    await conn.execute(`DELETE FROM "experience_skills"`, [], 'run');
    await conn.execute(`DELETE FROM "skills"`, [], 'run');
    await conn.execute(`DELETE FROM "skill_categories"`, [], 'run');
    // Clean source tables
    await conn.execute(`DELETE FROM "esco_skill_collections"`, [], 'run');
    await conn.execute(`DELETE FROM "esco_skills"`, [], 'run');
    await conn.execute(`DELETE FROM "mind_skills"`, [], 'run');
    await conn.execute(`DELETE FROM "linguist_languages"`, [], 'run');
    await conn.execute(`DELETE FROM "tanova_skills"`, [], 'run');
  });

  async function seedFixtures(): Promise<void> {
    const conn = orm.em.getConnection();
    const now = new Date();

    // -- Linguist languages (3 rows) --
    await conn.execute(
      `INSERT INTO "linguist_languages" ("linguist_name", "linguist_type", "color", "aliases", "extensions", "interpreters", "linguist_version", "created_at", "updated_at")
       VALUES
         ('JavaScript', 'programming', '#f1e05a', '["JS"]', '[]', '["node", "nodejs"]', 'v1', ?, ?),
         ('TypeScript', 'programming', '#3178c6', '["TS"]', '[]', '["ts-node"]', 'v1', ?, ?),
         ('HTML', 'markup', '#e34c26', '[]', '[]', '[]', 'v1', ?, ?),
         ('JSON', 'data', '#292929', '[]', '[]', '[]', 'v1', ?, ?)`,
      [now, now, now, now, now, now, now, now],
      'run'
    );

    // -- MIND skills (7 rows) --
    // All JSONB array columns except runtime_environments
    const mindCols = `"mind_name", "mind_type", "synonyms", "mind_source_file", "mind_version",
         "technical_domains", "implies_knowing_skills", "implies_knowing_concepts", "conceptual_aspects",
         "architectural_patterns", "supported_programming_languages", "specific_to_frameworks",
         "adapter_for_tool_or_service", "implements_patterns", "associated_to_application_domains",
         "solves_application_tasks", "build_tools", "runtime_environments"`;
    const emptyArrays = `'[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]'`;
    await conn.execute(
      `INSERT INTO "mind_skills" (${mindCols})
       VALUES
         ('JavaScript', '["ProgrammingLanguage"]', '["JS"]', 'programming_languages', 'v1', ${emptyArrays}, '["Node.js", "Deno", "Bun"]'),
         ('React', '["Framework"]', '["React.js", "ReactJS"]', 'frameworks_frontend', 'v1', ${emptyArrays}, '[]'),
         ('PostgreSQL', '["Database"]', '["Postgres"]', 'databases', 'v1', ${emptyArrays}, '[]'),
         ('Docker', '["Tool"]', '[]', 'containerization', 'v1', ${emptyArrays}, '[]'),
         ('TensorFlow', '["Library"]', '["TF"]', 'machine_learning', 'v1', ${emptyArrays}, '[]'),
         ('ExoticThing', '["Tool"]', '[]', 'exotic_things', 'v1', ${emptyArrays}, '[]'),
         ('GraphQL', '["QueryLanguage"]', '["GQL"]', 'query_languages', 'v1', ${emptyArrays}, '[]')`,
      [],
      'run'
    );

    // -- Tanova skills (4 rows) --
    const tanovaDefaults = `'[]', '[]', '[]', '[]', NULL, NULL, '[]', NULL, '[]', 'v1'`;
    await conn.execute(
      `INSERT INTO "tanova_skills" ("tanova_id", "canonical_name", "category", "subcategory", "aliases", "description",
         "tags", "parent_skills", "child_skills", "related_skills", "transferability", "proficiency_levels",
         "typical_roles", "industry_demand", "prerequisites", "tanova_version", "created_at", "updated_at")
       VALUES
         ('t1', 'React', 'technology', 'frontend_frameworks', '["React.js"]', 'A short desc', ${tanovaDefaults}, ?, ?),
         ('t2', 'Agile', 'methodology', 'project_management', '["Agile Methodology"]', 'Agile is an iterative approach to project management and software development that helps teams deliver value faster and with fewer headaches', ${tanovaDefaults}, ?, ?),
         ('t3', 'Team Leadership', 'soft_skill', 'leadership', '["Team Lead"]', 'A short desc', ${tanovaDefaults}, ?, ?),
         ('t4', 'Scrum', 'methodology', 'project_management', '[]', 'Scrum is a medium-length framework description', ${tanovaDefaults}, ?, ?)`,
      [now, now, now, now, now, now, now, now],
      'run'
    );

    // -- ESCO skills (3 rows) --
    await conn.execute(
      `INSERT INTO "esco_skills" ("concept_uri", "concept_type", "skill_type", "preferred_label", "alt_labels", "description", "status", "esco_version", "created_at", "updated_at")
       VALUES
         ('http://esco/skill/adapt', 'KnowledgeSkillCompetence', 'skill/competence', 'adapt to change', 'embrace change|flexibility', 'Ability to adapt to changing circumstances', 'released', '1.2.1', ?, ?),
         ('http://esco/skill/programming', 'KnowledgeSkillCompetence', 'knowledge', 'programming concepts', 'coding principles', 'Understanding of programming fundamentals', 'released', '1.2.1', ?, ?),
         ('http://esco/skill/javascript', 'KnowledgeSkillCompetence', 'knowledge', 'JavaScript', 'JS|ECMAScript', 'JavaScript programming language', 'released', '1.2.1', ?, ?),
         ('http://esco/skill/php', 'KnowledgeSkillCompetence', 'knowledge', 'PHP', E'Hypertext Preprocessor\\nPersonal Home Page|php5', 'PHP programming language', 'released', '1.2.1', ?, ?)`,
      [now, now, now, now, now, now, now, now],
      'run'
    );

    // -- ESCO skill collections (link skills to digital/transversal) --
    await conn.execute(
      `INSERT INTO "esco_skill_collections" ("concept_uri", "collection_type", "concept_type", "preferred_label", "status")
       VALUES
         ('http://esco/skill/adapt', 'transversal', 'KnowledgeSkillCompetence', 'adapt to change', 'released'),
         ('http://esco/skill/programming', 'digital', 'KnowledgeSkillCompetence', 'programming concepts', 'released'),
         ('http://esco/skill/javascript', 'digital', 'KnowledgeSkillCompetence', 'JavaScript', 'released'),
         ('http://esco/skill/php', 'digital', 'KnowledgeSkillCompetence', 'PHP', 'released')`,
      [],
      'run'
    );
  }

  async function runSync(): Promise<void> {
    const connection = orm.em.getConnection();
    const service = new SkillSyncService(connection);
    await service.sync();
  }

  async function querySkills(): Promise<
    {
      label: string;
      normalized_label: string;
      type: string;
      category_id: string | null;
      description: string | null;
      aliases: string;
    }[]
  > {
    return orm.em.getConnection().execute(`SELECT * FROM "skills" ORDER BY "label"`, [], 'all');
  }

  async function queryCategories(): Promise<{ id: string; label: string; normalized_label: string }[]> {
    return orm.em.getConnection().execute(`SELECT * FROM "skill_categories" ORDER BY "label"`, [], 'all');
  }

  async function countTable(table: string): Promise<number> {
    const result = await orm.em.getConnection().execute(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    return result[0].count;
  }

  it('creates all 10 categories', async () => {
    await seedFixtures();
    await runSync();

    const categories = await queryCategories();
    expect(categories.length).toBe(10);

    const labels = categories.map(c => c.label);
    expect(labels).toContain('Programming Languages');
    expect(labels).toContain('Frontend');
    expect(labels).toContain('Backend');
    expect(labels).toContain('Mobile');
    expect(labels).toContain('Databases');
    expect(labels).toContain('Cloud & Infrastructure');
    expect(labels).toContain('DevOps & CI/CD');
    expect(labels).toContain('Testing & Quality');
    expect(labels).toContain('AI & Machine Learning');
    expect(labels).toContain('Architecture & Methodology');
  }, 60_000);

  it('deduplicates JavaScript across Linguist + MIND', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const jsSkills = skills.filter(s => s.normalized_label === 'javascript');
    expect(jsSkills.length).toBe(1);

    const js = jsSkills[0];
    // Linguist label wins (processed first)
    expect(js.label).toBe('JavaScript');
    expect(js.type).toBe('language');

    // Aliases unioned: JS from Linguist+MIND (deduped)
    const aliases = typeof js.aliases === 'string' ? JSON.parse(js.aliases) : js.aliases;
    const aliasLabels = aliases.map((a: { label: string }) => a.label);
    expect(aliasLabels).toContain('JS');
  }, 60_000);

  it('includes React from MIND with aliases', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const reactSkills = skills.filter(s => s.normalized_label === 'react');
    expect(reactSkills.length).toBe(1);

    const react = reactSkills[0];
    expect(react.label).toBe('React');
    expect(react.type).toBe('technology');

    const aliases = typeof react.aliases === 'string' ? JSON.parse(react.aliases) : react.aliases;
    const aliasLabels = aliases.map((a: { label: string }) => a.label);
    expect(aliasLabels).toContain('React.js');
    expect(aliasLabels).toContain('ReactJS');
    // Should not have duplicates
    const normalizedAliases = aliases.map((a: { normalizedLabel: string }) => a.normalizedLabel);
    expect(new Set(normalizedAliases).size).toBe(normalizedAliases.length);
  }, 60_000);

  it('assigns correct categories', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const categories = await queryCategories();
    const categoryById = new Map(categories.map(c => [c.id, c.label]));

    const getCategoryLabel = (skill: { category_id: string | null }) =>
      skill.category_id ? categoryById.get(skill.category_id) : null;

    const js = skills.find(s => s.normalized_label === 'javascript')!;
    expect(getCategoryLabel(js)).toBe('Programming Languages');

    const react = skills.find(s => s.normalized_label === 'react')!;
    expect(getCategoryLabel(react)).toBe('Frontend');

    const docker = skills.find(s => s.normalized_label === 'docker')!;
    expect(getCategoryLabel(docker)).toBe('DevOps & CI/CD');

    const tf = skills.find(s => s.normalized_label === 'tensorflow')!;
    expect(getCategoryLabel(tf)).toBe('AI & Machine Learning');

    const html = skills.find(s => s.normalized_label === 'html')!;
    expect(getCategoryLabel(html)).toBe('Frontend');

    const graphql = skills.find(s => s.normalized_label === 'graphql')!;
    expect(getCategoryLabel(graphql)).toBe('Databases');
  }, 60_000);

  it('only produces LANGUAGE and TECHNOLOGY types from Linguist + MIND', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const types = new Set(skills.map(s => s.type));
    expect(types.has('language')).toBe(true);
    expect(types.has('technology')).toBe(true);
    expect(types.has('interpersonal')).toBe(false);
    expect(types.has('methodology')).toBe(false);
  }, 60_000);

  it('ignores Tanova and ESCO data during sync', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    // Tanova-only skills (Agile, Team Leadership, Scrum) should not appear
    expect(skills.find(s => s.normalized_label === 'agile')).toBeUndefined();
    expect(skills.find(s => s.normalized_label === 'team-leadership')).toBeUndefined();
    expect(skills.find(s => s.normalized_label === 'scrum')).toBeUndefined();
    // ESCO-only skills should not appear
    expect(skills.find(s => s.normalized_label === 'adapt-to-change')).toBeUndefined();
    expect(skills.find(s => s.normalized_label === 'programming-concepts')).toBeUndefined();
    expect(skills.find(s => s.normalized_label === 'php')).toBeUndefined();
  }, 60_000);

  it('excludes Linguist data-type entries from skills', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const json = skills.find(s => s.normalized_label === 'json');
    expect(json).toBeUndefined();
  }, 60_000);

  it('unknown MIND source file results in null category', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const exotic = skills.find(s => s.normalized_label === 'exoticthing')!;
    expect(exotic).toBeDefined();
    expect(exotic.category_id).toBeNull();
  }, 60_000);

  it('is idempotent — running sync twice preserves IDs and counts', async () => {
    await seedFixtures();
    await runSync();

    const skillsBefore = await querySkills();
    const categoriesBefore = await queryCategories();
    const skillIdsBefore = new Set(skillsBefore.map(s => s.normalized_label));
    const categoryIdsBefore = new Map(categoriesBefore.map(c => [c.normalized_label, c.id]));

    // Run again
    await runSync();

    const skillsAfter = await querySkills();
    const categoriesAfter = await queryCategories();

    // Same counts
    expect(skillsAfter.length).toBe(skillsBefore.length);
    expect(categoriesAfter.length).toBe(categoriesBefore.length);

    // Same category IDs preserved (ON CONFLICT preserves id)
    for (const cat of categoriesAfter) {
      expect(categoryIdsBefore.get(cat.normalized_label)).toBe(cat.id);
    }

    // Same skill normalized_labels exist
    const skillIdsAfter = new Set(skillsAfter.map(s => s.normalized_label));
    expect(skillIdsAfter).toEqual(skillIdsBefore);
  }, 60_000);

  it('does not touch experience_skills table', async () => {
    await seedFixtures();
    await runSync();

    const count = await countTable('experience_skills');
    expect(count).toBe(0);
  }, 60_000);
});
