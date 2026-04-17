#!/usr/bin/env tsx
import { MikroORM } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import { getOrmConfig } from '../src/db/orm-config.js';
import { SkillSyncService } from '../src/skill-sync/SkillSyncService.js';

const log = Logger.create('skills-reset');

async function main(): Promise<void> {
  log.info('Starting skills reset...');

  const orm = await MikroORM.init(getOrmConfig());
  try {
    const connection = orm.em.getConnection();
    const service = new SkillSyncService(connection);
    await service.reset();
  } finally {
    await orm.close(true);
  }
}

main().catch(err => {
  log.error('Failed:', err);
  process.exit(1);
});
