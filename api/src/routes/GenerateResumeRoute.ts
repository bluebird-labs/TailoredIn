import { readFileSync } from 'node:fs';
import { inject, injectable } from '@needle-di/core';
import type { GenerateResume } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GenerateResumeRoute {
  public constructor(private readonly generateResume: GenerateResume = inject(DI.Resume.GenerateResume)) {}

  public plugin() {
    return new Elysia().put(
      '/jobs/:id/generate-resume',
      async ({ params, set }) => {
        const result = await this.generateResume.execute({ jobId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }

        const pdfPath = result.value.pdfPath;
        const fileName = pdfPath.split('/').pop() ?? 'resume.pdf';
        const pdfBuffer = readFileSync(pdfPath);
        set.headers['content-type'] = 'application/pdf';
        set.headers['content-disposition'] = `attachment; filename="${fileName}"`;
        return pdfBuffer;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
