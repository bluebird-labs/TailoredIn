# infrastructure/ — Implementations, ORM, Services, DI

Package: `@tailoredin/infrastructure`

Concrete implementations of all application ports: database repositories. Also owns DI tokens and the database schema.

## Keeping the diagram in sync

**`infrastructure/DATABASE.mmd` is the source of truth for the database schema.** After adding migrations or modifying entities, regenerate with `bun run db:diagram` (requires DB running). The diagram must always reflect the schema.

## Directory structure

```
infrastructure/src/
├── db/
│   ├── entities/        ← MikroORM entities (separate from domain entities)
│   │   ├── companies/
│   │   ├── education/
│   │   ├── experience/
│   │   └── profile/
│   ├── migrations/      ← Timestamped Kysely migrations
│   ├── seeds/           ← DatabaseSeeder + per-domain seeders
│   ├── BaseEntity.ts
│   ├── BaseRepository.ts
│   └── orm-config.ts
├── repositories/        ← Postgres<Entity>Repository implementations
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
export class PostgresExperienceRepository implements ExperienceRepository {
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
  Profile: { ... },
  Education: { ... },
  Experience: { ... },
  Company: { ... },
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

Run: `bun dev:migration:up` (main branch) or `bun wt:migration:up` (worktree)

## Seeders

`DatabaseSeeder` orchestrates per-domain seeders:
- `ResumeDataSeeder` — profile, experience, accomplishments, education, companies
- `E2eSeeder` — minimal data for E2E tests

Run: `bun run db:seed`

## LLM prompt logging

Every LLM call made through `BaseLlmApiProvider` is logged to `logs/llm/` (gitignored). Each log is a Markdown file named `{timestamp}_{RequestClassName}.md` containing four sections: **Input** (structured input data as JSON), **Output Schema** (the Zod schema as JSON Schema), **Prompt** (full rendered prompt text), and **Response** (parsed JSON on success, or error + raw response on failure).

When adding a new `LlmJsonRequest` subclass, override `getInput()` to expose the structured input data for logging. The default returns `undefined` (shown as "No structured input available").

## Integration tests

Run against a real PostgreSQL instance via Testcontainers:

```bash
bun run --cwd infrastructure test:integration
```

Tests live in `infrastructure/test-integration/`. 60 s timeout per test.
