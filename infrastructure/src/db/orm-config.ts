import Path from 'node:path';
import { Migrator, TSMigrationGenerator } from '@mikro-orm/migrations';
import { defineConfig, SchemaGenerator, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { StatusCode } from '@tselect/status-code';
import { BaseEntity } from './BaseEntity.js';
import { Archetype } from './entities/archetypes/Archetype.js';
import { ArchetypeEducation } from './entities/archetypes/ArchetypeEducation.js';
import { ArchetypePosition } from './entities/archetypes/ArchetypePosition.js';
import { ArchetypePositionBullet } from './entities/archetypes/ArchetypePositionBullet.js';
import { ArchetypeSkillCategory } from './entities/archetypes/ArchetypeSkillCategory.js';
import { ArchetypeSkillItem } from './entities/archetypes/ArchetypeSkillItem.js';
import { Company } from './entities/companies/Company.js';
import { Job } from './entities/jobs/Job.js';
import { JobStatusUpdate } from './entities/jobs/JobStatusUpdate.js';
import { ResumeBullet } from './entities/resume/ResumeBullet.js';
import { ResumeCompany } from './entities/resume/ResumeCompany.js';
import { ResumeCompanyLocation } from './entities/resume/ResumeCompanyLocation.js';
import { ResumeEducation } from './entities/resume/ResumeEducation.js';
import { ResumeHeadline } from './entities/resume/ResumeHeadline.js';
import { ResumeSkillCategory } from './entities/resume/ResumeSkillCategory.js';
import { ResumeSkillItem } from './entities/resume/ResumeSkillItem.js';
import { Skill } from './entities/skills/Skill.js';
import { User } from './entities/users/User.js';

const PACKAGE_DIR = Path.resolve(import.meta.dirname);

export const ormConfig = defineConfig({
  debug: false,
  allowGlobalContext: true,

  entities: [
    BaseEntity,
    Company,
    Skill,
    Job,
    JobStatusUpdate,
    User,
    ResumeCompany,
    ResumeCompanyLocation,
    ResumeBullet,
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
  timezone: process.env.TZ,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DB,
  schema: process.env.POSTGRES_SCHEMA,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),

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
