import { defineConfig, MikroORM } from '@mikro-orm/sqlite';
import {
  Accomplishment,
  Company,
  Education,
  Experience,
  ExperienceSkill,
  GenerationPrompt,
  GenerationSettings,
  JobDescription,
  Profile,
  ResumeContent,
  Skill,
  SkillCategory
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
      ExperienceSkill,
      GenerationPrompt,
      GenerationSettings,
      JobDescription,
      ResumeContent,
      Skill,
      SkillCategory
    ],
    dbName: ':memory:',
    discovery: { warnWhenNoEntities: false }
  })
);
