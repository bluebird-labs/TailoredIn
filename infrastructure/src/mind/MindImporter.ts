import type { Connection } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import type { MindDataset } from './MindDataset.js';

const BATCH_SIZE = 500;

type TableImport = {
  table: string;
  columns: string[];
  conflictColumns: string[];
  rows: unknown[][];
};

export class MindImporter {
  private readonly log = Logger.create('mind-importer');

  public constructor(private readonly connection: Connection) {}

  public async importAll(dataset: MindDataset, version: string): Promise<void> {
    const totalStart = performance.now();

    // Phase 1: Concept tables
    await this.importTable(this.buildSkills(dataset, version));
    await this.importTable(this.buildConcepts(dataset, version));

    // Phase 2: Relation tables (derived from skill arrays)
    await this.importTable(this.buildRelations(dataset, version));

    const elapsed = ((performance.now() - totalStart) / 1000).toFixed(2);
    this.log.info(`Done in ${elapsed}s`);
  }

  private async importTable(spec: TableImport): Promise<void> {
    const start = performance.now();
    const { table, columns, conflictColumns, rows } = spec;

    // Deduplicate by conflict key (last occurrence wins) to avoid
    // "ON CONFLICT DO UPDATE cannot affect row a second time" within a batch
    const conflictIndexes = conflictColumns.map(c => columns.indexOf(c));
    const deduped = new Map<string, unknown[]>();
    for (const row of rows) {
      const key = conflictIndexes.map(i => row[i]).join('\0');
      deduped.set(key, row);
    }
    const uniqueRows = [...deduped.values()];

    for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
      const batch = uniqueRows.slice(i, i + BATCH_SIZE);
      await this.batchUpsert(table, columns, conflictColumns, batch);
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    this.log.info(`${table}: ${uniqueRows.length} rows (${elapsed}s)`);
  }

  private async batchUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
    rows: unknown[][]
  ): Promise<void> {
    if (rows.length === 0) return;

    const colList = columns.map(c => `"${c}"`).join(', ');
    const conflictList = conflictColumns.map(c => `"${c}"`).join(', ');
    const updateCols = columns.filter(c => !conflictColumns.includes(c));
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

  private buildSkills(dataset: MindDataset, version: string): TableImport {
    const columns = [
      'mind_name',
      'mind_type',
      'synonyms',
      'technical_domains',
      'implies_knowing_skills',
      'implies_knowing_concepts',
      'conceptual_aspects',
      'architectural_patterns',
      'supported_programming_languages',
      'specific_to_frameworks',
      'adapter_for_tool_or_service',
      'implements_patterns',
      'associated_to_application_domains',
      'solves_application_tasks',
      'build_tools',
      'runtime_environments',
      'mind_source_file',
      'mind_version'
    ];
    return {
      table: 'mind_skills',
      columns,
      conflictColumns: ['mind_name'],
      rows: dataset.skills.map(s => [
        s.name,
        JSON.stringify(s.type),
        JSON.stringify(s.synonyms),
        JSON.stringify(s.technicalDomains),
        JSON.stringify(s.impliesKnowingSkills),
        JSON.stringify(s.impliesKnowingConcepts),
        JSON.stringify(s.conceptualAspects),
        JSON.stringify(s.architecturalPatterns),
        JSON.stringify(s.supportedProgrammingLanguages),
        JSON.stringify(s.specificToFrameworks),
        JSON.stringify(s.adapterForToolOrService),
        JSON.stringify(s.implementsPatterns),
        JSON.stringify(s.associatedToApplicationDomains),
        JSON.stringify(s.solvesApplicationTasks),
        JSON.stringify(s.buildTools),
        JSON.stringify(s.runtimeEnvironments),
        s.sourceFile,
        version
      ])
    };
  }

  private buildConcepts(dataset: MindDataset, version: string): TableImport {
    const columns = ['mind_name', 'mind_type', 'synonyms', 'mind_version'];
    return {
      table: 'mind_concepts',
      columns,
      conflictColumns: ['mind_name'],
      rows: dataset.concepts.map(c => [c.name, c.mindType, JSON.stringify(c.synonyms), version])
    };
  }

  private buildRelations(dataset: MindDataset, version: string): TableImport {
    const columns = ['mind_source_name', 'mind_target_name', 'relation_type', 'mind_version'];
    const rows: unknown[][] = [];

    for (const skill of dataset.skills) {
      for (const target of skill.impliesKnowingSkills) {
        rows.push([skill.name, target, 'impliesKnowingSkills', version]);
      }
      for (const target of skill.impliesKnowingConcepts) {
        rows.push([skill.name, target, 'impliesKnowingConcepts', version]);
      }
    }

    return {
      table: 'mind_relations',
      columns,
      conflictColumns: ['mind_source_name', 'mind_target_name', 'relation_type'],
      rows
    };
  }
}
