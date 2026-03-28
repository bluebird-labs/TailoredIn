import { defineConfig, SchemaGenerator, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { BaseEntity } from './BaseEntity';
import { TransientCompany } from './entities/companies/TransientCompany';
import { TransientJob } from './entities/jobs/TransientJob';
import { Company } from './entities/companies/Company';
import { Skill } from './entities/skills/Skill';
import { Job } from './entities/jobs/Job';
import { JobStatusUpdate } from './entities/jobs/JobStatusUpdate';
import { TransientSkill } from './entities/skills/TransientSkill';
import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { Environment } from '../Environment';
import Path from 'node:path';
import { SRC_DIR } from '../SRC_DIR';
import { StatusCode } from '@tselect/status-code';

export const baseOrmConfig = defineConfig({
  debug: false,
  allowGlobalContext: true,

  entities: [BaseEntity, TransientCompany, TransientJob, Company, Skill, Job, JobStatusUpdate, TransientSkill],
  extensions: [Migrator, SchemaGenerator],

  discovery: {
    warnWhenNoEntities: true,
    requireEntitiesArray: true
  },
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
    pathTs: Path.resolve(SRC_DIR, 'orm/seeds'),
    emit: 'ts'
  },

  migrations: {
    tableName: 'mikro_orm_migrations',
    transactional: true,
    allOrNothing: true,
    snapshot: false,
    pathTs: Path.resolve(SRC_DIR, 'orm/migrations'),
    glob: 'Migration_*.ts',
    emit: 'ts',
    generator: TSMigrationGenerator,
    fileName: (timestamp: string, name?: string): string => {
      if (!name) {
        throw new Error(`No name provided for migration: use npx mikro-orm migration:create --name=foobar`);
      }
      return `Migration_${timestamp}_${name}`;
    }
  }
});

// This is used by MikroOrm CLI.
export default baseOrmConfig;
