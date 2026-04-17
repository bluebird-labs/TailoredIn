import { defineConfig, MikroORM } from '@mikro-orm/sqlite';
import { Accomplishment } from '../src/entities/Accomplishment.js';
import { Application } from '../src/entities/Application.js';
import { Company } from '../src/entities/Company.js';
import { Education } from '../src/entities/Education.js';
import { Experience } from '../src/entities/Experience.js';
import { GenerationPrompt } from '../src/entities/GenerationPrompt.js';
import { GenerationSettings } from '../src/entities/GenerationSettings.js';
import { JobDescription } from '../src/entities/JobDescription.js';
import { Profile } from '../src/entities/Profile.js';
import { ResumeContent } from '../src/entities/ResumeContent.js';

// Initialize MikroORM metadata so Collection API works in domain unit tests.
// Synchronous constructor — no database connection, just metadata registration.
new MikroORM(
  defineConfig({
    entities: [
      Profile,
      Education,
      Company,
      Experience,
      Accomplishment,
      GenerationPrompt,
      GenerationSettings,
      Application,
      JobDescription,
      ResumeContent
    ],
    dbName: ':memory:'
  })
);
