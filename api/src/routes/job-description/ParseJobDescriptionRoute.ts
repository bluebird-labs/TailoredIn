import { inject, injectable } from '@needle-di/core';
import type { ParseJobDescription } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ParseJobDescriptionRoute {
  public constructor(private readonly parseJobDescription: ParseJobDescription = inject(DI.JobDescription.Parse)) {}

  public plugin() {
    return new Elysia().post(
      '/job-descriptions/parse',
      async ({ body }) => {
        const data = await this.parseJobDescription.execute({ text: body.text });
        return { data };
      },
      {
        body: t.Object({
          text: t.String({ minLength: 1 })
        })
      }
    );
  }
}
