import type { Connection } from '@mikro-orm/postgresql';
import { Logger, normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '@tailoredin/domain';
import { SkillType } from '@tailoredin/domain';

const BATCH_SIZE = 500;

type CandidateSkill = {
  label: string;
  normalizedLabel: string;
  type: SkillType;
  categoryNormalizedLabel: string | null;
  description: string | null;
  aliases: SkillAlias[];
  sourcePriority: number;
};

const CATEGORIES: { label: string; normalizedLabel: string }[] = [
  { label: 'Programming Languages', normalizedLabel: 'programming-languages' },
  { label: 'Frontend', normalizedLabel: 'frontend' },
  { label: 'Backend', normalizedLabel: 'backend' },
  { label: 'Mobile', normalizedLabel: 'mobile' },
  { label: 'Databases', normalizedLabel: 'databases' },
  { label: 'Cloud & Infrastructure', normalizedLabel: 'cloud-infrastructure' },
  { label: 'DevOps & CI/CD', normalizedLabel: 'devops-ci-cd' },
  { label: 'Testing & Quality', normalizedLabel: 'testing-quality' },
  { label: 'AI & Machine Learning', normalizedLabel: 'ai-machine-learning' },
  { label: 'Architecture & Methodology', normalizedLabel: 'architecture-methodology' },
  { label: 'Leadership & Communication', normalizedLabel: 'leadership-communication' }
];

const SOURCE_TO_CATEGORY: Record<string, string> = {
  // MIND source files
  programming_languages: 'programming-languages',
  markup_languages: 'frontend',
  frameworks_frontend: 'frontend',
  frameworks_mobile: 'mobile',
  frameworks_backend: 'backend',
  frameworks_fullstack: 'backend',
  libraries_ui: 'frontend',
  libraries_data: 'ai-machine-learning',
  protocols: 'backend',
  runtime_environments: 'backend',
  databases: 'databases',
  databases_nosql: 'databases',
  cloud_services: 'cloud-infrastructure',
  cloud_platforms: 'cloud-infrastructure',
  infrastructure: 'cloud-infrastructure',
  operating_systems: 'cloud-infrastructure',
  containerization: 'devops-ci-cd',
  ci_cd: 'devops-ci-cd',
  devops: 'devops-ci-cd',
  build_tools: 'devops-ci-cd',
  package_managers: 'devops-ci-cd',
  version_control: 'devops-ci-cd',
  ides: 'devops-ci-cd',
  testing: 'testing-quality',
  machine_learning: 'ai-machine-learning',
  ai_tools: 'ai-machine-learning',
  data_science: 'ai-machine-learning',
  libraries_csharp: 'backend',
  libraries_java: 'backend',
  // biome-ignore lint/style/useNamingConvention: exact MIND source_file keys
  libraries_frontend_UI: 'frontend',
  // biome-ignore lint/style/useNamingConvention: exact MIND source_file keys
  libraries_mobile_UI: 'mobile',
  webservers: 'backend',
  libraries_javascript: 'frontend',
  libraries_kotlin: 'mobile',
  services: 'cloud-infrastructure',
  libraries_python: 'backend',
  tools: 'devops-ci-cd',
  'libraries_-various': 'backend',
  architectural_patterns: 'architecture-methodology',
  design_patterns: 'architecture-methodology',
  // Tanova subcategories
  frontend_frameworks: 'frontend',
  backend_frameworks: 'backend',
  mobile_development: 'mobile',
  project_management: 'architecture-methodology',
  query_languages: 'databases',
  leadership: 'leadership-communication',
  management: 'leadership-communication',
  software_architecture: 'architecture-methodology',
  architecture: 'architecture-methodology',
  ai_ml: 'ai-machine-learning',
  product_management: 'leadership-communication',
  frontend_development: 'frontend',
  backend_development: 'backend',
  data_infrastructure: 'cloud-infrastructure'
};

export class SkillSyncService {
  private readonly log = Logger.create('skill-sync');

  public constructor(private readonly connection: Connection) {}

  public async sync(): Promise<void> {
    const totalStart = performance.now();

    // Phase 1: Upsert categories
    const categoryMap = await this.upsertCategories();
    this.log.info(`Categories: ${categoryMap.size} upserted`);

    // Phase 2: Read all sources
    const linguist = await this.readLinguistLanguages();
    this.log.info(`Linguist: ${linguist.length} candidates`);

    const mind = await this.readMindSkills();
    this.log.info(`MIND: ${mind.length} candidates`);

    const tanova = await this.readTanovaSkills();
    this.log.info(`Tanova: ${tanova.length} candidates`);

    const esco = await this.readEscoSkills();
    this.log.info(`ESCO: ${esco.length} candidates`);

    // Phase 3: Deduplicate
    const allCandidates = [...linguist, ...mind, ...tanova, ...esco];
    const deduplicated = this.deduplicateSkills(allCandidates);
    this.log.info(`Deduplicated: ${allCandidates.length} candidates -> ${deduplicated.length} unique skills`);

    // Phase 4: Upsert skills
    await this.upsertSkills(deduplicated, categoryMap);
    this.log.info(`Skills: ${deduplicated.length} upserted`);

    const elapsed = ((performance.now() - totalStart) / 1000).toFixed(2);
    this.log.info(`Done in ${elapsed}s`);
  }

  /**
   * Deletes all skills and skill categories. Clears experience_skills first
   * because it has a non-cascading FK to skills.
   */
  public async reset(): Promise<void> {
    this.log.info('Resetting skills data...');
    await this.connection.execute('DELETE FROM "experience_skills"', [], 'run');
    await this.connection.execute('DELETE FROM "skills"', [], 'run');
    await this.connection.execute('DELETE FROM "skill_categories"', [], 'run');
    this.log.info('Reset complete — experience_skills, skills, and skill_categories cleared');
  }

  // ---------------------------------------------------------------------------
  // Phase 1: Category upsert
  // ---------------------------------------------------------------------------

  private async upsertCategories(): Promise<Map<string, string>> {
    const now = new Date();
    const rows = CATEGORIES.map(c => [crypto.randomUUID(), c.label, c.normalizedLabel, now, now]);

    await this.batchUpsert(
      'skill_categories',
      ['id', 'label', 'normalized_label', 'created_at', 'updated_at'],
      ['normalized_label'],
      rows
    );

    const result = await this.connection.execute(`SELECT "id", "normalized_label" FROM "skill_categories"`, [], 'all');
    const map = new Map<string, string>();
    for (const row of result) {
      map.set(row.normalized_label, row.id);
    }
    return map;
  }

  // ---------------------------------------------------------------------------
  // Phase 2: Source readers
  // ---------------------------------------------------------------------------

  private async readLinguistLanguages(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT "linguist_name", "linguist_type", "aliases"
       FROM "linguist_languages"
       WHERE "linguist_type" IN ('programming', 'markup')`,
      [],
      'all'
    );

    return rows.map((row: { linguist_name: string; linguist_type: string; aliases: string[] }) => {
      const aliases: SkillAlias[] = (row.aliases ?? []).map((a: string) => ({
        label: a,
        normalizedLabel: normalizeLabel(a)
      }));

      return {
        label: row.linguist_name,
        normalizedLabel: normalizeLabel(row.linguist_name),
        type: row.linguist_type === 'programming' ? SkillType.LANGUAGE : SkillType.TECHNOLOGY,
        categoryNormalizedLabel: row.linguist_type === 'programming' ? 'programming-languages' : 'frontend',
        description: null,
        aliases,
        sourcePriority: 1
      };
    });
  }

  private async readMindSkills(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT "mind_name", "mind_type", "synonyms", "mind_source_file" FROM "mind_skills"`,
      [],
      'all'
    );

    return rows.map(
      (row: {
        mind_name: string;
        mind_type: string[] | string;
        synonyms: string[] | string;
        mind_source_file: string;
      }) => {
        const mindType: string[] = typeof row.mind_type === 'string' ? JSON.parse(row.mind_type) : row.mind_type;
        const synonyms: string[] = typeof row.synonyms === 'string' ? JSON.parse(row.synonyms) : (row.synonyms ?? []);

        const aliases: SkillAlias[] = synonyms.map((s: string) => ({
          label: s,
          normalizedLabel: normalizeLabel(s)
        }));

        return {
          label: row.mind_name,
          normalizedLabel: normalizeLabel(row.mind_name),
          type: mindType.includes('ProgrammingLanguage') ? SkillType.LANGUAGE : SkillType.TECHNOLOGY,
          categoryNormalizedLabel: SOURCE_TO_CATEGORY[row.mind_source_file] ?? null,
          description: null,
          aliases,
          sourcePriority: 2
        };
      }
    );
  }

  private async readTanovaSkills(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT "canonical_name", "category", "subcategory", "aliases", "description" FROM "tanova_skills"`,
      [],
      'all'
    );

    return rows.map(
      (row: {
        canonical_name: string;
        category: string;
        subcategory: string;
        aliases: string[] | string;
        description: string | null;
      }) => {
        const aliases: string[] = typeof row.aliases === 'string' ? JSON.parse(row.aliases) : (row.aliases ?? []);

        let type: SkillType;
        if (row.category === 'technology' && row.subcategory === 'programming_languages') {
          type = SkillType.LANGUAGE;
        } else if (row.category === 'technology') {
          type = SkillType.TECHNOLOGY;
        } else if (row.category === 'methodology') {
          type = SkillType.METHODOLOGY;
        } else if (row.category === 'soft_skill') {
          type = SkillType.INTERPERSONAL;
        } else {
          type = SkillType.TECHNOLOGY;
        }

        return {
          label: row.canonical_name,
          normalizedLabel: normalizeLabel(row.canonical_name),
          type,
          categoryNormalizedLabel: SOURCE_TO_CATEGORY[row.subcategory] ?? null,
          description: row.description ?? null,
          aliases: aliases.map((a: string) => ({ label: a, normalizedLabel: normalizeLabel(a) })),
          sourcePriority: 3
        };
      }
    );
  }

  private async readEscoSkills(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT es."preferred_label", es."skill_type", es."alt_labels", es."description",
              array_agg(DISTINCT esc."collection_type") AS "collection_types"
       FROM "esco_skills" es
       INNER JOIN "esco_skill_collections" esc ON es."concept_uri" = esc."concept_uri"
       WHERE esc."collection_type" IN ('digital', 'transversal')
       GROUP BY es."concept_uri", es."preferred_label", es."skill_type", es."alt_labels", es."description"`,
      [],
      'all'
    );

    return rows.map(
      (row: {
        preferred_label: string;
        skill_type: string;
        alt_labels: string | null;
        description: string | null;
        collection_types: string | string[];
      }) => {
        const collectionTypes: string[] =
          typeof row.collection_types === 'string'
            ? row.collection_types.replace(/[{}]/g, '').split(',')
            : row.collection_types;
        const isTransversal = collectionTypes.includes('transversal');

        const altLabels = row.alt_labels
          ? row.alt_labels
              .split('|')
              .flatMap(s => s.split('\n'))
              .map(s => s.trim())
              .filter(s => s.length > 0)
          : [];

        return {
          label: row.preferred_label,
          normalizedLabel: normalizeLabel(row.preferred_label),
          type: isTransversal ? SkillType.INTERPERSONAL : SkillType.TECHNOLOGY,
          categoryNormalizedLabel: isTransversal ? 'leadership-communication' : null,
          description: row.description ?? null,
          aliases: altLabels.map((a: string) => ({ label: a, normalizedLabel: normalizeLabel(a) })),
          sourcePriority: 4
        };
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Phase 3: Deduplication
  // ---------------------------------------------------------------------------

  private deduplicateSkills(candidates: CandidateSkill[]): CandidateSkill[] {
    const byNormalizedLabel = new Map<string, CandidateSkill>();
    const aliasIndex = new Map<string, string>();

    for (const candidate of candidates) {
      const match = this.findMatch(candidate, byNormalizedLabel, aliasIndex);

      if (match) {
        const newAliases = this.mergeInto(match, candidate);
        for (const alias of newAliases) {
          aliasIndex.set(alias, match.normalizedLabel);
        }
      } else {
        byNormalizedLabel.set(candidate.normalizedLabel, candidate);
        for (const alias of candidate.aliases) {
          if (alias.normalizedLabel !== candidate.normalizedLabel) {
            aliasIndex.set(alias.normalizedLabel, candidate.normalizedLabel);
          }
        }
      }
    }

    return [...byNormalizedLabel.values()];
  }

  private findMatch(
    candidate: CandidateSkill,
    byNormalizedLabel: Map<string, CandidateSkill>,
    aliasIndex: Map<string, string>
  ): CandidateSkill | null {
    // 1. Direct match by normalizedLabel
    const direct = byNormalizedLabel.get(candidate.normalizedLabel);
    if (direct) return direct;

    // 2. Candidate's normalizedLabel is an alias of an existing skill
    const ownerKey = aliasIndex.get(candidate.normalizedLabel);
    if (ownerKey) {
      const owner = byNormalizedLabel.get(ownerKey);
      if (owner) return owner;
    }

    // 3. Candidate's aliases match an existing skill's normalizedLabel
    for (const alias of candidate.aliases) {
      const aliasMatch = byNormalizedLabel.get(alias.normalizedLabel);
      if (aliasMatch) return aliasMatch;
    }

    // 4. Candidate's aliases match an existing alias
    for (const alias of candidate.aliases) {
      const aliasOwnerKey = aliasIndex.get(alias.normalizedLabel);
      if (aliasOwnerKey) {
        const aliasOwner = byNormalizedLabel.get(aliasOwnerKey);
        if (aliasOwner) return aliasOwner;
      }
    }

    return null;
  }

  /**
   * Merge candidate into existing skill. Returns newly-added alias normalizedLabels
   * so the caller can register them in the aliasIndex.
   */
  private mergeInto(existing: CandidateSkill, candidate: CandidateSkill): string[] {
    // Description: longest non-null wins
    if (
      candidate.description &&
      (!existing.description || candidate.description.length > existing.description.length)
    ) {
      existing.description = candidate.description;
    }

    // Category: keep first non-null
    if (!existing.categoryNormalizedLabel && candidate.categoryNormalizedLabel) {
      existing.categoryNormalizedLabel = candidate.categoryNormalizedLabel;
    }

    // Aliases: union by normalizedLabel
    const existingAliasSet = new Set(existing.aliases.map(a => a.normalizedLabel));
    const newAliases: string[] = [];

    // Add candidate's primary label as alias if different from existing's primary
    if (candidate.normalizedLabel !== existing.normalizedLabel && !existingAliasSet.has(candidate.normalizedLabel)) {
      existing.aliases.push({ label: candidate.label, normalizedLabel: candidate.normalizedLabel });
      existingAliasSet.add(candidate.normalizedLabel);
      newAliases.push(candidate.normalizedLabel);
    }

    // Union in candidate's aliases
    for (const alias of candidate.aliases) {
      if (alias.normalizedLabel !== existing.normalizedLabel && !existingAliasSet.has(alias.normalizedLabel)) {
        existing.aliases.push(alias);
        existingAliasSet.add(alias.normalizedLabel);
        newAliases.push(alias.normalizedLabel);
      }
    }

    return newAliases;
  }

  // ---------------------------------------------------------------------------
  // Phase 4: Skill upsert
  // ---------------------------------------------------------------------------

  /**
   * Upserts deduplicated skills into the `skills` table.
   *
   * Idempotency note: re-running sync fully overwrites label, type, category_id,
   * description, and aliases for every matched skill. This is intentional — the sync
   * is a bootstrap tool, not an ongoing sync. No user-edited skills exist yet. If
   * user-editable skills are added later, an `is_user_modified` flag should gate
   * the upsert.
   */
  private async upsertSkills(skills: CandidateSkill[], categoryMap: Map<string, string>): Promise<void> {
    const now = new Date();
    const rows = skills.map(s => [
      crypto.randomUUID(),
      s.label,
      s.normalizedLabel,
      s.type,
      s.categoryNormalizedLabel ? (categoryMap.get(s.categoryNormalizedLabel) ?? null) : null,
      s.description,
      JSON.stringify(s.aliases),
      now,
      now
    ]);

    await this.batchUpsert(
      'skills',
      ['id', 'label', 'normalized_label', 'type', 'category_id', 'description', 'aliases', 'created_at', 'updated_at'],
      ['normalized_label'],
      rows
    );
  }

  // ---------------------------------------------------------------------------
  // Batch upsert helper
  // ---------------------------------------------------------------------------

  private async batchUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
    rows: unknown[][]
  ): Promise<void> {
    if (rows.length === 0) return;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await this.executeBatch(table, columns, conflictColumns, batch);
    }
  }

  private async executeBatch(
    table: string,
    columns: string[],
    conflictColumns: string[],
    rows: unknown[][]
  ): Promise<void> {
    if (rows.length === 0) return;

    const colList = columns.map(c => `"${c}"`).join(', ');
    const conflictList = conflictColumns.map(c => `"${c}"`).join(', ');
    const updateCols = columns.filter(c => !conflictColumns.includes(c) && c !== 'id' && c !== 'created_at');
    const updateSet = updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

    const params: unknown[] = [];
    const valueTuples: string[] = [];
    for (const row of rows) {
      const placeholders = row.map(val => {
        params.push(val);
        return '?';
      });
      valueTuples.push(`(${placeholders.join(', ')})`);
    }

    let sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueTuples.join(', ')}`;
    if (updateSet) {
      sql += ` ON CONFLICT (${conflictList}) DO UPDATE SET ${updateSet}`;
    } else {
      sql += ` ON CONFLICT (${conflictList}) DO NOTHING`;
    }

    await this.connection.execute(sql, params, 'run');
  }
}
