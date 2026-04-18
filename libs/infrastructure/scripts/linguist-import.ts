#!/usr/bin/env tsx
import { resolve } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { getOrmConfig } from '../src/db/orm-config.js';
import { LinguistImporter } from '../src/linguist/LinguistImporter.js';
import { LinguistParser } from '../src/linguist/LinguistParser.js';

const log = Logger.create('linguist-import');

function parseArgs(): { filePath: string; version: string } {
  const args = process.argv.slice(2);
  let filePath: string | undefined;
  let version = 'unknown';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) {
      version = args[i + 1];
      i++;
    } else if (!filePath) {
      filePath = args[i];
    }
  }

  if (!filePath) {
    log.error('Usage: bun linguist:import <path-to-languages.yml> [--version <commit-hash>]');
    process.exit(1);
  }

  return { filePath: resolve(filePath), version };
}

async function main(): Promise<void> {
  const { filePath, version } = parseArgs();
  log.info(`Loading Linguist data from ${filePath} (version: ${version})`);

  const start = performance.now();

  // 1. Parse YAML
  const parser = new LinguistParser();
  const languages = await parser.parse(filePath);

  // 2. Initialize ORM and import
  const orm = await MikroORM.init(getOrmConfig());
  try {
    const connection = orm.em.getConnection();
    const importer = new LinguistImporter(connection);
    await importer.importAll(languages, version);
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
