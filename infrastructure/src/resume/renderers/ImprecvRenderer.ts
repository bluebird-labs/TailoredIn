import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { generateImprecvTemplateTyp, generateImprecvYaml } from './imprecv-generators.js';

@Injectable()
export class ImprecvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await writeFile(join(tmpDir, 'cv.yaml'), generateImprecvYaml(input));
      await writeFile(join(tmpDir, 'template.typ'), generateImprecvTemplateTyp());

      await new Promise<void>((resolve, reject) => {
        const proc = spawn('typst', ['compile', 'template.typ', 'output.pdf'], {
          cwd: tmpDir,
          stdio: ['ignore', 'ignore', 'pipe']
        });

        let stderr = '';
        proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
        proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Typst compilation failed (exit ${code}): ${stderr}`)));
        proc.on('error', reject);
      });

      return await readFile(join(tmpDir, 'output.pdf'));
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
