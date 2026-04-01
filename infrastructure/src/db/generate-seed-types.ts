#!/usr/bin/env bun
/**
 * Generates seed-types.generated.ts from ORM entity metadata.
 * Re-run after migrations to keep seed data types in sync with the schema.
 *
 * Run: bun run db:seed:generate-types
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ReferenceKind } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { getOrmConfig } from './orm-config.js';

const log = Logger.create('seed-generate-types');

const SEED_TABLES = ['companies', 'jobs', 'job_status_updates'];
const OUTPUT_PATH = resolve(import.meta.dirname, 'seeds/data/seed-types.generated.ts');

const orm = await MikroORM.init(getOrmConfig());

try {
  const metadata = orm.getMetadata();
  const lines: string[] = [
    '// AUTO-GENERATED — do not edit manually.',
    '// Run `bun run db:seed:generate-types` to regenerate from ORM entity metadata.',
    ''
  ];

  for (const [, meta] of metadata.getAll()) {
    if (!SEED_TABLES.includes(meta.tableName)) continue;

    const interfaceName = `${meta.className}Row`;
    lines.push(`export interface ${interfaceName} {`);

    for (const prop of Object.values(meta.properties)) {
      const kind = prop.kind;

      // Skip collections (OneToMany, ManyToMany)
      if (kind === ReferenceKind.ONE_TO_MANY || kind === ReferenceKind.MANY_TO_MANY) continue;

      // Skip generated columns (e.g. description_fts tsvector)
      if (prop.generated) continue;

      const col = prop.fieldNames?.[0] ?? prop.name;
      const tsType = resolveType(prop);
      const nullable = prop.nullable ? ' | null' : '';

      lines.push(`  ${col}: ${tsType}${nullable};`);
    }

    lines.push('}');
    lines.push('');
  }

  writeFileSync(OUTPUT_PATH, lines.join('\n'));
  log.info(`Generated ${OUTPUT_PATH}`);
} finally {
  await orm.close(true);
}

function resolveType(prop: { runtimeType?: string; kind?: ReferenceKind; type?: string }): string {
  const isFK = prop.kind === ReferenceKind.MANY_TO_ONE || prop.kind === ReferenceKind.ONE_TO_ONE;
  if (isFK) return 'string'; // FK → just the ID

  const rt = prop.runtimeType;
  if (rt === 'Date') return 'string'; // ISO timestamp in seed data
  if (rt === 'number') return 'number';
  if (rt === 'boolean') return 'boolean';
  if (rt === 'string') return 'string';
  if (rt === 'string[]') return 'string[]';

  // Enums show as their class name (e.g. "JobStatus") — store as string in seed data
  return 'string';
}
