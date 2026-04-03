# application/ — Use Cases, Ports, DTOs

Package: `@tailoredin/application`

The orchestration layer — use cases coordinate domain objects and external services via port interfaces.

**Hard rules:**
- No DI framework annotations (`@injectable`, `inject`) — plain classes only
- No ORM imports (MikroORM, Kysely, etc.)
- No HTTP framework imports
- Only imports from `@tailoredin/domain` and `@tailoredin/core`

## Directory structure

```
application/src/
├── use-cases/        ← Organized in domain subdirectories
│   ├── experience/
│   ├── headline/
│   ├── resume-profile/
│   ├── tailored-resume/
│   ├── tag/
│   └── *.ts          ← Top-level for cross-cutting use cases
├── ports/            ← External service interfaces
├── dtos/             ← Data transfer objects
├── services/         ← Shared application-layer logic
└── index.ts          ← Barrel export
```

## Use case anatomy

Single `async execute(input)` method. One file per use case:

```typescript
export type GetJobInput = { jobId: string };

export class GetJob {
  public constructor(private readonly jobs: JobRepository) {}

  public async execute(input: GetJobInput): Promise<JobSummaryDto> {
    const job = await this.jobs.findByIdOrFail(new JobId(input.jobId));
    return toJobSummaryDto(job);
  }
}
```

- Input type named `<UseCase>Input`
- Constructor params are port interfaces or domain services — never concrete implementations
- No `new ConcreteRepository()` inside use cases

## Result pattern

Use `Result<T, E>` for **expected** failures (business rule violations). Throw for unexpected/critical errors:

```typescript
// Expected failure — caller must handle both cases
public async execute(input): Promise<Result<JobSummaryDto, 'NOT_FOUND' | 'ALREADY_APPLIED'>> { ... }

// Unexpected failure — let it propagate
const job = await this.jobs.findByIdOrFail(id); // throws if missing
```

## Port interfaces

Define what the application layer needs from the outside world. Live in `application/src/ports/`:

```typescript
export interface LlmService {
  extractJobPostingInsights(description: string): Promise<JobInsights>;
}

export interface ResumeRenderer {
  render(content: ResumeContentDto): Promise<Buffer>;
}
```

- Ports model the **application's intent**, not the infrastructure's capabilities
- Method signatures use DTOs or primitives — never ORM/infrastructure types

## DTOs

Plain `type` aliases — not classes. Named `<Concept>Dto`. Read-only:

```typescript
export type JobSummaryDto = {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly company: CompanyDto;
};
```

Sub-barrel exports keep imports clean:

```typescript
import { JobSummaryDto } from '@tailoredin/application';          // via index.ts
import type { JobSummaryDto } from '@tailoredin/application/dtos'; // via sub-barrel
```

## Sub-barrels

Three sub-barrels for targeted imports:
- `application/src/dtos/index.ts`
- `application/src/ports/index.ts`
- `application/src/use-cases/index.ts`

## Testing use cases

Mock ports in tests — never use real database or HTTP:

```typescript
const mockJobs: JobRepository = {
  findByIdOrFail: vi.fn().mockResolvedValue(fakeJob),
  // ...
};
const useCase = new GetJob(mockJobs);
```

Tests live in `application/test/use-cases/`.
