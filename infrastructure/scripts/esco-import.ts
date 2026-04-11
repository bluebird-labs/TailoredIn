#!/usr/bin/env bun
import { resolve } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { getOrmConfig } from '../src/db/orm-config.js';
import { EscoCsvParser } from '../src/esco/EscoCsvParser.js';
import { EscoDatasetParser } from '../src/esco/EscoDatasetParser.js';
import { EscoDirectoryLoader } from '../src/esco/EscoDirectoryLoader.js';
import { EscoImporter } from '../src/esco/EscoImporter.js';

const log = Logger.create('esco-import');

async function main(): Promise<void> {
  const dirArg = process.argv[2];
  if (!dirArg) {
    log.error('Usage: bun run infrastructure/scripts/esco-import.ts <path-to-esco-directory>');
    process.exit(1);
  }

  const escoDir = resolve(dirArg);
  log.info(`Loading ESCO data from ${escoDir}`);

  const start = performance.now();

  // 1. Parse CSV files
  const loader = new EscoDirectoryLoader();
  const directory = await loader.load(escoDir);

  const parser = new EscoDatasetParser(new EscoCsvParser());
  const dataset = await parser.parse(directory);
  log.info('Dataset parsed successfully');

  // 2. Initialize ORM and import
  const orm = await MikroORM.init(getOrmConfig());
  try {
    const connection = orm.em.getConnection();
    const importer = new EscoImporter(connection);
    await importer.importAll(dataset);
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
