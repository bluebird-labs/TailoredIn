import { Elysia, t } from 'elysia';
import type { Container } from '@needle-di/core';
import { JobStatus } from '@tailoredin/domain-job';
import { ApplicationJobDI } from '@tailoredin/application-job';
import { ApplicationResumeDI } from '@tailoredin/application-resume';
import type { GetTopJob } from '@tailoredin/application-job';
import type { GetJob } from '@tailoredin/application-job';
import type { ChangeJobStatus } from '@tailoredin/application-job';
import type { GenerateResume } from '@tailoredin/application-resume';

export const jobRoutes = (container: Container) =>
  new Elysia({ prefix: '/jobs' })
    .get(
      '/tops/next',
      async ({ query }) => {
        const useCase = container.get(ApplicationJobDI.GetTopJob) as GetTopJob;
        const job = await useCase.execute({
          targetSalary: query.target_salary,
          hoursPostedMax: query.hours_posted_max
        });

        return { data: job };
      },
      {
        query: t.Object({
          target_salary: t.Numeric({ minimum: 100000 }),
          hours_posted_max: t.Optional(t.Numeric({ minimum: 1, default: 48 }))
        })
      }
    )
    .get(
      '/:id',
      async ({ params, query }) => {
        const useCase = container.get(ApplicationJobDI.GetJob) as GetJob;
        const job = await useCase.execute({
          jobId: params.id,
          targetSalary: query.target_salary
        });

        return { data: job };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        query: t.Object({
          target_salary: t.Numeric({ minimum: 100000 })
        })
      }
    )
    .put(
      '/:id/status',
      async ({ params, body, set }) => {
        const useCase = container.get(ApplicationJobDI.ChangeJobStatus) as ChangeJobStatus;
        const result = await useCase.execute({
          jobId: params.id,
          newStatus: body.status
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
        body: t.Object({ status: t.Enum(JobStatus) })
      }
    )
    .put(
      '/:id/generate-resume',
      async ({ params, set }) => {
        const useCase = container.get(ApplicationResumeDI.GenerateResume) as GenerateResume;
        const result = await useCase.execute({ jobId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }

        set.status = 201;
        return { data: { pdf_path: result.value.pdfPath } };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
