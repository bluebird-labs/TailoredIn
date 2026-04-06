import { inject, injectable } from '@needle-di/core';
import type { GetCachedResumePdf } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

/**
 * Returns the cached resume PDF for a given job description, or 404 if none exists.
 *
 * @example
 * curl http://localhost:8000/resume/pdf/your-jd-id --output resume.pdf
 */
@injectable()
export class GetCachedResumePdfRoute {
  public constructor(private readonly getCachedResumePdf: GetCachedResumePdf = inject(DI.Resume.GetCachedPdf)) {}

  public plugin() {
    return new Elysia().get(
      '/resume/pdf/:jobDescriptionId',
      async ({ params, set }) => {
        const result = await this.getCachedResumePdf.execute({ jobDescriptionId: params.jobDescriptionId });
        if (!result) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: 'No cached PDF available' } };
        }
        set.headers['Content-Type'] = 'application/pdf';
        set.headers['Content-Disposition'] = 'inline; filename="resume.pdf"';
        return result.pdf;
      },
      {
        params: t.Object({
          jobDescriptionId: t.String()
        })
      }
    );
  }
}
