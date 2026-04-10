import { defineConfig, MikroORM } from '@mikro-orm/sqlite';
import {
  Accomplishment,
  Application,
  Company,
  Education,
  Experience,
  ExperienceGenerationOverride,
  GenerationPrompt,
  GenerationSettings,
  JobDescription,
  Profile,
  ResumeContent
} from '@tailoredin/domain';

// Initialize MikroORM metadata so Collection API works in use case tests.
await MikroORM.init(
  defineConfig({
    entities: [
      Profile,
      Education,
      Company,
      Experience,
      Accomplishment,
      ExperienceGenerationOverride,
      GenerationPrompt,
      GenerationSettings,
      Application,
      JobDescription,
      ResumeContent
    ],
    connect: false,
    dbName: ':memory:'
  })
);
