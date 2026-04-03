# infrastructure/ — Implementations, ORM, Services, DI

Package: `@tailoredin/infrastructure`

Concrete implementations of all application ports: database repositories, LLM service, LinkedIn scraper, Typst resume renderer. Also owns DI tokens and the database schema.

## Directory structure

```
infrastructure/src/
├── db/
│   ├── entities/        ← MikroORM entities (separate from domain entities)
│   │   ├── companies/
│   │   ├── education/
│   │   ├── experience/
│   │   ├── headline/
│   │   ├── jobs/
│   │   ├── profile/
│   │   ├── resume-profile/
│   │   ├── skills/
│   │   ├── tag/
│   │   └── tailored-resume/
│   ├── migrations/      ← Timestamped Kysely migrations
│   ├── seeds/           ← DatabaseSeeder + per-domain seeders
│   ├── BaseEntity.ts
│   ├── BaseRepository.ts
│   └── orm-config.ts
├── repositories/        ← Postgres<Entity>Repository implementations
├── services/            ← LLM, scraper, renderer, color service
├── linkedin/            ← Playwright LinkedIn scraper
├── resume/              ← TypstResumeRenderer
├── brilliant-cv/        ← Typst template type definitions
├── DI.ts                ← All DI tokens
└── index.ts
```

## ORM entities vs domain entities

They are **always separate**. ORM entities in `db/entities/` are MikroORM-decorated classes. Domain entities in `domain/src/entities/` are plain TypeScript. Repositories map between them:

```typescript
// ORM entity — infrastructure only
@Entity({ tableName: 'experience' })
class ExperienceOrm extends BaseEntity { ... }

// Domain entity — pure TypeScript
class Experience extends AggregateRoot<ExperienceId> { ... }

// Repository maps between them
class PostgresExperienceRepository implements ExperienceRepository {
  private toDomain(orm: ExperienceOrm): Experience { ... }
  private toOrm(domain: Experience): ExperienceOrm { ... }
}
```

## Repository naming

`Postgres<Entity>Repository` — one file per aggregate root:

```typescript
@injectable()
export class PostgresJobRepository implements JobRepository {
  public constructor(@inject(DI.Orm.EntityManager) private readonly em: EntityManager) {}
}
```

## DI tokens

All tokens live in `infrastructure/src/DI.ts`, namespaced hierarchically:

```typescript
export const DI = {
  Orm: {
    EntityManager: new InjectionToken<EntityManager>('EntityManager'),
  },
  Job: {
    Repository: new InjectionToken<JobRepository>('JobRepository'),
    GetJob: new InjectionToken<GetJob>('GetJob'),
    ChangeJobStatus: new InjectionToken<ChangeJobStatus>('ChangeJobStatus'),
  },
  Resume: {
    Renderer: new InjectionToken<ResumeRenderer>('ResumeRenderer'),
    GenerateResume: new InjectionToken<GenerateResume>('GenerateResume'),
  },
  // ...
};
```

## Adding a new service (full workflow)

1. Add a port interface to `application/src/ports/<ServiceName>.ts`
2. Add it to `application/src/ports/index.ts`
3. Create the implementation in `infrastructure/src/services/<ServiceName>.ts` with `@injectable()`
4. Add a DI token to `infrastructure/src/DI.ts`
5. Bind in `api/src/container.ts`:
   ```typescript
   container.bind({ provide: DI.MyDomain.MyService, useClass: MyServiceImpl });
   ```

## Migrations

Timestamped filenames: `YYYYMMDD_description.ts`. Use Kysely DSL:

```typescript
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.createTable('company_brief') ...
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('company_brief').execute();
}
```

Run: `bun run db:migration:up`

## Seeders

`DatabaseSeeder` orchestrates per-domain seeders:
- `ResumeDataSeeder` — profile, experience, bullets, education, headlines
- `SkillsSeeder` — skill categories + items
- `JobDataSeeder` — jobs + companies
- `E2eSeeder` — minimal data for E2E tests

Run: `bun run db:seed`

## Typst resume template

Located in `infrastructure/typst/`. Based on **brilliant-cv v3.3.0**:

| File | Purpose |
|---|---|
| `cv.typ` | Root template — imports `metadata.toml` + modules |
| `metadata.toml` | Layout config (margins, fonts, paper size), personal info, ATS keyword injection |
| `helpers.typ` | `cv-section()` override with accent-colored divider |
| `professional.typ` | Work experience section |
| `skills.typ` | Skills section |
| `education.typ` | Education section |

Fonts: IBM Plex Sans + Mono OTF in `infrastructure/typst/fonts/`. The company's primary color is extracted at render time via `WebColorService` (Playwright + node-vibrant) and injected into the template.

## Job scoring

`PostgresJobRepository` uses Kysely to rank jobs by skill affinity overlap:

| Affinity | Weight |
|---|---|
| `EXPERT` | 8 |
| `INTEREST` | 2 |
| `AVOID` | −2 |

## Integration tests

Run against a real PostgreSQL instance via Testcontainers:

```bash
bun run --cwd infrastructure test:integration
```

Tests live in `infrastructure/test-integration/`. 60 s timeout per test.
