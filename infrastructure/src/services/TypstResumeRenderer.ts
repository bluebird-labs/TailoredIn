import { spawn } from 'node:child_process';
import FS from 'node:fs/promises';
import Path from 'node:path';
import { injectable } from '@needle-di/core';
import type { RenderResumeInput, ResumeRenderer } from '@tailoredin/application';
import { format } from 'date-fns';
import { snakeCase } from 'lodash';
import { TYPST_DIR } from '../resume/TYPST_DIR.js';
import { TypstFileGenerator } from '../resume/TypstFileGenerator.js';

const RESUMES_DIR = Path.resolve(import.meta.dirname, '..', '..', 'resumes');

function typstCompile(cwd: string, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('typst', ['compile', '--font-path', './fonts', 'cv.typ', pdfPath], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });
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

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: RenderResumeInput): Promise<string> {
    const { content, companyName, template } = input;
    const outputDir = Path.resolve(RESUMES_DIR, snakeCase(companyName.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });
    await TypstFileGenerator.generate(content, TYPST_DIR, template);
    await typstCompile(TYPST_DIR, pdfPath);

    return pdfPath;
  }
}
