import { inject, injectable } from '@needle-di/core';
import type { GenerateResumePdf } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

/**
 * Generates a tailored resume PDF for a given job description.
 *
 * @example
 * curl -X POST http://localhost:8000/resume/pdf \
 *   -H "Content-Type: application/json" \
 *   -d '{"jobDescriptionId": "your-jd-id", "theme": "imprecv"}' \
 *   --output resume.pdf
 */
@injectable()
export class GenerateResumePdfRoute {
  public constructor(private readonly generateResumePdf: GenerateResumePdf = inject(DI.Resume.GeneratePdf)) {}

  public plugin() {
    return new Elysia().post(
      '/resume/pdf',
      async ({ body, set }) => {
        try {
          const pdf = await this.generateResumePdf.execute({
            jobDescriptionId: body.jobDescriptionId,
            theme: body.theme
          });
          set.headers['Content-Type'] = 'application/pdf';
          set.headers['Content-Disposition'] = 'attachment; filename="resume.pdf"';
          return pdf;
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        body: t.Object({
          jobDescriptionId: t.String(),
          theme: t.Optional(
            t.Union([t.Literal('brilliant-cv'), t.Literal('imprecv'), t.Literal('modern-cv'), t.Literal('linked-cv')])
          )
        })
      }
    );
  }
}
