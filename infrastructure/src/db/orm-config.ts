import Path from 'node:path';
import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import { defineConfig, SchemaGenerator, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Environment } from '@tailoredin/core/src/Environment.js';
import { StatusCode } from '@tselect/status-code';
import { BaseEntity } from './BaseEntity.js';
import { Company } from './entities/companies/Company.js';
import { Job } from './entities/jobs/Job.js';
import { JobStatusUpdate } from './entities/jobs/JobStatusUpdate.js';
import { Skill } from './entities/skills/Skill.js';

const PACKAGE_DIR = Path.resolve(import.meta.dirname);

export const ormConfig = defineConfig({
  debug: false,
  allowGlobalContext: true,

  entities: [BaseEntity, Company, Skill, Job, JobStatusUpdate],
  extensions: [Migrator, SchemaGenerator],

  discovery: { warnWhenNoEntities: true },
  namingStrategy: UnderscoreNamingStrategy,
  metadataProvider: TsMorphMetadataProvider,
  highlighter: new SqlHighlighter(),
  forceUtcTimezone: true,
  implicitTransactions: false,
  ensureDatabase: true,
  preferTs: true,
  forceEntityConstructor: true,
  multipleStatements: true,
  useBatchInserts: true,
  useBatchUpdates: true,
  colors: true,
  timezone: Environment.get('TZ'),
  user: Environment.get('POSTGRES_USER'),
  password: Environment.get('POSTGRES_PASSWORD'),
  dbName: Environment.get('POSTGRES_DB'),
  schema: Environment.get('POSTGRES_SCHEMA'),
  host: Environment.get('POSTGRES_HOST'),
  port: Environment.get('POSTGRES_PORT'),

  findOneOrFailHandler: (entityName, where) => {
    const err = new Error(`Entity not found: ${entityName} (${JSON.stringify(where)})`);
    Object.assign(err, { statusCode: StatusCode.NOT_FOUND });
    throw err;
  },

  seeder: {
    pathTs: Path.resolve(PACKAGE_DIR, 'seeds'),
    emit: 'ts'
  },

  migrations: {
    tableName: 'mikro_orm_migrations',
    transactional: true,
    allOrNothing: true,
    snapshot: false,
    pathTs: Path.resolve(PACKAGE_DIR, 'migrations'),
    glob: 'Migration_*.ts',
    emit: 'ts',
    generator: TSMigrationGenerator,
    fileName: (timestamp: string, name?: string): string => {
      if (!name) throw new Error('No name provided for migration');
      return `Migration_${timestamp}_${name}`;
    }
  }
});

export default ormConfig;
