# libs/application/ — Use Cases, Ports, DTOs

Package: `@tailoredin/application`

The orchestration layer — use cases coordinate domain objects and external services via port interfaces.

**Hard rules:**
- `@Injectable()` and `@Inject(DI.X.Y)` from `@nestjs/common` for DI wiring
- No ORM imports (MikroORM, Kysely, etc.)
- No HTTP framework imports
- Only imports from `@tailoredin/domain`, `@tailoredin/core`, and `@nestjs/common` (DI decorators only)

## Keeping the diagram in sync

**`libs/application/APPLICATION.mmd` is the source of truth for the application layer.** Whenever you add, remove, or rename a use case, port, or DTO — regenerate with `pnpm run app:diagram`. The diagram must always reflect the code.

## Directory structure

```
application/src/
├── use-cases/        ← Organized in domain subdirectories
│   ├── company/
│   ├── education/
│   ├── experience/
│   └── profile/
├── ports/            ← External service interfaces
├── dtos/             ← Data transfer objects
├── services/         ← Shared application-layer logic
└── index.ts          ← Barrel export
```

## Use case anatomy

Single `async execute(input)` method. One file per use case:

```typescript
export type GetExperienceInput = { experienceId: string };

@Injectable()
export class GetExperience {
  public constructor(@Inject(DI.Experience.Repository) private readonly experiences: ExperienceRepository) {}

  public async execute(input: GetExperienceInput): Promise<ExperienceDto> {
    const experience = await this.experiences.findByIdOrFail(input.experienceId);
    return toExperienceDto(experience);
  }
}
```

- Input type named `<UseCase>Input`
- `@Injectable()` + `@Inject(DI.X.Y)` for DI wiring via NestJS
- Constructor params are port interfaces or domain services — never concrete implementations
- No `new ConcreteRepository()` inside use cases

## Result pattern

Use `Result<T, E>` for **expected** failures (business rule violations). Throw for unexpected/critical errors:

```typescript
// Expected failure — caller must handle both cases
public async execute(input): Promise<Result<ExperienceDto, 'NOT_FOUND'>> { ... }

// Unexpected failure — let it propagate
const experience = await this.experiences.findByIdOrFail(id); // throws if missing
```

## Port interfaces

Interfaces for **external services** (data providers, search APIs, enrichment, etc.). Live in `application/src/ports/`:

```typescript
export interface CompanyDataProvider {
  enrichFromUrl(url: string, context?: string): Promise<CompanyEnrichmentResult>;
}
```

- Ports model the **application's intent**, not the infrastructure's capabilities
- Method signatures use DTOs or primitives — never ORM/infrastructure types
- **Repository interfaces live in `libs/domain/src/ports/`**, not here. Application ports are for external services only

## DTOs

Plain `type` aliases — not classes. Named `<Concept>Dto`. Read-only:

```typescript
export type ExperienceDto = {
  readonly id: string;
  readonly title: string;
  readonly company: CompanyDto;
};
```

Sub-barrel exports keep imports clean:

```typescript
import { ExperienceDto } from '@tailoredin/application';          // via index.ts
import type { ExperienceDto } from '@tailoredin/application/dtos'; // via sub-barrel
```

## Sub-barrels

Three sub-barrels for targeted imports:
- `application/src/dtos/index.ts`
- `application/src/ports/index.ts`
- `application/src/use-cases/index.ts`

## Testing use cases

Mock ports in tests — never use real database or HTTP:

```typescript
const mockExperiences: ExperienceRepository = {
  findByIdOrFail: jest.fn().mockResolvedValue(fakeExperience),
  // ...
};
const useCase = new GetExperience(mockExperiences);
```

Tests live in `application/test/use-cases/`.
