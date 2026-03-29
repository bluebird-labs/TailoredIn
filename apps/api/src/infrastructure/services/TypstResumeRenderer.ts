import FS from 'node:fs/promises';
import Path from 'node:path';
import { execSync } from 'node:child_process';
import { injectable } from '@needle-di/core';
import { format } from 'date-fns';
import { snakeCase } from 'lodash';
import type { RenderResumeInput, ResumeRenderer } from '@tailoredin/application-resume';
import { TypstFileGenerator } from '@tailoredin/resume/src/TypstFileGenerator.js';

const TYPST_CWD = Path.resolve(import.meta.dirname, '../../../../../../libs/resume/src/typst');
const RESUMES_DIR = Path.resolve(import.meta.dirname, '../../../../../../libs/resume/resumes');

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  async render(input: RenderResumeInput): Promise<string> {
    const { content, companyName, archetype } = input;
    const outputDir = Path.resolve(RESUMES_DIR, snakeCase(companyName.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${archetype}_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });
    await TypstFileGenerator.generate(content, TYPST_CWD);
    execSync(`typst compile cv.typ "${pdfPath}"`, { cwd: TYPST_CWD, stdio: 'pipe' });

    return pdfPath;
  }
}
