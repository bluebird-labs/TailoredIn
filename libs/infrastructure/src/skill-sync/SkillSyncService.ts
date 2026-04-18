import type { Connection } from '@mikro-orm/postgresql';
import { Logger, normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '@tailoredin/domain';

const BATCH_SIZE = 500;

const MIND_TYPE_TO_KIND: Record<string, string> = {
  ProgrammingLanguage: 'programming_language',
  MarkupLanguage: 'markup_language',
  Framework: 'framework',
  Library: 'library',
  Database: 'database',
  Tool: 'tool',
  Webserver: 'tool',
  Service: 'service',
  Protocol: 'protocol',
  QueryLanguage: 'query_language'
};

const MULTI_TYPE_OVERRIDES: Record<string, string> = {
  Docker: 'tool',
  Realm: 'database',
  'Flux CD': 'tool',
  'Fabric8 Kubernetes Client': 'library'
};

const SOURCE_FILE_TO_CATEGORY: Record<string, string> = {
  programming_languages: 'Programming Languages',
  markup_languages: 'Markup Languages',
  frameworks_frontend: 'Frontend Frameworks',
  frameworks_backend: 'Backend Frameworks',
  frameworks_mobile: 'Mobile Frameworks',
  frameworks_fullstack: 'Fullstack Frameworks',
  libraries_javascript: 'JavaScript Libraries',
  libraries_python: 'Python Libraries',
  libraries_java: 'Java Libraries',
  libraries_csharp: 'C# Libraries',
  libraries_kotlin: 'Kotlin Libraries',
  // biome-ignore lint/style/useNamingConvention: exact MIND source_file key
  libraries_frontend_UI: 'Frontend UI Libraries',
  // biome-ignore lint/style/useNamingConvention: exact MIND source_file key
  libraries_mobile_UI: 'Mobile UI Libraries',
  'libraries_-various': 'General Libraries',
  databases: 'Relational Databases',
  databases_nosql: 'NoSQL Databases',
  query_languages: 'Query Languages',
  services: 'Services',
  cloud_services: 'Cloud Services',
  cloud_platforms: 'Cloud Platforms',
  infrastructure: 'Infrastructure',
  operating_systems: 'Operating Systems',
  containerization: 'Containerization',
  ci_cd: 'CI/CD',
  devops: 'DevOps',
  build_tools: 'Build Tools',
  package_managers: 'Package Managers',
  version_control: 'Version Control',
  ides: 'IDEs',
  tools: 'Developer Tools',
  testing: 'Testing',
  machine_learning: 'Machine Learning',
  ai_tools: 'AI Tools',
  data_science: 'Data Science',
  protocols: 'Protocols',
  webservers: 'Web Servers',
  runtime_environments: 'Runtime Environments',
  architectural_patterns: 'Architectural Patterns',
  design_patterns: 'Design Patterns'
};

const CONCEPT_FILE_TO_KIND: Record<string, string> = {
  architectural_patterns: 'architectural_pattern',
  application_tasks: 'application_task',
  application_domains: 'application_domain',
  conceptual_aspects: 'conceptual_aspect',
  technical_domains: 'technical_domain',
  vertical_domains: 'vertical_domain',
  skill_deployment_types: 'deployment_type'
};

type CandidateSkill = {
  label: string;
  normalizedLabel: string;
  kind: string;
  categoryLabel: string | null;
  description: string | null;
  aliases: SkillAlias[];
  mindName: string | null;
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  runtimeEnvironments: string[] | null;
  buildTools: string[] | null;
  paradigms: string[] | null;
  supportedLanguages: string[] | null;
  specificToFrameworks: string[] | null;
  adapterForToolOrService: string[] | null;
  implementsPatterns: string[] | null;
  solvesApplicationTasks: string[] | null;
  associatedApplicationDomains: string[] | null;
  deploymentTypes: string[] | null;
  groups: string[] | null;
  sourcePriority: number;
};

function parseJsonb<T>(val: T[] | string | null | undefined): T[] {
  if (val == null) return [];
  if (typeof val === 'string') return JSON.parse(val);
  return val;
}

function resolveKind(mindName: string, mindTypes: string[]): string {
  if (MULTI_TYPE_OVERRIDES[mindName]) return MULTI_TYPE_OVERRIDES[mindName];
  for (const t of mindTypes) {
    const kind = MIND_TYPE_TO_KIND[t];
    if (kind) return kind;
  }
  return 'tool';
}

export class SkillSyncService {
  private readonly log = Logger.create('skill-sync');

  public constructor(private readonly connection: Connection) {}

  public async sync(): Promise<void> {
    const totalStart = performance.now();

    const categoryMap = await this.upsertCategories();
    this.log.info(`Categories: ${categoryMap.size} upserted`);

    const skillMap = await this.upsertSkills(categoryMap);
    this.log.info(`Skills: ${skillMap.size} upserted`);

    const conceptMap = await this.upsertConcepts();
    this.log.info(`Concepts: ${conceptMap.size} upserted`);

    const skillDepCount = await this.resolveSkillDependencies(skillMap);
    this.log.info(`Skill dependencies: ${skillDepCount} resolved`);

    const conceptDepCount = await this.resolveConceptDependencies(skillMap, conceptMap);
    this.log.info(`Concept dependencies: ${conceptDepCount} resolved`);

    const elapsed = ((performance.now() - totalStart) / 1000).toFixed(2);
    this.log.info(`Done in ${elapsed}s`);
  }

  public async reset(): Promise<void> {
    this.log.info('Resetting skills data...');
    await this.connection.execute('DELETE FROM "concept_dependencies"', [], 'run');
    await this.connection.execute('DELETE FROM "skill_dependencies"', [], 'run');
    await this.connection.execute('DELETE FROM "concepts"', [], 'run');
    await this.connection.execute('DELETE FROM "experience_skills"', [], 'run');
    await this.connection.execute('DELETE FROM "skills"', [], 'run');
    await this.connection.execute('DELETE FROM "skill_categories"', [], 'run');
    this.log.info('Reset complete');
  }

  // ---- Phase 1: Upsert categories ----

  private async upsertCategories(): Promise<Map<string, string>> {
    const categoryLabels = new Set(Object.values(SOURCE_FILE_TO_CATEGORY));
    const now = new Date();
    const rows = [...categoryLabels].map(label => [crypto.randomUUID(), label, normalizeLabel(label), null, now, now]);

    await this.batchUpsert(
      'skill_categories',
      ['id', 'label', 'normalized_label', 'parent_id', 'created_at', 'updated_at'],
      ['normalized_label'],
      rows
    );

    const result = await this.connection.execute(`SELECT "id", "label" FROM "skill_categories"`, [], 'all');
    return new Map(result.map((r: { id: string; label: string }) => [r.label, r.id]));
  }

  // ---- Phase 2: Upsert skills ----

  private async upsertSkills(categoryMap: Map<string, string>): Promise<Map<string, string>> {
    const linguist = await this.readLinguistLanguages();
    this.log.info(`Linguist: ${linguist.length} candidates`);

    const mind = await this.readMindSkills();
    this.log.info(`MIND: ${mind.length} candidates`);

    const allCandidates = [...linguist, ...mind];
    const deduplicated = this.deduplicateSkills(allCandidates);
    this.log.info(`Deduplicated: ${allCandidates.length} -> ${deduplicated.length} unique skills`);

    const now = new Date();
    const rows = deduplicated.map(s => [
      crypto.randomUUID(),
      s.label,
      s.normalizedLabel,
      s.kind,
      s.categoryLabel ? (categoryMap.get(s.categoryLabel) ?? null) : null,
      s.description,
      JSON.stringify(s.aliases),
      JSON.stringify(s.technicalDomains),
      JSON.stringify(s.conceptualAspects),
      JSON.stringify(s.architecturalPatterns),
      s.mindName,
      s.runtimeEnvironments ? JSON.stringify(s.runtimeEnvironments) : null,
      s.buildTools ? JSON.stringify(s.buildTools) : null,
      s.paradigms ? JSON.stringify(s.paradigms) : null,
      s.supportedLanguages ? JSON.stringify(s.supportedLanguages) : null,
      s.specificToFrameworks ? JSON.stringify(s.specificToFrameworks) : null,
      s.adapterForToolOrService ? JSON.stringify(s.adapterForToolOrService) : null,
      s.implementsPatterns ? JSON.stringify(s.implementsPatterns) : null,
      s.solvesApplicationTasks ? JSON.stringify(s.solvesApplicationTasks) : null,
      s.associatedApplicationDomains ? JSON.stringify(s.associatedApplicationDomains) : null,
      s.deploymentTypes ? JSON.stringify(s.deploymentTypes) : null,
      s.groups ? JSON.stringify(s.groups) : null,
      now,
      now
    ]);

    await this.batchUpsert(
      'skills',
      [
        'id',
        'label',
        'normalized_label',
        'kind',
        'category_id',
        'description',
        'aliases',
        'technical_domains',
        'conceptual_aspects',
        'architectural_patterns',
        'mind_name',
        'runtime_environments',
        'build_tools',
        'paradigms',
        'supported_languages',
        'specific_to_frameworks',
        'adapter_for_tool_or_service',
        'implements_patterns',
        'solves_application_tasks',
        'associated_application_domains',
        'deployment_types',
        'groups',
        'created_at',
        'updated_at'
      ],
      ['normalized_label'],
      rows
    );

    const result = await this.connection.execute(
      `SELECT "id", "mind_name" FROM "skills" WHERE "mind_name" IS NOT NULL`,
      [],
      'all'
    );
    const skillMap = new Map<string, string>();
    for (const row of result as { id: string; mind_name: string }[]) {
      skillMap.set(row.mind_name, row.id);
    }
    return skillMap;
  }

  private async readLinguistLanguages(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT "linguist_name", "linguist_type", "aliases"
       FROM "linguist_languages"
       WHERE "linguist_type" IN ('programming', 'markup')`,
      [],
      'all'
    );

    return rows.map((row: { linguist_name: string; linguist_type: string; aliases: string[] | string }) => {
      const rawAliases = parseJsonb(row.aliases as string[]);
      const aliases: SkillAlias[] = rawAliases.map((a: string) => ({
        label: a,
        normalizedLabel: normalizeLabel(a)
      }));
      const kind = row.linguist_type === 'programming' ? 'programming_language' : 'markup_language';
      const categoryLabel = row.linguist_type === 'programming' ? 'Programming Languages' : 'Markup Languages';

      return {
        label: row.linguist_name,
        normalizedLabel: normalizeLabel(row.linguist_name),
        kind,
        categoryLabel,
        description: null,
        aliases,
        mindName: null,
        technicalDomains: [],
        conceptualAspects: [],
        architecturalPatterns: [],
        runtimeEnvironments: kind === 'programming_language' ? [] : null,
        buildTools: kind === 'programming_language' ? [] : null,
        paradigms: kind === 'programming_language' ? [] : null,
        supportedLanguages: null,
        specificToFrameworks: null,
        adapterForToolOrService: null,
        implementsPatterns: null,
        solvesApplicationTasks: null,
        associatedApplicationDomains: null,
        deploymentTypes: null,
        groups: null,
        sourcePriority: 1
      };
    });
  }

  private async readMindSkills(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(`SELECT * FROM "mind_skills"`, [], 'all');

    return rows.map((row: Record<string, unknown>) => {
      const mindName = row.mind_name as string;
      const mindTypes = parseJsonb(row.mind_type as string[]);
      const synonyms = parseJsonb(row.synonyms as string[]);
      const sourceFile = row.mind_source_file as string;
      const kind = resolveKind(mindName, mindTypes);

      const aliases: SkillAlias[] = synonyms.map((s: string) => ({
        label: s,
        normalizedLabel: normalizeLabel(s)
      }));

      const categoryLabel = SOURCE_FILE_TO_CATEGORY[sourceFile] ?? null;
      const technicalDomains = parseJsonb(row.technical_domains as string[]);
      const conceptualAspects = parseJsonb(row.conceptual_aspects as string[]);
      const architecturalPatterns = parseJsonb(row.architectural_patterns as string[]);

      const paradigmKeywords = [
        'Object-Oriented',
        'Functional',
        'Imperative',
        'Declarative',
        'Procedural',
        'Logic',
        'Concurrent',
        'Event-Driven',
        'Reactive',
        'Multi-Paradigm',
        'Prototype-Based',
        'Aspect-Oriented',
        'Metaprogramming',
        'Generic'
      ];

      return {
        label: mindName,
        normalizedLabel: normalizeLabel(mindName),
        kind,
        categoryLabel,
        description: null,
        aliases,
        mindName,
        technicalDomains,
        conceptualAspects,
        architecturalPatterns,
        runtimeEnvironments: kind === 'programming_language' ? parseJsonb(row.runtime_environments as string[]) : null,
        buildTools: kind === 'programming_language' ? parseJsonb(row.build_tools as string[]) : null,
        paradigms: kind === 'programming_language' ? conceptualAspects.filter(a => paradigmKeywords.includes(a)) : null,
        supportedLanguages: ['framework', 'library'].includes(kind)
          ? parseJsonb(row.supported_programming_languages as string[])
          : null,
        specificToFrameworks: kind === 'library' ? parseJsonb(row.specific_to_frameworks as string[]) : null,
        adapterForToolOrService: kind === 'library' ? parseJsonb(row.adapter_for_tool_or_service as string[]) : null,
        implementsPatterns: kind === 'library' ? parseJsonb(row.implements_patterns as string[]) : null,
        solvesApplicationTasks: ['framework', 'library', 'database', 'tool', 'service', 'protocol'].includes(kind)
          ? parseJsonb(row.solves_application_tasks as string[])
          : null,
        associatedApplicationDomains: ['framework', 'library', 'database', 'tool', 'service', 'protocol'].includes(kind)
          ? parseJsonb(row.associated_to_application_domains as string[])
          : null,
        deploymentTypes: ['tool', 'service'].includes(kind) ? [] : null,
        groups: kind === 'service' ? [] : null,
        sourcePriority: 2
      };
    });
  }

  // ---- Deduplication ----

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
    // Direct label match always merges (same canonical name = same skill)
    const direct = byNormalizedLabel.get(candidate.normalizedLabel);
    if (direct) return direct;

    // Alias-based matches only merge within the same kind — prevents
    // e.g. Node.js (tool) from being swallowed by JavaScript (programming_language)
    const ownerKey = aliasIndex.get(candidate.normalizedLabel);
    if (ownerKey) {
      const owner = byNormalizedLabel.get(ownerKey);
      if (owner && owner.kind === candidate.kind) return owner;
    }

    for (const alias of candidate.aliases) {
      const aliasMatch = byNormalizedLabel.get(alias.normalizedLabel);
      if (aliasMatch && aliasMatch.kind === candidate.kind) return aliasMatch;
    }

    for (const alias of candidate.aliases) {
      const aliasOwnerKey = aliasIndex.get(alias.normalizedLabel);
      if (aliasOwnerKey) {
        const aliasOwner = byNormalizedLabel.get(aliasOwnerKey);
        if (aliasOwner && aliasOwner.kind === candidate.kind) return aliasOwner;
      }
    }

    return null;
  }

  private mergeInto(existing: CandidateSkill, candidate: CandidateSkill): string[] {
    if (
      candidate.description &&
      (!existing.description || candidate.description.length > existing.description.length)
    ) {
      existing.description = candidate.description;
    }

    if (!existing.categoryLabel && candidate.categoryLabel) {
      existing.categoryLabel = candidate.categoryLabel;
    }

    if (candidate.mindName && !existing.mindName) {
      existing.mindName = candidate.mindName;
      existing.technicalDomains = candidate.technicalDomains;
      existing.conceptualAspects = candidate.conceptualAspects;
      existing.architecturalPatterns = candidate.architecturalPatterns;
      if (candidate.runtimeEnvironments) existing.runtimeEnvironments = candidate.runtimeEnvironments;
      if (candidate.buildTools) existing.buildTools = candidate.buildTools;
      if (candidate.paradigms) existing.paradigms = candidate.paradigms;
      if (candidate.supportedLanguages) existing.supportedLanguages = candidate.supportedLanguages;
      if (candidate.specificToFrameworks) existing.specificToFrameworks = candidate.specificToFrameworks;
      if (candidate.adapterForToolOrService) existing.adapterForToolOrService = candidate.adapterForToolOrService;
      if (candidate.implementsPatterns) existing.implementsPatterns = candidate.implementsPatterns;
      if (candidate.solvesApplicationTasks) existing.solvesApplicationTasks = candidate.solvesApplicationTasks;
      if (candidate.associatedApplicationDomains)
        existing.associatedApplicationDomains = candidate.associatedApplicationDomains;
      if (candidate.deploymentTypes) existing.deploymentTypes = candidate.deploymentTypes;
      if (candidate.groups) existing.groups = candidate.groups;
    }

    const existingAliasSet = new Set(existing.aliases.map(a => a.normalizedLabel));
    const newAliases: string[] = [];

    if (candidate.normalizedLabel !== existing.normalizedLabel && !existingAliasSet.has(candidate.normalizedLabel)) {
      existing.aliases.push({ label: candidate.label, normalizedLabel: candidate.normalizedLabel });
      existingAliasSet.add(candidate.normalizedLabel);
      newAliases.push(candidate.normalizedLabel);
    }

    for (const alias of candidate.aliases) {
      if (alias.normalizedLabel !== existing.normalizedLabel && !existingAliasSet.has(alias.normalizedLabel)) {
        existing.aliases.push(alias);
        existingAliasSet.add(alias.normalizedLabel);
        newAliases.push(alias.normalizedLabel);
      }
    }

    return newAliases;
  }

  // ---- Phase 3: Upsert concepts ----

  private async upsertConcepts(): Promise<Map<string, string>> {
    const rows = await this.connection.execute(
      `SELECT "mind_name", "mind_type", "category" FROM "mind_concepts"`,
      [],
      'all'
    );

    const now = new Date();
    const seen = new Set<string>();
    const conceptRows: unknown[][] = [];
    for (const row of rows as { mind_name: string; mind_type: string; category: string | null }[]) {
      const nl = normalizeLabel(row.mind_name);
      if (seen.has(nl)) continue;
      seen.add(nl);
      const kind = CONCEPT_FILE_TO_KIND[row.mind_type] ?? 'conceptual_aspect';
      conceptRows.push([crypto.randomUUID(), row.mind_name, nl, kind, row.category, row.mind_name, now, now]);
    }

    if (conceptRows.length > 0) {
      await this.batchUpsert(
        'concepts',
        ['id', 'label', 'normalized_label', 'kind', 'category', 'mind_name', 'created_at', 'updated_at'],
        ['normalized_label'],
        conceptRows
      );
    }

    const result = await this.connection.execute(
      `SELECT "id", "mind_name" FROM "concepts" WHERE "mind_name" IS NOT NULL`,
      [],
      'all'
    );
    return new Map(result.map((r: { id: string; mind_name: string }) => [r.mind_name, r.id]));
  }

  // ---- Phase 4: Resolve skill dependencies ----

  private async resolveSkillDependencies(skillMap: Map<string, string>): Promise<number> {
    const rows = await this.connection.execute(
      `SELECT "mind_source_name", "mind_target_name"
       FROM "mind_relations"
       WHERE "relation_type" = 'impliesKnowingSkills'`,
      [],
      'all'
    );

    await this.connection.execute('DELETE FROM "skill_dependencies"', [], 'run');

    const now = new Date();
    const depRows: unknown[][] = [];
    for (const row of rows as { mind_source_name: string; mind_target_name: string }[]) {
      const sourceId = skillMap.get(row.mind_source_name);
      const targetId = skillMap.get(row.mind_target_name);
      if (sourceId && targetId && sourceId !== targetId) {
        depRows.push([crypto.randomUUID(), sourceId, targetId, now]);
      }
    }

    if (depRows.length > 0) {
      await this.batchUpsert(
        'skill_dependencies',
        ['id', 'skill_id', 'implied_skill_id', 'created_at'],
        ['skill_id', 'implied_skill_id'],
        depRows
      );
    }

    return depRows.length;
  }

  // ---- Phase 5: Resolve concept dependencies ----

  private async resolveConceptDependencies(
    skillMap: Map<string, string>,
    conceptMap: Map<string, string>
  ): Promise<number> {
    const rows = await this.connection.execute(
      `SELECT "mind_source_name", "mind_target_name"
       FROM "mind_relations"
       WHERE "relation_type" = 'impliesKnowingConcepts'`,
      [],
      'all'
    );

    await this.connection.execute('DELETE FROM "concept_dependencies"', [], 'run');

    const now = new Date();
    const depRows: unknown[][] = [];
    for (const row of rows as { mind_source_name: string; mind_target_name: string }[]) {
      const skillId = skillMap.get(row.mind_source_name);
      const conceptId = conceptMap.get(row.mind_target_name);
      if (skillId && conceptId) {
        depRows.push([crypto.randomUUID(), skillId, conceptId, now]);
      }
    }

    if (depRows.length > 0) {
      await this.batchUpsert(
        'concept_dependencies',
        ['id', 'skill_id', 'concept_id', 'created_at'],
        ['skill_id', 'concept_id'],
        depRows
      );
    }

    return depRows.length;
  }

  // ---- Batch upsert helper ----

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
