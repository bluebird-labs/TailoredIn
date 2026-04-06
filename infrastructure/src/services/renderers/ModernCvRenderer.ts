// infrastructure/src/services/renderers/ModernCvRenderer.ts

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { generateModernCvTyp } from './modern-cv-generators.js';

const FONTS_DIR = join(import.meta.dir, '../../../typst/fonts');

@injectable()
export class ModernCvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await mkdir(join(tmpDir, 'fonts'));
      const fontsGlob = new Bun.Glob('**/*.{otf,ttf,woff,woff2}');
      for await (const fontFile of fontsGlob.scan(FONTS_DIR)) {
        const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
        await Bun.write(dest, Bun.file(join(FONTS_DIR, fontFile)));
      }

      await writeFile(join(tmpDir, 'resume.typ'), generateModernCvTyp(input));

      const proc = Bun.spawn(['typst', 'compile', '--font-path', './fonts', 'resume.typ', 'output.pdf'], {
        cwd: tmpDir,
        stderr: 'pipe'
      });

      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`Typst compilation failed (exit ${exitCode}): ${stderr}`);
      }

      const pdfBuffer = await Bun.file(join(tmpDir, 'output.pdf')).arrayBuffer();
      return new Uint8Array(pdfBuffer);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
