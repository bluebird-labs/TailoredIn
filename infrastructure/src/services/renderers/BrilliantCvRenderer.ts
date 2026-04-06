import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import {
  generateConfigTyp,
  generateEducationTyp,
  generateMetadataToml,
  generateProfessionalTyp
} from '../typst-generators.js';

const TYPST_DIR = join(import.meta.dir, '../../../typst/brilliant-cv');
const FONTS_DIR = join(import.meta.dir, '../../../typst/fonts');

@injectable()
export class BrilliantCvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await this.setupTempDir(tmpDir, input);
      return await this.compile(tmpDir, input.experiences, input.educations);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  private async setupTempDir(tmpDir: string, input: ResumeRenderInput): Promise<void> {
    await mkdir(join(tmpDir, 'modules_en'));

    await Bun.write(join(tmpDir, 'cv.typ'), Bun.file(join(TYPST_DIR, 'cv.typ')));
    await Bun.write(join(tmpDir, 'helpers.typ'), Bun.file(join(TYPST_DIR, 'helpers.typ')));
    await Bun.write(join(tmpDir, 'modules_en', 'skills.typ'), Bun.file(join(TYPST_DIR, 'modules_en', 'skills.typ')));

    await mkdir(join(tmpDir, 'fonts'));
    const fontsGlob = new Bun.Glob('**/*.{otf,ttf,woff,woff2}');
    for await (const fontFile of fontsGlob.scan(FONTS_DIR)) {
      const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
      await Bun.write(dest, Bun.file(join(FONTS_DIR, fontFile)));
    }

    await writeFile(join(tmpDir, 'config.typ'), generateConfigTyp(input.template));
    await writeFile(
      join(tmpDir, 'metadata.toml'),
      generateMetadataToml(input.personal, input.headlineSummary, input.template)
    );
  }

  private async compile(
    tmpDir: string,
    experiences: ResumeRenderInput['experiences'],
    educations: ResumeRenderInput['educations']
  ): Promise<Uint8Array> {
    await writeFile(join(tmpDir, 'modules_en', 'professional.typ'), generateProfessionalTyp(experiences));
    await writeFile(join(tmpDir, 'modules_en', 'education.typ'), generateEducationTyp(educations));

    const proc = Bun.spawn(['typst', 'compile', '--font-path', './fonts', 'cv.typ', 'output.pdf'], {
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
  }
}
