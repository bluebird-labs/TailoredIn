import Path from 'node:path';
import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import { defineConfig, SchemaGenerator, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { env, envInt } from '@tailoredin/core';
import { StatusCode } from '@tselect/status-code';
import { BaseEntity } from './BaseEntity.js';
import { Company } from './entities/companies/Company.js';
import { CompanyBrief } from './entities/companies/CompanyBrief.js';
import { Education } from './entities/education/Education.js';
import { Accomplishment as OrmAccomplishment } from './entities/experience/Accomplishment.js';
import { Experience as OrmExperience } from './entities/experience/Experience.js';
import { Headline as OrmHeadline } from './entities/headline/Headline.js';
import { Job } from './entities/jobs/Job.js';
import { JobStatusUpdate } from './entities/jobs/JobStatusUpdate.js';
import { Profile } from './entities/profile/Profile.js';
import { ResumeProfileOrm } from './entities/resume-profile/ResumeProfileOrm.js';
import { Skill } from './entities/skills/Skill.js';
import { SkillCategory as OrmSkillCategory } from './entities/skills/SkillCategory.js';
import { SkillItem as OrmSkillItem } from './entities/skills/SkillItem.js';
import { Tag as OrmTag } from './entities/tag/Tag.js';
import { TailoredResumeOrm } from './entities/tailored-resume/TailoredResumeOrm.js';

const PACKAGE_DIR = Path.resolve(import.meta.dirname);

export type OrmDbConfig = {
  timezone: string;
  user: string;
  password: string;
  dbName: string;
  schema: string;
  host: string;
  port: number;
};

export function createOrmConfig(db: OrmDbConfig) {
  return defineConfig({
    debug: false,
    allowGlobalContext: true,

    entities: [
      BaseEntity,
      Profile,
      Education,
      Company,
      CompanyBrief,
      Skill,
      Job,
      JobStatusUpdate,
      OrmHeadline,
      OrmTag,
      OrmSkillCategory,
      OrmSkillItem,
      OrmExperience,
      OrmAccomplishment,
      ResumeProfileOrm,
      TailoredResumeOrm
    ],
    extensions: [Migrator, SchemaGenerator, SeedManager],

    discovery: { warnWhenNoEntities: true },
    namingStrategy: UnderscoreNamingStrategy,
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { options: { cacheDir: Path.resolve(PACKAGE_DIR, '../../.mikroorm-cache') } },
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
    timezone: db.timezone,
    user: db.user,
    password: db.password,
    dbName: db.dbName,
    schema: db.schema,
    host: db.host,
    port: db.port,

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
}

// Lazily evaluated to avoid env() calls at import time (used by tests that import createOrmConfig only)
export function getOrmConfig() {
  return createOrmConfig({
    timezone: env('TZ'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
    dbName: env('POSTGRES_DB'),
    schema: env('POSTGRES_SCHEMA'),
    host: env('POSTGRES_HOST'),
    port: envInt('POSTGRES_PORT')
  });
}

// MikroORM CLI default export — evaluated when the CLI loads this file
export default getOrmConfig;
