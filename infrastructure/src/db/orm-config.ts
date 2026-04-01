import Path from 'node:path';
import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import { defineConfig, SchemaGenerator, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { env, envInt } from '@tailoredin/core';
import { StatusCode } from '@tselect/status-code';
import { BaseEntity } from './BaseEntity.js';
import { Archetype } from './entities/archetypes/Archetype.js';
import { ArchetypeEducation } from './entities/archetypes/ArchetypeEducation.js';
import { ArchetypePosition } from './entities/archetypes/ArchetypePosition.js';
import { ArchetypePositionBullet } from './entities/archetypes/ArchetypePositionBullet.js';
import { ArchetypeSkillCategory } from './entities/archetypes/ArchetypeSkillCategory.js';
import { ArchetypeSkillItem } from './entities/archetypes/ArchetypeSkillItem.js';
import { Company } from './entities/companies/Company.js';
import { CompanyBrief } from './entities/companies/CompanyBrief.js';
import { Education } from './entities/education/Education.js';
import { Job } from './entities/jobs/Job.js';
import { JobStatusUpdate } from './entities/jobs/JobStatusUpdate.js';
import { Profile } from './entities/profile/Profile.js';
import { ResumeBullet } from './entities/resume/ResumeBullet.js';
import { ResumeCompany } from './entities/resume/ResumeCompany.js';
import { ResumeCompanyLocation } from './entities/resume/ResumeCompanyLocation.js';
import { ResumeEducation } from './entities/resume/ResumeEducation.js';
import { ResumeHeadline } from './entities/resume/ResumeHeadline.js';
import { ResumePosition } from './entities/resume/ResumePosition.js';
import { ResumeSkillCategory } from './entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem } from './entities/resume/ResumeSkillItem.js';
import { Skill } from './entities/skills/Skill.js';
import { User } from './entities/users/User.js';

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
      Profile,
      User,
      ResumeCompany,
      ResumeCompanyLocation,
      ResumeBullet,
      ResumePosition,
      ResumeEducation,
      ResumeSkillCategory,
      ResumeSkillItem,
      ResumeHeadline,
      Archetype,
      ArchetypeEducation,
      ArchetypeSkillCategory,
      ArchetypeSkillItem,
      ArchetypePosition,
      ArchetypePositionBullet
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
