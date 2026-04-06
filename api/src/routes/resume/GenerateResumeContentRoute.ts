import { inject, injectable } from '@needle-di/core';
import type { GenerateResumeContentWithPdf } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

/**
 * Generates tailored resume bullet points for each experience based on a job description,
 * and persists the result on the job description for future retrieval.
 *
 * @example
 * curl -X POST http://localhost:8000/resume/generate \
 *   -H "Content-Type: application/json" \
 *   -d '{"jobDescriptionId": "your-jd-id"}' | jq
 */
@injectable()
export class GenerateResumeContentRoute {
  public constructor(
    private readonly generateResumeContent: GenerateResumeContentWithPdf = inject(DI.Resume.GenerateContentWithPdf)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/resume/generate',
      async ({ body, set }) => {
        try {
          const data = await this.generateResumeContent.execute({
            jobDescriptionId: body.jobDescriptionId,
            additionalPrompt: body.additionalPrompt,
            scope: body.scope
          });
          return { data };
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
          additionalPrompt: t.Optional(t.String()),
          scope: t.Optional(
            t.Union([
              t.Object({ type: t.Literal('headline') }),
              t.Object({ type: t.Literal('experience'), experienceId: t.String() })
            ])
          )
        })
      }
    );
  }
}
