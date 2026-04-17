import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { glob } from 'glob';
import {
  generateConfigTyp,
  generateEducationTyp,
  generateMetadataToml,
  generateProfessionalTyp
} from '../typst-generators.js';

const TYPST_DIR = join(import.meta.dirname, '../../../typst/brilliant-cv');
const FONTS_DIR = join(import.meta.dirname, '../../../typst/fonts');

@Injectable()
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

    await copyFile(join(TYPST_DIR, 'cv.typ'), join(tmpDir, 'cv.typ'));
    await copyFile(join(TYPST_DIR, 'helpers.typ'), join(tmpDir, 'helpers.typ'));
    await copyFile(join(TYPST_DIR, 'modules_en', 'skills.typ'), join(tmpDir, 'modules_en', 'skills.typ'));

    await mkdir(join(tmpDir, 'fonts'));
    const fontFiles = await glob('**/*.{otf,ttf,woff,woff2}', { cwd: FONTS_DIR });
    for (const fontFile of fontFiles) {
      const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
      await copyFile(join(FONTS_DIR, fontFile), dest);
    }

    await writeFile(join(tmpDir, 'config.typ'), generateConfigTyp(input.template));
    const currentCompany = input.experiences.find(e => !e.endDate)?.companyName ?? null;
    await writeFile(
      join(tmpDir, 'metadata.toml'),
      generateMetadataToml(input.personal, input.headlineSummary, input.template, currentCompany)
    );
  }

  private async compile(
    tmpDir: string,
    experiences: ResumeRenderInput['experiences'],
    educations: ResumeRenderInput['educations']
  ): Promise<Uint8Array> {
    await writeFile(join(tmpDir, 'modules_en', 'professional.typ'), generateProfessionalTyp(experiences));
    await writeFile(join(tmpDir, 'modules_en', 'education.typ'), generateEducationTyp(educations));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('typst', ['compile', '--font-path', './fonts', 'cv.typ', 'output.pdf'], {
        cwd: tmpDir,
        stdio: ['ignore', 'ignore', 'pipe']
      });

      let stderr = '';
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Typst compilation failed (exit ${code}): ${stderr}`)));
      proc.on('error', reject);
    });

    return await readFile(join(tmpDir, 'output.pdf'));
  }
}
