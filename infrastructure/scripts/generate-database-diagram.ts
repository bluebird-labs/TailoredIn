#!/usr/bin/env bun
/**
 * Generates infrastructure/DATABASE.mmd — a Mermaid ERD from the live PostgreSQL schema.
 * Queries information_schema to reflect the actual database state.
 *
 * Run: bun run db:diagram
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { env, Logger } from '@tailoredin/core';
import { getOrmConfig } from '../src/db/orm-config.js';

const log = Logger.create('generate-database-diagram');
const OUTPUT_PATH = resolve(import.meta.dirname, '../DATABASE.mmd');

// ─── Configuration ───────────────────────────────────────────────────────────

/** Tables to exclude from the diagram. */
const EXCLUDED_TABLES = new Set(['mikro_orm_migrations']);

/** Color palette for connected-component groups (fill, stroke). Cycles if more groups than colors. */
const GROUP_COLORS: [fill: string, stroke: string][] = [
  ['#dae8fc', '#6c8ebf'], // blue
  ['#d5e8d4', '#82b366'], // green
  ['#fff2cc', '#d6b656'], // amber
  ['#f8cecc', '#b85450'], // red
  ['#e1d5e7', '#9673a6'], // purple
  ['#ffe6cc', '#d79b00'] // orange
];

// ─── Types ───────────────────────────────────────────────────────────────────

type ColumnInfo = {
  table_name: string;
  column_name: string;
  udt_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_generated: string;
  generation_expression: string | null;
};

type ConstraintInfo = {
  table_name: string;
  constraint_type: string;
  column_name: string;
};

type ForeignKeyInfo = {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
};

type IndexInfo = {
  table_name: string;
  index_name: string;
  column_name: string;
};

// ─── Main ────────────────────────────────────────────────────────────────────

const orm = await MikroORM.init(getOrmConfig());
const conn = orm.em.getConnection();
const schema = env('POSTGRES_SCHEMA');

async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return conn.execute<T[]>(sql, params);
}

try {
  // Run all queries in parallel
  const [tablesRows, columnsRows, constraintsRows, fksRows, indexesRows, enumTypesRows] = await Promise.all([
    // 1. Tables
    query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
			 WHERE table_schema = ? AND table_type = 'BASE TABLE'
			 ORDER BY table_name`,
      [schema]
    ),

    // 2. Columns
    query<ColumnInfo>(
      `SELECT table_name, column_name, udt_name, data_type, is_nullable, column_default, is_generated, generation_expression
			 FROM information_schema.columns
			 WHERE table_schema = ?
			 ORDER BY table_name, ordinal_position`,
      [schema]
    ),

    // 3. PK + UK constraints
    query<ConstraintInfo>(
      `SELECT tc.table_name, tc.constraint_type, kcu.column_name
			 FROM information_schema.table_constraints tc
			 JOIN information_schema.key_column_usage kcu
			   ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
			 WHERE tc.table_schema = ? AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')`,
      [schema]
    ),

    // 4. Foreign keys
    query<ForeignKeyInfo>(
      `SELECT tc.table_name AS from_table, kcu.column_name AS from_column,
			        ccu.table_name AS to_table, ccu.column_name AS to_column
			 FROM information_schema.table_constraints tc
			 JOIN information_schema.key_column_usage kcu
			   ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
			 JOIN information_schema.constraint_column_usage ccu
			   ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
			 WHERE tc.table_schema = ? AND tc.constraint_type = 'FOREIGN KEY'`,
      [schema]
    ),

    // 5. Indexes (non-PK, non-unique)
    query<IndexInfo>(
      `SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name
			 FROM pg_class t
			 JOIN pg_index ix ON t.oid = ix.indrelid
			 JOIN pg_class i ON i.oid = ix.indexrelid
			 JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
			 JOIN pg_namespace n ON n.oid = t.relnamespace
			 WHERE n.nspname = ? AND NOT ix.indisprimary AND NOT ix.indisunique`,
      [schema]
    ),

    // 6. Native enum types
    query<{ typname: string }>(
      `SELECT typname FROM pg_type
			 JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid
			 WHERE typtype = 'e' AND nspname = ?`,
      [schema]
    )
  ]);

  const tableNames = tablesRows.map(r => r.table_name).filter(t => !EXCLUDED_TABLES.has(t));

  const columns = columnsRows;
  const constraints = constraintsRows;
  const foreignKeys = fksRows;
  const indexes = indexesRows;
  const enumTypes = new Set(enumTypesRows.map(r => r.typname));

  // Build lookup maps
  const pkColumns = buildConstraintMap(constraints, 'PRIMARY KEY');
  const ukColumns = buildConstraintMap(constraints, 'UNIQUE');
  const fkColumns = buildFkMap(foreignKeys);
  const indexedColumns = buildIndexMap(indexes);

  // Detect junction tables: tables where all PK columns are also FK columns
  const junctionTables = new Set<string>();
  for (const [table, pks] of pkColumns) {
    const fks = fkColumns.get(table);
    if (fks && pks.size > 1 && [...pks].every(pk => fks.has(pk))) {
      junctionTables.add(table);
    }
  }

  // Auto-detect M2M pairs from junction tables
  const m2mPairs: { left: string; right: string }[] = [];
  for (const jt of junctionTables) {
    const targets = foreignKeys.filter(fk => fk.from_table === jt).map(fk => fk.to_table);
    const uniqueTargets = [...new Set(targets)];
    if (uniqueTargets.length === 2) {
      m2mPairs.push({ left: uniqueTargets[0], right: uniqueTargets[1] });
    }
  }

  // Group tables by FK connectivity (connected components)
  const groups = findConnectedComponents(tableNames, foreignKeys);

  // Build diagram
  const output = buildDiagram(
    tableNames,
    columns,
    pkColumns,
    ukColumns,
    fkColumns,
    indexedColumns,
    enumTypes,
    foreignKeys,
    junctionTables,
    groups,
    m2mPairs
  );

  writeFileSync(OUTPUT_PATH, output);
  log.info(`Generated ${OUTPUT_PATH} (${tableNames.length} tables)`);
} finally {
  await orm.close(true);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildConstraintMap(constraints: ConstraintInfo[], type: string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const c of constraints) {
    if (c.constraint_type !== type) continue;
    if (!map.has(c.table_name)) map.set(c.table_name, new Set());
    map.get(c.table_name)!.add(c.column_name);
  }
  return map;
}

function buildFkMap(fks: ForeignKeyInfo[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const fk of fks) {
    if (!map.has(fk.from_table)) map.set(fk.from_table, new Set());
    map.get(fk.from_table)!.add(fk.from_column);
  }
  return map;
}

function buildIndexMap(indexes: IndexInfo[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const idx of indexes) {
    if (!map.has(idx.table_name)) map.set(idx.table_name, new Set());
    map.get(idx.table_name)!.add(idx.column_name);
  }
  return map;
}

function mapType(udtName: string, enumTypes: Set<string>): string {
  // Array types start with underscore in PostgreSQL
  if (udtName.startsWith('_')) return `${mapType(udtName.slice(1), enumTypes)}[]`;
  if (enumTypes.has(udtName)) return udtName;

  switch (udtName) {
    case 'uuid':
      return 'uuid';
    case 'text':
    case 'varchar':
      return 'text';
    case 'int4':
    case 'int8':
    case 'int2':
      return 'integer';
    case 'bool':
      return 'boolean';
    case 'timestamp':
    case 'timestamptz':
      return 'timestamp';
    case 'tsvector':
      return 'tsvector';
    case 'json':
    case 'jsonb':
      return 'json';
    case 'float4':
    case 'float8':
    case 'numeric':
      return 'numeric';
    default:
      return udtName;
  }
}

function cleanDefault(raw: string): string {
  let d = raw;
  // Strip type casts: 'value'::typename or 'value'::character varying
  d = d.replace(/::[a-z_ ]+(\[\])?/g, '');
  // Strip surrounding single quotes and extract value
  const quoted = d.match(/^'(.*)'$/);
  if (quoted) d = quoted[1];
  d = d.trim();
  return d || 'empty';
}

function formatColumnAnnotation(
  col: ColumnInfo,
  pks: Set<string> | undefined,
  uks: Set<string> | undefined,
  fks: Set<string> | undefined,
  indexed: Set<string> | undefined,
  isJunctionTable: boolean
): { constraint: string; comment: string } {
  const isPk = pks?.has(col.column_name) ?? false;
  const isUk = uks?.has(col.column_name) ?? false;
  const isFk = fks?.has(col.column_name) ?? false;
  const isIndexed = indexed?.has(col.column_name) ?? false;
  const isNullable = col.is_nullable === 'YES';
  const isGenerated = col.is_generated === 'ALWAYS';
  const hasDefault = col.column_default !== null && !isPk;

  // Constraint marker: junction table PK+FK columns show as FK
  let constraint = '';
  if (isPk && isFk && isJunctionTable) constraint = 'FK';
  else if (isPk) constraint = 'PK';
  else if (isFk) constraint = 'FK';
  else if (isUk) constraint = 'UK';

  // Comment parts
  const parts: string[] = [];
  if (isNullable) parts.push('nullable');
  if (isGenerated) {
    parts.push(isIndexed ? 'generated, indexed' : 'generated');
  } else if (hasDefault) {
    parts.push(`default: ${cleanDefault(col.column_default!)}`);
  }
  if (isUk && !isPk && !constraint.includes('UK')) {
    parts.push('unique');
  }

  return { constraint, comment: parts.length > 0 ? `"${parts.join(', ')}"` : '' };
}

function findConnectedComponents(tableNames: string[], foreignKeys: ForeignKeyInfo[]): string[][] {
  const tableSet = new Set(tableNames);
  const adjacency = new Map<string, Set<string>>();
  for (const t of tableNames) adjacency.set(t, new Set());

  for (const fk of foreignKeys) {
    if (!tableSet.has(fk.from_table) || !tableSet.has(fk.to_table)) continue;
    adjacency.get(fk.from_table)!.add(fk.to_table);
    adjacency.get(fk.to_table)!.add(fk.from_table);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const table of tableNames) {
    if (visited.has(table)) continue;
    const component: string[] = [];
    const queue = [table];
    visited.add(table);
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of adjacency.get(current)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    component.sort();
    components.push(component);
  }

  // Sort components: larger groups first, then alphabetically by first table
  components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  return components;
}

function buildDiagram(
  tableNames: string[],
  columns: ColumnInfo[],
  pkColumns: Map<string, Set<string>>,
  ukColumns: Map<string, Set<string>>,
  fkColumns: Map<string, Set<string>>,
  indexedColumns: Map<string, Set<string>>,
  enumTypes: Set<string>,
  foreignKeys: ForeignKeyInfo[],
  junctionTables: Set<string>,
  groups: string[][],
  m2mPairs: { left: string; right: string }[]
): string {
  const lines: string[] = ['---', 'title: TailoredIn \u2014 Database ERD (PostgreSQL)', '---', '', 'erDiagram'];

  const tableSet = new Set(tableNames);

  // Emit tables grouped by connected component
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const label = groups.length === 1 ? 'Tables' : group.length === 1 ? 'Standalone' : `Group ${i + 1}`;

    lines.push('');
    lines.push(sectionHeader(label));
    lines.push('');

    for (const tableName of group) {
      lines.push(
        ...emitTable(tableName, columns, pkColumns, ukColumns, fkColumns, indexedColumns, enumTypes, junctionTables)
      );
      lines.push('');
    }
  }

  // Relationships section
  lines.push(sectionHeader('Relationships'));
  lines.push('');

  const emittedRels = new Set<string>();

  for (const fk of foreignKeys) {
    if (!tableSet.has(fk.from_table) || !tableSet.has(fk.to_table)) continue;

    const relKey = `${fk.to_table}->${fk.from_table}`;
    if (emittedRels.has(relKey)) continue;
    emittedRels.add(relKey);

    // Determine cardinality: check if FK column has a unique constraint
    const isUnique = ukColumns.get(fk.from_table)?.has(fk.from_column) ?? false;
    const isPk = pkColumns.get(fk.from_table)?.has(fk.from_column) ?? false;
    const isOneToOne = isUnique || isPk;

    const cardinality = isOneToOne ? '||--o|' : '||--o{';
    lines.push(`    ${fk.to_table} ${cardinality} ${fk.from_table} : "has"`);
  }

  // Auto-detected many-to-many relationships
  for (const m2m of m2mPairs) {
    lines.push(`    ${m2m.left} }o--o{ ${m2m.right} : "many-to-many"`);
  }

  // Color-code tables by group
  lines.push('');
  lines.push(sectionHeader('Styles'));
  lines.push('');

  for (let i = 0; i < groups.length; i++) {
    const [fill, stroke] = GROUP_COLORS[i % GROUP_COLORS.length];
    const className = `group${i}`;
    lines.push(`    classDef ${className} fill:${fill},stroke:${stroke},stroke-width:2px`);
    for (const tableName of groups[i]) {
      lines.push(`    class ${tableName} ${className}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function emitTable(
  tableName: string,
  allColumns: ColumnInfo[],
  pkColumns: Map<string, Set<string>>,
  ukColumns: Map<string, Set<string>>,
  fkColumns: Map<string, Set<string>>,
  indexedColumns: Map<string, Set<string>>,
  enumTypes: Set<string>,
  junctionTables: Set<string>
): string[] {
  const tableCols = allColumns.filter(c => c.table_name === tableName);
  const isJunction = junctionTables.has(tableName);
  const lines: string[] = [];

  lines.push(`    ${tableName} {`);

  for (const col of tableCols) {
    const type = mapType(col.udt_name, enumTypes);
    const { constraint, comment } = formatColumnAnnotation(
      col,
      pkColumns.get(tableName),
      ukColumns.get(tableName),
      fkColumns.get(tableName),
      indexedColumns.get(tableName),
      isJunction
    );

    const parts = [`        ${type} ${col.column_name}`];
    if (constraint) parts.push(constraint);
    if (comment) parts.push(comment);
    lines.push(parts.join(' '));
  }

  lines.push('    }');
  return lines;
}

function sectionHeader(label: string): string {
  const bar = '\u2500'.repeat(46);
  return [`    %% ${bar}`, `    %%  ${label}`, `    %% ${bar}`].join('\n');
}
