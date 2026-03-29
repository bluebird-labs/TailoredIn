#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import * as Fs from 'node:fs/promises';
import * as Path from 'node:path';
import { Archetype } from '@tailoredin/db';
import { format } from 'date-fns';
import Yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { TYPST_DIR, TypstFileGenerator, generateCV } from '@tailoredin/resume';

const AWESOME_COLOR_PRESETS = ['skyblue', 'red', 'nephritis', 'concrete', 'darknight'] as const;
const TYPST_CWD = TYPST_DIR;

Yargs(hideBin(process.argv))
  .command(
    'gen',
    'Generate a CV',
    yargs => {
      return yargs.options({
        archetype: {
          alias: ['a'],
          type: 'string',
          demandOption: true,
          choices: Object.values(Archetype),
          description: 'The archetype of the CV to generate'
        },
        theme: {
          alias: ['t'],
          type: 'string',
          demandOption: false,
          choices: AWESOME_COLOR_PRESETS,
          default: 'skyblue',
          description: 'The brilliant-cv accent color preset'
        },
        company_name: {
          alias: ['c'],
          type: 'string',
          demandOption: true,
          default: 'Acme',
          description: 'The name of the company'
        },
        keywords: {
          alias: ['k'],
          type: 'array',
          string: true,
          demandOption: false,
          default: [],
          description: 'Keywords to inject into PDF metadata for ATS matching'
        },
        main_color: {
          alias: ['mc'],
          type: 'string',
          demandOption: false,
          default: '',
          description: 'Custom hex accent color (overrides --theme), e.g. "#178FEA"'
        }
      });
    },
    async args => {
      const awesomeColor = (args.main_color as string) || (args.theme as string);

      const cvContent = generateCV({
        archetype: args.archetype as Archetype,
        awesomeColor,
        companyName: args.company_name as string,
        keywords: args.keywords as string[]
      });

      const outputDir = Path.resolve(import.meta.dirname, '..', '..', 'Resumes', (args.company_name as string).toLowerCase());
      const date = format(new Date(), 'yyyy-MM-dd');
      const pdfPath = Path.resolve(outputDir, `Sylvain-Estevez-${date}.pdf`);

      await Fs.mkdir(outputDir, { recursive: true });
      await TypstFileGenerator.generate(cvContent, TYPST_CWD);

      try {
        execSync(`typst compile cv.typ "${pdfPath}"`, { cwd: TYPST_CWD, stdio: 'pipe' });
      } catch (err: any) {
        const stderr = (err.stderr as Buffer | undefined)?.toString() ?? String(err.message);
        console.error('Failed to compile Typst CV:\n', stderr);
        return;
      }

      try {
        execSync(`open -a Preview "${pdfPath}"`, { stdio: 'inherit' });
      } catch (err) {
        console.error('Failed to open the PDF', err);
      }
    }
  )
  .parse();
