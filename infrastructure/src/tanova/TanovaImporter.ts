import type { Connection } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import type { TanovaSkill } from './schemas/tanova-skill.js';

const BATCH_SIZE = 500;

type TableImport = {
  table: string;
  columns: string[];
  conflictColumns: string[];
  rows: unknown[][];
};

export class TanovaImporter {
  private readonly log = Logger.create(this);

  public constructor(private readonly connection: Connection) {}

  public async importAll(skills: TanovaSkill[], version: string): Promise<void> {
    const start = performance.now();
    await this.importTable(this.buildSkills(skills, version));
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    this.log.info(`Done in ${elapsed}s`);
  }

  private async importTable(spec: TableImport): Promise<void> {
    const start = performance.now();
    const { table, columns, conflictColumns, rows } = spec;

    // Deduplicate by conflict key (last occurrence wins)
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

  private buildSkills(skills: TanovaSkill[], version: string): TableImport {
    const columns = [
      'tanova_id',
      'canonical_name',
      'category',
      'subcategory',
      'tags',
      'description',
      'aliases',
      'parent_skills',
      'child_skills',
      'related_skills',
      'transferability',
      'proficiency_levels',
      'typical_roles',
      'industry_demand',
      'prerequisites',
      'tanova_version'
    ];

    return {
      table: 'tanova_skills',
      columns,
      conflictColumns: ['tanova_id'],
      rows: skills.map(s => [
        s.id,
        s.canonical_name,
        s.category ?? null,
        s.subcategory ?? null,
        JSON.stringify(s.tags),
        s.description ?? null,
        JSON.stringify(s.aliases),
        JSON.stringify(s.parent_skills),
        JSON.stringify(s.child_skills),
        JSON.stringify(s.related_skills),
        s.transferability ? JSON.stringify(s.transferability) : null,
        s.proficiency_levels ? JSON.stringify(s.proficiency_levels) : null,
        JSON.stringify(s.typical_roles),
        s.industry_demand ?? null,
        JSON.stringify(s.prerequisites),
        version
      ])
    };
  }
}
