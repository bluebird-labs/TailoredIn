import { inject, injectable } from '@needle-di/core';
import type { IngestJobByUrl } from '@tailoredin/application';
import { InvalidLinkedInUrlError, ScrapeFailedError } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class IngestJobByUrlRoute {
  public constructor(private readonly ingestJobByUrl: IngestJobByUrl = inject(DI.Job.IngestJobByUrl)) {}

  public plugin() {
    return new Elysia().post(
      '/jobs',
      async ({ body, set }) => {
        try {
          const result = await this.ingestJobByUrl.execute(body);
          set.status = 201;
          return { data: { ...result.job, id: result.job.id.value, companyName: result.company.name } };
        } catch (err) {
          if (err instanceof InvalidLinkedInUrlError) {
            set.status = 422;
            return { error: 'INVALID_URL', message: err.message };
          }
          if (err instanceof ScrapeFailedError) {
            set.status = 502;
            return { error: 'SCRAPE_FAILED', message: err.message };
          }
          throw err;
        }
      },
      {
        body: t.Union([
          t.Object({
            mode: t.Literal('url'),
            url: t.String({ format: 'uri' })
          }),
          t.Object({
            mode: t.Literal('manual'),
            fields: t.Object({
              jobTitle: t.String(),
              companyName: t.String(),
              companyLink: t.String(),
              location: t.String(),
              description: t.String(),
              descriptionHtml: t.String(),
              companyLogoUrl: t.Optional(t.String()),
              salary: t.Optional(t.Nullable(t.String())),
              jobType: t.Optional(t.Nullable(t.String())),
              remote: t.Optional(t.Nullable(t.String())),
              posted: t.Optional(t.Nullable(t.String())),
              jobLevel: t.Optional(t.Nullable(t.String())),
              applicants: t.Optional(t.Nullable(t.String())),
              applyLink: t.Optional(t.Nullable(t.String())),
              companyWebsite: t.Optional(t.Nullable(t.String()))
            })
          })
        ])
      }
    );
  }
}
