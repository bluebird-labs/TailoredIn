import type { Connection } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import type { ParsedLinguistLanguage } from './LinguistParser.js';

const BATCH_SIZE = 500;

type TableImport = {
  table: string;
  columns: string[];
  conflictColumns: string[];
  rows: unknown[][];
};

export class LinguistImporter {
  private readonly log = Logger.create('linguist-importer');

  public constructor(private readonly connection: Connection) {}

  public async importAll(languages: ParsedLinguistLanguage[], version: string): Promise<void> {
    const totalStart = performance.now();

    await this.importTable(this.buildLanguages(languages, version));

    const elapsed = ((performance.now() - totalStart) / 1000).toFixed(2);
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

  private buildLanguages(languages: ParsedLinguistLanguage[], version: string): TableImport {
    const columns = [
      'linguist_name',
      'linguist_type',
      'color',
      'aliases',
      'extensions',
      'interpreters',
      'tm_scope',
      'ace_mode',
      'codemirror_mode',
      'codemirror_mime_type',
      'linguist_language_id',
      'linguist_group',
      'linguist_version'
    ];
    return {
      table: 'linguist_languages',
      columns,
      conflictColumns: ['linguist_name'],
      rows: languages.map(l => [
        l.name,
        l.type,
        l.color ?? null,
        JSON.stringify(l.aliases ?? []),
        JSON.stringify(l.extensions ?? []),
        JSON.stringify(l.interpreters ?? []),
        l.tm_scope ?? null,
        l.ace_mode ?? null,
        l.codemirror_mode ?? null,
        l.codemirror_mime_type ?? null,
        l.language_id ?? null,
        l.group ?? null,
        version
      ])
    };
  }
}
