import { inject, injectable } from '@needle-di/core';
import type { GenerateResumeContent } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

/**
 * Generates tailored resume bullet points for each experience based on a job description.
 *
 * @example
 * curl -X POST http://localhost:8000/resume/generate \
 *   -H "Content-Type: application/json" \
 *   -d '{"jobDescriptionId": "your-jd-id"}' | jq
 */
@injectable()
export class GenerateResumeContentRoute {
  public constructor(private readonly generateResumeContent: GenerateResumeContent = inject(DI.Resume.Generate)) {}

  public plugin() {
    return new Elysia().post(
      '/resume/generate',
      async ({ body, set }) => {
        try {
          const data = await this.generateResumeContent.execute({ jobDescriptionId: body.jobDescriptionId });
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
          jobDescriptionId: t.String()
        })
      }
    );
  }
}
