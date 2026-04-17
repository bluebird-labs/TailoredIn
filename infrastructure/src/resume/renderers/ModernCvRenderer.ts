// infrastructure/src/resume/renderers/ModernCvRenderer.ts

import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { glob } from 'glob';
import { generateModernCvTyp } from './modern-cv-generators.js';

const FONTS_DIR = join(import.meta.dirname, '../../../typst/fonts');

@Injectable()
export class ModernCvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await mkdir(join(tmpDir, 'fonts'));
      const fontFiles = await glob('**/*.{otf,ttf,woff,woff2}', { cwd: FONTS_DIR });
      for (const fontFile of fontFiles) {
        const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
        await copyFile(join(FONTS_DIR, fontFile), dest);
      }

      await writeFile(join(tmpDir, 'resume.typ'), generateModernCvTyp(input));

      await new Promise<void>((resolve, reject) => {
        const proc = spawn('typst', ['compile', '--font-path', './fonts', 'resume.typ', 'output.pdf'], {
          cwd: tmpDir,
          stdio: ['ignore', 'ignore', 'pipe']
        });

        let stderr = '';
        proc.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });
        proc.on('close', code =>
          code === 0 ? resolve() : reject(new Error(`Typst compilation failed (exit ${code}): ${stderr}`))
        );
        proc.on('error', reject);
      });

      return await readFile(join(tmpDir, 'output.pdf'));
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
