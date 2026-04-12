#!/usr/bin/env bun
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { getOrmConfig } from '../src/db/orm-config.js';
import { MindDatasetParser } from '../src/mind/MindDatasetParser.js';
import { MindImporter } from '../src/mind/MindImporter.js';

const log = Logger.create('mind-import');

async function main(): Promise<void> {
  const dirArg = process.argv[2];
  if (!dirArg) {
    log.error('Usage: bun mind:import <path-to-mind-repo-clone>');
    process.exit(1);
  }

  const repoRoot = resolve(dirArg);
  log.info(`Loading MIND data from ${repoRoot}`);

  const start = performance.now();

  // 1. Get git commit hash as version
  const version = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  log.info(`MIND version: ${version}`);

  // 2. Parse JSON files
  const parser = new MindDatasetParser();
  const dataset = await parser.parse(repoRoot);
  log.info('Dataset parsed successfully');

  // 3. Initialize ORM and import
  const orm = await MikroORM.init(getOrmConfig());
  try {
    const connection = orm.em.getConnection();
    const importer = new MindImporter(connection);
    await importer.importAll(dataset, version);
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
