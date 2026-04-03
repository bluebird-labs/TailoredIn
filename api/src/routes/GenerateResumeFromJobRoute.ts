import { readFileSync } from 'node:fs';
import { inject, injectable } from '@needle-di/core';
import type { GenerateResumeFromJob } from '@tailoredin/application';
import { ArchetypeKey, TemplateKey } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GenerateResumeFromJobRoute {
  public constructor(
    private readonly generateResumeFromJob: GenerateResumeFromJob = inject(DI.Resume.GenerateResumeFromJob)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/jobs/:id/generate-resume',
      async ({ params, body, set }) => {
        const result = await this.generateResumeFromJob.execute({
          jobId: params.id,
          archetype: body?.archetype as ArchetypeKey | undefined,
          keywords: body?.keywords,
          templateKey: body?.template_key as TemplateKey | undefined
        });

        if (!result.isOk) {
          set.status = 400;
          return { error: { code: 'GENERATION_FAILED', message: result.error.message } };
        }

        const pdfPath = result.value.pdfPath;
        const fileName = pdfPath.split('/').pop() ?? 'resume.pdf';
        const pdfBuffer = readFileSync(pdfPath);
        set.headers['content-type'] = 'application/pdf';
        set.headers['content-disposition'] = `attachment; filename="${fileName}"`;
        return pdfBuffer;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Optional(
          t.Object({
            archetype: t.Optional(t.Enum(ArchetypeKey)),
            keywords: t.Optional(t.Array(t.String())),
            template_key: t.Optional(t.Enum(TemplateKey))
          })
        )
      }
    );
  }
}
