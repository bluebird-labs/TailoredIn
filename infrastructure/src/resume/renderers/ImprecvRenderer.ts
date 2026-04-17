import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { generateImprecvTemplateTyp, generateImprecvYaml } from './imprecv-generators.js';

@Injectable()
export class ImprecvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await writeFile(`${tmpDir}/cv.yaml`, generateImprecvYaml(input));
      await writeFile(`${tmpDir}/template.typ`, generateImprecvTemplateTyp());

      const proc = Bun.spawn(['typst', 'compile', 'template.typ', 'output.pdf'], {
        cwd: tmpDir,
        stderr: 'pipe'
      });

      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`Typst compilation failed (exit ${exitCode}): ${stderr}`);
      }

      const pdfBuffer = await Bun.file(`${tmpDir}/output.pdf`).arrayBuffer();
      return new Uint8Array(pdfBuffer);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
