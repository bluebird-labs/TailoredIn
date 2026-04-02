#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import * as Fs from 'node:fs/promises';
import * as Path from 'node:path';
import { Logger } from '@tailoredin/core';
import { ArchetypeKey } from '@tailoredin/domain';
import { generateCV, TYPST_DIR, TypstFileGenerator } from '@tailoredin/infrastructure';
import { format } from 'date-fns';
import Yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const log = Logger.create('cvs');
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
          choices: Object.values(ArchetypeKey),
          description: 'The archetype of the CV to generate'
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
        }
      });
    },
    async args => {
      const cvContent = generateCV({
        archetype: args.archetype as ArchetypeKey,
        companyName: args.company_name as string,
        keywords: args.keywords as string[]
      });

      const outputDir = Path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'Resumes',
        (args.company_name as string).toLowerCase()
      );
      const date = format(new Date(), 'yyyy-MM-dd');
      const pdfPath = Path.resolve(outputDir, `Sylvain-Estevez-${date}.pdf`);

      await Fs.mkdir(outputDir, { recursive: true });
      await TypstFileGenerator.generate(cvContent, TYPST_CWD);

      try {
        execSync(`typst compile cv.typ "${pdfPath}"`, { cwd: TYPST_CWD, stdio: 'pipe' });
      } catch (err: unknown) {
        const error = err as { stderr?: Buffer; message?: string };
        const stderr = error.stderr?.toString() ?? String(error.message);
        log.error('Failed to compile Typst CV:\n', stderr);
        return;
      }

      try {
        execSync(`open -a Preview "${pdfPath}"`, { stdio: 'inherit' });
      } catch (err) {
        log.error('Failed to open the PDF', err);
      }
    }
  )
  .parse();
