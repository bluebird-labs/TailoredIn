#!/usr/bin/env tsx
/**
 * Seed reference data into the database.
 * Reads DB config from environment (passed through by turbo's passThroughEnv).
 */
import { env, envInt, Logger } from '@tailoredin/core';
import { runSeeds } from './SeedRunner.js';

const log = Logger.create('dev:seed');

const dbConfig = {
  timezone: env('TZ'),
  user: env('POSTGRES_USER'),
  password: env('POSTGRES_PASSWORD'),
  dbName: env('POSTGRES_DB'),
  schema: env('POSTGRES_SCHEMA'),
  host: env('POSTGRES_HOST'),
  port: envInt('POSTGRES_PORT')
};

log.info('Running seeds...');
await runSeeds(dbConfig);
log.info('Done.');
