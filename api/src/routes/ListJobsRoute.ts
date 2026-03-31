import { inject, injectable } from '@needle-di/core';
import type { ListJobs } from '@tailoredin/application';
import { BusinessType, CompanyStage, Industry, JobStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

@injectable()
export class ListJobsRoute {
  public constructor(private readonly listJobs: ListJobs = inject(DI.Job.ListJobs)) {}

  public plugin() {
    return new Elysia().get(
      '/jobs',
      async ({ query }) => {
        const result = await this.listJobs.execute({
          limit: query.limit,
          offset: query.offset,
          statuses: toArray(query.status) as JobStatus[] | undefined,
          businessTypes: toArray(query.business_type) as BusinessType[] | undefined,
          industries: toArray(query.industry) as Industry[] | undefined,
          stages: toArray(query.stage) as CompanyStage[] | undefined,
          sort: query.sort ?? 'posted_at:desc'
        });

        return { data: result.items, pagination: result.pagination };
      },
      {
        query: t.Object({
          limit: t.Numeric({ minimum: 1, maximum: 100, default: 25 }),
          offset: t.Numeric({ minimum: 0, default: 0 }),
          status: t.Optional(t.Union([t.Array(t.Enum(JobStatus)), t.Enum(JobStatus)])),
          business_type: t.Optional(t.Union([t.Array(t.Enum(BusinessType)), t.Enum(BusinessType)])),
          industry: t.Optional(t.Union([t.Array(t.Enum(Industry)), t.Enum(Industry)])),
          stage: t.Optional(t.Union([t.Array(t.Enum(CompanyStage)), t.Enum(CompanyStage)])),
          sort: t.Optional(t.String())
        })
      }
    );
  }
}
