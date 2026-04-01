import { execSync } from 'node:child_process';
import FS from 'node:fs/promises';
import Path from 'node:path';
import { injectable } from '@needle-di/core';
import type { RenderResumeInput, ResumeRenderer } from '@tailoredin/application';
import { format } from 'date-fns';
import { snakeCase } from 'lodash';
import { TYPST_DIR } from '../resume/TYPST_DIR.js';
import { TypstFileGenerator } from '../resume/TypstFileGenerator.js';
import { TEMPLATE_LAYOUTS } from '../resume/templateLayouts.js';

const RESUMES_DIR = Path.resolve(import.meta.dirname, '..', '..', 'resumes');

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: RenderResumeInput): Promise<string> {
    const { content, companyName, archetype, templateStyle } = input;
    const layoutConfig = TEMPLATE_LAYOUTS[templateStyle];
    const outputDir = Path.resolve(RESUMES_DIR, snakeCase(companyName.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${archetype}_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });
    await TypstFileGenerator.generate(content, TYPST_DIR, layoutConfig);
    execSync(`typst compile cv.typ "${pdfPath}"`, { cwd: TYPST_DIR, stdio: 'pipe' });

    return pdfPath;
  }
}
