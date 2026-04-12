#!/usr/bin/env bun
import { statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { getOrmConfig } from '../src/db/orm-config.js';
import { TanovaDatasetParser } from '../src/tanova/TanovaDatasetParser.js';
import { TanovaImporter } from '../src/tanova/TanovaImporter.js';

const log = Logger.create('tanova-import');

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    log.error('Usage: bun tanova:import <path-to-taxonomy.json-or-directory>');
    process.exit(1);
  }

  const resolved = resolve(arg);
  const filePath = statSync(resolved).isDirectory() ? join(resolved, 'taxonomy.json') : resolved;
  log.info(`Loading Tanova taxonomy from ${filePath}`);

  const start = performance.now();

  // 1. Parse JSON
  const parser = new TanovaDatasetParser();
  const { skills, version } = await parser.parse(filePath);
  log.info(`Parsed ${skills.length} skills (version: ${version})`);

  // 2. Initialize ORM and import
  const orm = await MikroORM.init(getOrmConfig());
  try {
    const connection = orm.em.getConnection();
    const importer = new TanovaImporter(connection);
    await importer.importAll(skills, version);
  } finally {
    await orm.close(true);
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);
  log.info(`Total time: ${elapsed}s`);
}

main().catch(err => {
  log.error('Failed:', err);
  process.exit(1);
});
