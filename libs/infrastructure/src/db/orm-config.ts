import Path from 'node:path';
import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import { defineConfig, SchemaGenerator, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { env, envInt } from '@tailoredin/core';
import {
  Accomplishment,
  Account,
  Application,
  Company,
  Concept,
  ConceptDependency,
  Database,
  Education,
  Experience,
  ExperienceSkill,
  Framework,
  GenerationPrompt,
  GenerationSettings,
  JobDescription,
  JobFitRequirement,
  JobFitScore,
  Library,
  MarkupLanguage,
  Profile,
  ProgrammingLanguage,
  Protocol,
  QueryLanguage,
  ResumeContent,
  Service,
  Skill,
  SkillCategory,
  SkillDependency,
  Tool
} from '@tailoredin/domain';
import { StatusCode } from '@tselect/status-code';
import {
  EscoBroaderRelationOccPillarEntity,
  EscoBroaderRelationSkillPillarEntity,
  EscoConceptSchemeEntity,
  EscoDictionaryEntity,
  EscoGreenShareOccupationEntity,
  EscoIscoGroupEntity,
  EscoOccupationCollectionEntity,
  EscoOccupationEntity,
  EscoOccupationSkillRelationEntity,
  EscoSkillCollectionEntity,
  EscoSkillEntity,
  EscoSkillGroupEntity,
  EscoSkillSkillRelationEntity,
  EscoSkillsHierarchyEntity
} from '../esco/entities/index.js';
import { LinguistLanguageEntity } from '../linguist/entities/index.js';
import { MindConceptEntity, MindRelationEntity, MindSkillEntity } from '../mind/entities/index.js';
import { TanovaSkillEntity } from '../tanova/entities/index.js';

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
    allowGlobalContext: false,

    entities: [
      // Domain entities
      Account,
      Profile,
      Education,
      Company,
      Experience,
      Accomplishment,
      Application,
      JobDescription,
      JobFitScore,
      JobFitRequirement,
      ResumeContent,
      GenerationSettings,
      GenerationPrompt,
      Skill,
      SkillCategory,
      SkillDependency,
      ExperienceSkill,
      Concept,
      ConceptDependency,
      ProgrammingLanguage,
      MarkupLanguage,
      Framework,
      Library,
      Database,
      Tool,
      Service,
      Protocol,
      QueryLanguage,
      // ESCO reference data
      EscoSkillEntity,
      EscoOccupationEntity,
      EscoIscoGroupEntity,
      EscoSkillGroupEntity,
      EscoConceptSchemeEntity,
      EscoDictionaryEntity,
      EscoOccupationSkillRelationEntity,
      EscoSkillSkillRelationEntity,
      EscoBroaderRelationOccPillarEntity,
      EscoBroaderRelationSkillPillarEntity,
      EscoSkillsHierarchyEntity,
      EscoSkillCollectionEntity,
      EscoOccupationCollectionEntity,
      EscoGreenShareOccupationEntity,
      // Linguist reference data
      LinguistLanguageEntity,
      // MIND reference data
      MindSkillEntity,
      MindConceptEntity,
      MindRelationEntity,
      // Tanova reference data
      TanovaSkillEntity
    ],
    extensions: [Migrator, SchemaGenerator, SeedManager],

    discovery: { warnWhenNoEntities: true },
    namingStrategy: UnderscoreNamingStrategy,
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
    highlighter: new SqlHighlighter(),
    forceUtcTimezone: true,
    implicitTransactions: true,
    ensureDatabase: true,
    preferTs: true,
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
