import { spawn } from 'node:child_process';
import FS from 'node:fs/promises';
import Path from 'node:path';
import { injectable } from '@needle-di/core';
import type { RenderResumeInput, ResumeRenderer } from '@tailoredin/application';
import { TemplateKey } from '@tailoredin/domain';
import { format } from 'date-fns';
import { snakeCase } from 'lodash';
import { BrilliantCVGenerator } from '../resume/generators/BrilliantCVGenerator.js';
import { ButterickGenerator } from '../resume/generators/ButterickGenerator.js';
import { ExecutiveSidebarGenerator } from '../resume/generators/ExecutiveSidebarGenerator.js';
import { ExecutiveSingleGenerator } from '../resume/generators/ExecutiveSingleGenerator.js';
import { FinelyCraftedGenerator } from '../resume/generators/FinelyCraftedGenerator.js';
import { TypographicGenerator } from '../resume/generators/TypographicGenerator.js';
import type { TemplateGenerator } from '../resume/TemplateGenerator.js';
import { TYPST_DIR } from '../resume/TYPST_DIR.js';

const RESUMES_DIR = Path.resolve(import.meta.dirname, '..', '..', 'resumes');

function typstCompile(cwd: string, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('typst', ['compile', 'cv.typ', pdfPath], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    proc.stderr.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Typst compilation failed: ${Buffer.concat(chunks).toString()}`));
      } else {
        resolve();
      }
    });
    proc.on('error', reject);
  });
}

const generators: Record<TemplateKey, TemplateGenerator> = {
  [TemplateKey.BRILLIANT_CV]: new BrilliantCVGenerator(),
  [TemplateKey.TYPOGRAPHIC]: new TypographicGenerator(),
  [TemplateKey.BUTTERICK]: new ButterickGenerator(),
  [TemplateKey.FINELY_CRAFTED]: new FinelyCraftedGenerator(),
  [TemplateKey.EXECUTIVE_SINGLE]: new ExecutiveSingleGenerator(),
  [TemplateKey.EXECUTIVE_SIDEBAR]: new ExecutiveSidebarGenerator()
};

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: RenderResumeInput): Promise<string> {
    const { content, companyName, templateKey = TemplateKey.BRILLIANT_CV } = input;
    const outputDir = Path.resolve(RESUMES_DIR, snakeCase(companyName.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });

    const generator = generators[templateKey];
    await generator.generate(content, TYPST_DIR);
    await typstCompile(TYPST_DIR, pdfPath);

    return pdfPath;
  }
}
