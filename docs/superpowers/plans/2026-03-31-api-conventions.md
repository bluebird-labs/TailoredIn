# API Conventions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the documented API conventions (response envelope, limit/offset pagination, unified sort param, structured errors) to all existing endpoints.

**Architecture:** Three-layer change: (1) introduce shared pagination/error types in application layer, (2) migrate domain port + repository from page/pageSize to limit/offset, (3) update all route handlers to use new response envelope and params. Frontend updated in lockstep.

**Tech Stack:** Elysia + TypeBox, MikroORM/Kysely, TanStack Router/Query, Bun test

---

## File Structure

### New files
- `application/src/dtos/PaginationDto.ts` — shared `PaginatedDto<T>` type and `PaginationMeta` type
- `application/src/dtos/ApiErrorDto.ts` — shared `ApiErrorDto` type (`{ code, message }`)

### Modified files (by task)

**Domain layer:**
- `domain/src/ports/JobRepository.ts` — `FindPaginatedParams`: `page`/`pageSize` → `limit`/`offset`; `PaginatedResult`: `page`/`pageSize` → `limit`/`offset`/`hasNext`

**Application layer:**
- `application/src/dtos/JobListItemDto.ts` — replace `PaginatedJobListDto` with generic `PaginatedDto<JobListItemDto>`
- `application/src/dtos/index.ts` — export new types
- `application/src/use-cases/ListJobs.ts` — `ListJobsInput`: `page`/`pageSize` → `limit`/`offset`, `sortBy`/`sortDir` → `sort`; output uses `PaginatedDto`
- `application/test/use-cases/ListJobs.test.ts` — update to new param names

**Infrastructure layer:**
- `infrastructure/src/repositories/PostgresJobRepository.ts` — pass `limit`/`offset` directly (no more page math)
- `infrastructure/src/db/entities/jobs/JobOrmRepository.ts` — remove `(page - 1) * pageSize` offset calculation, accept raw `limit`/`offset`
- `infrastructure/test-integration/repositories/job-scoring.test.ts` — update params

**API layer:**
- `api/src/index.ts` — update global error handler to return `{ error: { code, message } }`
- `api/src/routes/ListJobsRoute.ts` — `page`/`page_size` → `limit`/`offset`; `sort_by`/`sort_dir` → `sort`; return `{ data, pagination }`
- `api/src/routes/IngestJobByUrlRoute.ts` — error shape: `{ error: { code, message } }`
- `api/src/routes/ChangeJobStatusRoute.ts` — error shape
- `api/src/routes/BulkChangeJobStatusRoute.ts` — error shape
- `api/src/routes/GenerateResumeRoute.ts` — error shape
- `api/src/routes/GetCompanyBriefRoute.ts` — error shape
- `api/src/routes/GenerateCompanyBriefRoute.ts` — error shape
- All remaining routes with error returns — same structured error pattern

**Web layer:**
- `web/src/routes/jobs/index.tsx` — `page`/`pageSize` → `limit`/`offset`; `sort_by`/`sort_dir` → `sort`; read `pagination` from response
- `web/src/lib/constants.ts` — rename `DEFAULT_PAGE_SIZE` → `DEFAULT_LIMIT`

---

## Task 1: Shared pagination and error types

**Files:**
- Create: `application/src/dtos/PaginationDto.ts`
- Create: `application/src/dtos/ApiErrorDto.ts`
- Modify: `application/src/dtos/index.ts`
- Modify: `application/src/dtos/JobListItemDto.ts`

- [ ] **Step 1: Create `PaginationDto.ts`**

```typescript
export type PaginationMeta = {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
};

export type PaginatedDto<T> = {
  items: T[];
  pagination: PaginationMeta;
};
```

- [ ] **Step 2: Create `ApiErrorDto.ts`**

```typescript
export type ApiErrorDto = {
  error: {
    code: string;
    message: string;
  };
};
```

- [ ] **Step 3: Update `JobListItemDto.ts` — remove `PaginatedJobListDto`**

Delete the `PaginatedJobListDto` type. It's replaced by `PaginatedDto<JobListItemDto>`.

- [ ] **Step 4: Update barrel `dtos/index.ts`**

Add exports:
```typescript
export type { PaginationMeta, PaginatedDto } from './PaginationDto.js';
export type { ApiErrorDto } from './ApiErrorDto.js';
```

Remove `PaginatedJobListDto` from the `JobListItemDto` re-export line.

- [ ] **Step 5: Commit**

```bash
git add application/src/dtos/
git commit -m "feat: add shared PaginationDto and ApiErrorDto types"
```

---

## Task 2: Migrate domain port to limit/offset

**Files:**
- Modify: `domain/src/ports/JobRepository.ts`
- Modify: `domain/src/index.ts` (verify exports)

- [ ] **Step 1: Update `FindPaginatedParams`**

Replace `page` and `pageSize` with `limit` and `offset`. Replace `sortBy`/`sortDir` with `sort`:

```typescript
export type FindPaginatedParams = {
  limit: number;
  offset: number;
  targetSalary: number;
  statuses?: JobStatus[];
  businessTypes?: BusinessType[];
  industries?: Industry[];
  stages?: CompanyStage[];
  sort: string;
  expertWeight?: number;
  interestWeight?: number;
  avoidWeight?: number;
};
```

- [ ] **Step 2: Update `PaginatedResult`**

```typescript
export type PaginatedResult<T> = {
  items: T[];
  total: number;
};
```

The `page`/`pageSize` fields are removed — the caller already knows `limit`/`offset` since it passed them in.

- [ ] **Step 3: Commit**

```bash
git add domain/src/ports/JobRepository.ts
git commit -m "refactor: domain JobRepository port uses limit/offset and sort string"
```

---

## Task 3: Update ListJobs use case

**Files:**
- Modify: `application/src/use-cases/ListJobs.ts`
- Modify: `application/test/use-cases/ListJobs.test.ts`

- [ ] **Step 1: Update test for new param names**

Update `ListJobs.test.ts`. The mock repository default becomes `findPaginated: async () => ({ items: [], total: 0 })`. Tests change `page`/`pageSize` to `limit`/`offset`, `sortBy`/`sortDir` to `sort`. The result shape changes to `{ items, pagination: { limit, offset, total, hasNext } }`.

Key test changes:
```typescript
// Input
await uc.execute({ limit: 25, offset: 25, targetSalary: 200000, sort: 'score:desc' });

// Assertions on result
expect(result.pagination.total).toBe(42);
expect(result.pagination.limit).toBe(25);
expect(result.pagination.offset).toBe(25);
expect(result.pagination.hasNext).toBe(false); // 25 + 25 >= 42
expect(result.items).toHaveLength(2);
```

The "passes params through to repository" test asserts:
```typescript
expect(capturedParams!.limit).toBe(10);
expect(capturedParams!.offset).toBe(20);
expect(capturedParams!.sort).toBe('posted_at:desc');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run --cwd application test
```

Expected: FAIL — `ListJobs` still uses old param names.

- [ ] **Step 3: Update `ListJobs.ts`**

```typescript
import type { BusinessType, CompanyStage, Industry, JobListItem, JobRepository, JobStatus } from '@tailoredin/domain';
import type { PaginatedDto } from '../dtos/PaginationDto.js';
import type { JobListItemDto } from '../dtos/JobListItemDto.js';

export type ListJobsInput = {
  limit: number;
  offset: number;
  targetSalary: number;
  statuses?: JobStatus[];
  businessTypes?: BusinessType[];
  industries?: Industry[];
  stages?: CompanyStage[];
  sort: string;
};

export class ListJobs {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: ListJobsInput): Promise<PaginatedDto<JobListItemDto>> {
    const result = await this.jobRepository.findPaginated({
      limit: input.limit,
      offset: input.offset,
      targetSalary: input.targetSalary,
      statuses: input.statuses,
      businessTypes: input.businessTypes,
      industries: input.industries,
      stages: input.stages,
      sort: input.sort
    });

    return {
      items: result.items.map(toJobListItemDto),
      pagination: {
        limit: input.limit,
        offset: input.offset,
        total: result.total,
        hasNext: input.offset + input.limit < result.total
      }
    };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
bun run --cwd application test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add application/src/use-cases/ListJobs.ts application/test/use-cases/ListJobs.test.ts
git commit -m "refactor: ListJobs use case uses limit/offset and sort string"
```

---

## Task 4: Update infrastructure repository

**Files:**
- Modify: `infrastructure/src/repositories/PostgresJobRepository.ts`
- Modify: `infrastructure/src/db/entities/jobs/JobOrmRepository.ts`
- Modify: `infrastructure/src/db/entities/jobs/JobScoringQueries.ts` (if sort parsing needed)
- Modify: `infrastructure/test-integration/repositories/job-scoring.test.ts`

- [ ] **Step 1: Update `PostgresJobRepository.findPaginated()`**

The method receives `FindPaginatedParams` which now has `limit`/`offset`/`sort` instead of `page`/`pageSize`/`sortBy`/`sortDir`. Update the call to `findPaginatedScored()`:

```typescript
public async findPaginated(params: FindPaginatedParams): Promise<PaginatedResult<JobListItem>> {
  const result = await this.orm.findPaginatedScored({
    limit: params.limit,
    offset: params.offset,
    // ... rest unchanged
  });
  // Map result — return { items, total } (no page/pageSize)
}
```

- [ ] **Step 2: Update `JobOrmRepository.findPaginatedScored()`**

Remove the offset calculation line `const offset = (params.page - 1) * params.pageSize;`. Accept `limit` and `offset` directly from params.

Parse the `sort` string into `sortBy` and `sortDir` for the Kysely queries:

```typescript
private parseSortParam(sort: string): { sortBy: 'score' | 'posted_at'; sortDir: 'asc' | 'desc' } {
  const [field, direction] = sort.split(':');
  const sortBy = field === 'posted_at' ? 'posted_at' : 'score';
  const sortDir = direction === 'asc' ? 'asc' : 'desc';
  return { sortBy, sortDir };
}
```

The Kysely `findPaginatedScoredJobs` call continues to receive `limit`, `offset`, `sortBy`, `sortDir` — the parse happens at the ORM repository boundary.

- [ ] **Step 3: Update integration tests**

In `job-scoring.test.ts`, change calls from `{ page: 1, pageSize: 25, ... }` to `{ limit: 25, offset: 0, sort: 'score:desc', ... }`.

- [ ] **Step 4: Run integration tests**

```bash
bun run --cwd infrastructure test:integration --timeout 60000
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/repositories/ infrastructure/src/db/entities/jobs/ infrastructure/test-integration/
git commit -m "refactor: repository layer uses limit/offset and sort string"
```

---

## Task 5: Update global error handler

**Files:**
- Modify: `api/src/index.ts`

- [ ] **Step 1: Update `onError` handler**

Change the error response from `{ error: string }` to `{ error: { code, message } }`:

```typescript
.onError(({ request, error, set, code }) => {
  const err = error as unknown as { statusCode?: number; message?: string };
  const message = err.message ?? String(error);

  if (code === 'VALIDATION') return;

  const statusCode = err.statusCode ?? 500;
  set.status = statusCode;
  logRequest(request, statusCode, startTimes.get(request));
  return {
    error: {
      code: statusCode === 500 ? 'INTERNAL_ERROR' : 'SERVER_ERROR',
      message: statusCode === 500 ? 'Internal server error' : message
    }
  };
})
```

- [ ] **Step 2: Commit**

```bash
git add api/src/index.ts
git commit -m "refactor: global error handler returns structured error envelope"
```

---

## Task 6: Update ListJobsRoute (pagination + sort)

**Files:**
- Modify: `api/src/routes/ListJobsRoute.ts`

- [ ] **Step 1: Update query schema and handler**

Replace `page`/`page_size` with `limit`/`offset`. Replace `sort_by`/`sort_dir` with `sort`. Return `{ data, pagination }` instead of `{ data: result }`:

```typescript
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
          targetSalary: query.target_salary,
          statuses: toArray(query.status) as JobStatus[] | undefined,
          businessTypes: toArray(query.business_type) as BusinessType[] | undefined,
          industries: toArray(query.industry) as Industry[] | undefined,
          stages: toArray(query.stage) as CompanyStage[] | undefined,
          sort: query.sort ?? 'score:desc'
        });

        return {
          data: result.items,
          pagination: result.pagination
        };
      },
      {
        query: t.Object({
          limit: t.Numeric({ minimum: 1, maximum: 100, default: 25 }),
          offset: t.Numeric({ minimum: 0, default: 0 }),
          target_salary: t.Numeric({ minimum: 100000 }),
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
```

- [ ] **Step 2: Commit**

```bash
git add api/src/routes/ListJobsRoute.ts
git commit -m "refactor: ListJobsRoute uses limit/offset, sort param, split data/pagination"
```

---

## Task 7: Update route error responses

**Files:**
- Modify: `api/src/routes/IngestJobByUrlRoute.ts`
- Modify: `api/src/routes/ChangeJobStatusRoute.ts`
- Modify: `api/src/routes/BulkChangeJobStatusRoute.ts`
- Modify: `api/src/routes/GenerateResumeRoute.ts`
- Modify: `api/src/routes/GetCompanyBriefRoute.ts`
- Modify: `api/src/routes/GenerateCompanyBriefRoute.ts`
- Modify: all other routes that return `{ error: string }`

- [ ] **Step 1: Update `IngestJobByUrlRoute.ts`**

Change error returns from `{ error: 'CODE', message: '...' }` to `{ error: { code: 'CODE', message: '...' } }`:

```typescript
if (err instanceof InvalidLinkedInUrlError) {
  set.status = 422;
  return { error: { code: 'INVALID_URL', message: err.message } };
}
if (err instanceof ScrapeFailedError) {
  set.status = 502;
  return { error: { code: 'SCRAPE_FAILED', message: err.message } };
}
```

- [ ] **Step 2: Update `ChangeJobStatusRoute.ts`**

```typescript
if (!result.isOk) {
  set.status = 404;
  return { error: { code: 'NOT_FOUND', message: result.error.message } };
}
```

- [ ] **Step 3: Update `BulkChangeJobStatusRoute.ts`**

```typescript
if (!result.isOk) {
  set.status = 400;
  return { error: { code: 'BULK_STATUS_FAILED', message: result.error.message } };
}
```

- [ ] **Step 4: Update all remaining routes with error returns**

Apply the same pattern to every route that returns `{ error: string }`:
- `GenerateResumeRoute.ts` — `{ error: { code: 'GENERATION_FAILED', message } }`
- `GetCompanyBriefRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `GenerateCompanyBriefRoute.ts` — `{ error: { code: 'GENERATION_FAILED', message } }`
- `UpdateCompanyRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteCompanyRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdateEducationRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteEducationRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdateHeadlineRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteHeadlineRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `CreatePositionRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdatePositionRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeletePositionRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `AddBulletRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdateBulletRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteBulletRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdateSkillCategoryRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteSkillCategoryRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `AddSkillItemRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdateSkillItemRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteSkillItemRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `UpdateArchetypeRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `DeleteArchetypeRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `SetArchetypePositionsRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `SetArchetypeSkillsRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `SetArchetypeEducationRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`
- `ReplaceLocationsRoute.ts` — `{ error: { code: 'NOT_FOUND', message } }`

The pattern is always: `return { error: result.error.message }` → `return { error: { code: 'NOT_FOUND', message: result.error.message } }` (or the appropriate code).

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/
git commit -m "refactor: all route error responses use structured { error: { code, message } }"
```

---

## Task 8: Update frontend

**Files:**
- Modify: `web/src/routes/jobs/index.tsx`
- Modify: `web/src/lib/constants.ts`

- [ ] **Step 1: Update `constants.ts`**

```typescript
export const DEFAULT_TARGET_SALARY = 200000;
export const DEFAULT_LIMIT = 25;
```

- [ ] **Step 2: Update `web/src/routes/jobs/index.tsx`**

Update the search schema:
```typescript
const jobSearchSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(DEFAULT_LIMIT).catch(DEFAULT_LIMIT),
  offset: z.number().min(0).optional().default(0).catch(0),
  view: z.enum(['triage', 'pipeline', 'archive', 'all']).optional().default('triage').catch('triage'),
  subStatus: z.string().default('all').catch('all'),
  businessType: z.union([z.nativeEnum(BusinessType), z.literal('all')]).optional().default('all').catch('all'),
  industry: z.union([z.nativeEnum(Industry), z.literal('all')]).optional().default('all').catch('all'),
  stage: z.union([z.nativeEnum(CompanyStage), z.literal('all')]).optional().default('all').catch('all'),
  sort: z.string().optional()
});
```

Update the query function to use `limit`/`offset`/`sort` and read `pagination` from response:
```typescript
queryFn: async () => {
  const res = await api.jobs.get({
    query: {
      limit: search.limit,
      offset: search.offset,
      target_salary: DEFAULT_TARGET_SALARY,
      status: statuses as any,
      business_type: businessTypeParam as any,
      industry: industryParam as any,
      stage: stageParam as any,
      sort: sortBy ? `${sortBy}:${search.sortDir}` : undefined
    }
  });
  if (res.error) throw new Error(String(res.error));
  return res.data;
},
```

Update pagination display to use `data.pagination`:
```typescript
const totalPages = data ? Math.ceil(data.pagination.total / data.pagination.limit) : 0;
const currentPage = data ? Math.floor(data.pagination.offset / data.pagination.limit) + 1 : 1;
```

Update page navigation:
```typescript
// Previous
onClick={() => setSearch({ offset: search.offset - search.limit })}
disabled={search.offset <= 0}

// Next
onClick={() => setSearch({ offset: search.offset + search.limit })}
disabled={data && !data.pagination.hasNext}
```

Update the filter reset to reset `offset: 0` instead of `page: 1`.

Update `setSearch` to reset offset on filter changes:
```typescript
const setSearch = (updates: Partial<JobSearch>) => {
  navigate({
    search: (prev: JobSearch) => ({
      ...prev,
      ...updates,
      offset:
        updates.offset !== undefined
          ? updates.offset
          : ('sort' in updates || 'view' in updates || 'subStatus' in updates ||
             'businessType' in updates || 'industry' in updates || 'stage' in updates)
            ? 0
            : prev.offset
    })
  });
};
```

Update the footer text from "page X of Y" to use offset-based calculation:
```typescript
<p className="text-sm text-muted-foreground">
  {data.pagination.total.toLocaleString()} jobs — page {currentPage} of {totalPages}
</p>
```

Update the `sortDir` references — since we now use a combined `sort` string, extract the current direction from `search.sort`:
```typescript
const currentSort = search.sort ?? `${viewConfig.defaultSort}:desc`;
const [sortBy, sortDir] = currentSort.split(':') as [string, 'asc' | 'desc'];

const toggleSort = (column: 'score' | 'posted_at') => {
  if (sortBy === column) {
    setSearch({ sort: `${column}:${sortDir === 'asc' ? 'desc' : 'asc'}` });
  } else {
    setSearch({ sort: `${column}:desc` });
  }
};
```

Also update `queryKeys` to use the new params — check if `web/src/lib/query-keys.ts` references `page`/`pageSize`/`sortBy`/`sortDir` and update accordingly.

- [ ] **Step 3: Verify the frontend compiles**

```bash
bun run --cwd web typecheck
```

- [ ] **Step 4: Commit**

```bash
git add web/src/
git commit -m "refactor: frontend uses limit/offset, sort param, reads pagination envelope"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Run all unit tests**

```bash
bun run --cwd application test
```

- [ ] **Step 2: Run integration tests**

```bash
bun run --cwd infrastructure test:integration --timeout 60000
```

- [ ] **Step 3: Run linter**

```bash
bun run check
```

- [ ] **Step 4: Start dev and verify manually**

```bash
bun run dev
```

Open the jobs page. Verify:
- Jobs load with pagination
- Sorting toggles work (score, posted_at)
- Filters reset to first page (offset 0)
- Previous/Next buttons work
- Page indicator shows correct "page X of Y"

- [ ] **Step 5: Final commit (if any lint/type fixes needed)**

```bash
git add -A
git commit -m "fix: lint and type fixes after API conventions migration"
```
