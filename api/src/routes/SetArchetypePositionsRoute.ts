import { inject, injectable } from '@needle-di/core';
import type { SetArchetypePositions } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SetArchetypePositionsRoute {
  public constructor(private readonly setPositions: SetArchetypePositions = inject(DI.Archetype.SetPositions)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id/positions',
      async ({ params, body, set }) => {
        const result = await this.setPositions.execute({
          archetypeId: params.id,
          positions: body.positions.map(p => ({
            resumeCompanyId: p.resume_company_id,
            jobTitle: p.job_title,
            displayCompanyName: p.display_company_name,
            locationLabel: p.location_label,
            startDate: p.start_date,
            endDate: p.end_date,
            roleSummary: p.role_summary,
            ordinal: p.ordinal,
            bullets: p.bullets.map(b => ({ bulletId: b.bullet_id, ordinal: b.ordinal }))
          }))
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          positions: t.Array(
            t.Object({
              resume_company_id: t.String({ format: 'uuid' }),
              job_title: t.String({ minLength: 1 }),
              display_company_name: t.String({ minLength: 1 }),
              location_label: t.String({ minLength: 1 }),
              start_date: t.String({ minLength: 1 }),
              end_date: t.String({ minLength: 1 }),
              role_summary: t.String(),
              ordinal: t.Integer({ minimum: 0 }),
              bullets: t.Array(
                t.Object({
                  bullet_id: t.String({ format: 'uuid' }),
                  ordinal: t.Integer({ minimum: 0 })
                })
              )
            })
          )
        })
      }
    );
  }
}
