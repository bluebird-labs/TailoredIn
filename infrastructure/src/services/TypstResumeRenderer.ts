import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import {
  analyzeLayout,
  generateConfigTyp,
  generateEducationTyp,
  generateMetadataToml,
  generateProfessionalTyp,
  type ResumeRenderEducation,
  type ResumeRenderExperience
} from './typst-generators.js';

const TYPST_DIR = join(import.meta.dir, '../../typst');
const MAX_PAGES = 2;

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await this.setupTempDir(tmpDir, input);

      // Mutable copies for trimming
      let educations = [...input.educations];
      const experiences = input.experiences.map(e => ({ ...e, bullets: [...e.bullets] }));

      let pdf = await this.compile(tmpDir, experiences, educations);
      let { totalPages } = analyzeLayout(pdf);

      // Phase 1: trim education entries (keep at least 1, newest first = index 0)
      while (totalPages > MAX_PAGES && educations.length > 1) {
        educations = educations.slice(0, -1);
        pdf = await this.compile(tmpDir, experiences, educations);
        ({ totalPages } = analyzeLayout(pdf));
      }

      // Phase 2: trim bullets from oldest experience upward (hard floor: 1)
      while (totalPages > MAX_PAGES) {
        let trimmed = false;
        for (let i = experiences.length - 1; i >= 0; i--) {
          if (experiences[i].bullets.length > 1) {
            experiences[i] = {
              ...experiences[i],
              bullets: experiences[i].bullets.slice(0, -1)
            };
            trimmed = true;
            break;
          }
        }
        if (!trimmed) break;
        pdf = await this.compile(tmpDir, experiences, educations);
        ({ totalPages } = analyzeLayout(pdf));
      }

      return pdf;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  private async setupTempDir(tmpDir: string, input: ResumeRenderInput): Promise<void> {
    await mkdir(join(tmpDir, 'modules_en'));

    // Copy static files
    await Bun.write(join(tmpDir, 'cv.typ'), Bun.file(join(TYPST_DIR, 'cv.typ')));
    await Bun.write(join(tmpDir, 'helpers.typ'), Bun.file(join(TYPST_DIR, 'helpers.typ')));
    await Bun.write(join(tmpDir, 'modules_en', 'skills.typ'), Bun.file(join(TYPST_DIR, 'modules_en', 'skills.typ')));

    // Copy fonts
    const fontsDir = join(TYPST_DIR, 'fonts');
    await mkdir(join(tmpDir, 'fonts'));
    const fontsGlob = new Bun.Glob('*.{otf,ttf,woff,woff2}');
    for await (const fontFile of fontsGlob.scan(fontsDir)) {
      await Bun.write(join(tmpDir, 'fonts', fontFile), Bun.file(join(fontsDir, fontFile)));
    }

    // Generate static derived files (don't change between trim iterations)
    await writeFile(join(tmpDir, 'config.typ'), generateConfigTyp(input.template));
    await writeFile(
      join(tmpDir, 'metadata.toml'),
      generateMetadataToml(input.personal, input.headlineSummary, input.template)
    );
  }

  private async compile(
    tmpDir: string,
    experiences: ResumeRenderExperience[],
    educations: ResumeRenderEducation[]
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
