#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { GenerateResumeProfilePdf } from '@tailoredin/application';
import { env, envInt, Logger } from '@tailoredin/core';
import {
  createOrmConfig,
  DatabaseResumeContentFactory,
  DI,
  PostgresEducationRepository,
  PostgresExperienceRepository,
  PostgresProfileRepository,
  PostgresResumeProfileRepository,
  PostgresSkillCategoryRepository,
  TypstResumeRenderer
} from '@tailoredin/infrastructure';
import Yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const log = Logger.create('cvs');

Yargs(hideBin(process.argv))
  .command(
    'gen',
    'Generate a CV from the resume profile',
    yargs => {
      return yargs.options({
        company_name: {
          alias: ['c'],
          type: 'string',
          demandOption: false,
          default: 'Generic',
          description: 'The name of the company (used for output file naming)'
        }
      });
    },
    async _args => {
      const orm = await MikroORM.init(
        createOrmConfig({
          timezone: env('TZ'),
          user: env('POSTGRES_USER'),
          password: env('POSTGRES_PASSWORD'),
          dbName: env('POSTGRES_DB'),
          schema: env('POSTGRES_SCHEMA'),
          host: env('POSTGRES_HOST'),
          port: envInt('POSTGRES_PORT')
        })
      );

      const container = new Container();

      container.bind({ provide: MikroORM, useValue: orm });
      container.bind({ provide: DI.Profile.Repository, useClass: PostgresProfileRepository });
      container.bind({ provide: DI.ResumeProfile.Repository, useClass: PostgresResumeProfileRepository });
      container.bind({ provide: DI.Experience.Repository, useClass: PostgresExperienceRepository });
      container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
      container.bind({ provide: DI.SkillCategory.Repository, useClass: PostgresSkillCategoryRepository });
      container.bind({ provide: DI.Resume.Renderer, useClass: TypstResumeRenderer });
      container.bind({
        provide: DI.Resume.ContentFactory,
        useFactory: () =>
          new DatabaseResumeContentFactory(
            container.get(DI.Profile.Repository),
            container.get(DI.Experience.Repository),
            container.get(DI.Education.Repository),
            container.get(DI.SkillCategory.Repository)
          )
      });
      container.bind({
        provide: DI.ResumeProfile.GeneratePdf,
        useFactory: () =>
          new GenerateResumeProfilePdf(
            container.get(DI.ResumeProfile.Repository),
            container.get(DI.Resume.ContentFactory),
            container.get(DI.Resume.Renderer)
          )
      });

      // Resolve profile ID from DB (single-profile app)
      const result = await orm.em.getConnection().execute<[{ id: string }]>('SELECT id FROM profiles LIMIT 1');
      if (!result.length) {
        log.error('No profile found. Run seeds first.');
        await orm.close();
        return;
      }
      const profileId = result[0].id;

      const generatePdf = container.get(DI.ResumeProfile.GeneratePdf);

      let pdfPath: string;
      try {
        const output = await generatePdf.execute({ profileId });
        pdfPath = output.pdfPath;
      } catch (err: unknown) {
        log.error('Failed to generate PDF:', err);
        await orm.close();
        return;
      }

      await orm.close();

      log.info(`PDF generated: ${pdfPath}`);

      try {
        execSync(`open -a Preview "${pdfPath}"`, { stdio: 'inherit' });
      } catch (err) {
        log.error('Failed to open the PDF', err);
      }
    }
  )
  .parse();
