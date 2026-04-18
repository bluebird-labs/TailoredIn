# libs/infrastructure/ — Implementations, ORM, Services, DI

Package: `@tailoredin/infrastructure`

Concrete implementations of all application ports: database repositories. Also owns DI tokens and the database schema.

## Keeping the diagram in sync

**`libs/infrastructure/DATABASE.mmd` is the source of truth for the database schema.** After adding migrations or modifying entities, regenerate with `pnpm run db:diagram` (requires DB running). The diagram must always reflect the schema.

## Directory structure

```
infrastructure/src/
├── db/
│   ├── migrations/      ← Timestamped MikroORM migrations
│   ├── seeds/           ← DatabaseSeeder + E2eSeeder
│   └── orm-config.ts    ← MikroORM config (imports entities from @tailoredin/domain)
���── repositories/        ← Postgres<Entity>Repository implementations
├── services/            ← External service adapters (LLM, etc.)
├���─ DI.ts                ← All DI tokens
└── index.ts
```

## Entities

Domain entities in `libs/domain/src/entities/` carry MikroORM decorators directly — there is no separate ORM entity layer. The `orm-config.ts` imports all entities from `@tailoredin/domain`.

## Repository pattern

`Postgres<Entity>Repository` — thin wrappers around `EntityManager`. One file per aggregate root:

```typescript
@Injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(@Inject(DI.Orm.EntityManager) private readonly em: EntityManager) {}

  public async findByIdOrFail(id: string): Promise<Experience> {
    return this.em.findOneOrFail(Experience, { id }, { populate: ['accomplishments'] });
  }

  public async save(experience: Experience): Promise<void> {
    this.em.persist(experience);
    await this.em.flush();
  }
}
```

No `toDomain()`/`toORM()` mapping — entities are used directly.

## DI tokens

All tokens live in `libs/infrastructure/src/DI.ts`, namespaced hierarchically:

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

1. Add a port interface to `libs/application/src/ports/<ServiceName>.ts`
2. Add it to `libs/application/src/ports/index.ts`
3. Create the implementation in `libs/infrastructure/src/services/<ServiceName>.ts` with `@Injectable()`
4. Add a DI token to `libs/infrastructure/src/DI.ts`
5. Add provider in the appropriate NestJS module:
   ```typescript
   { provide: DI.MyDomain.MyService, useClass: MyServiceImpl }
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

Run: `pnpm dev:migration:up`

## Seeders

`DatabaseSeeder` orchestrates per-domain seeders:
- `ResumeDataSeeder` �� profile, experience, accomplishments, education, companies
- `E2eSeeder` — minimal data for E2E tests

Run: `pnpm dev:seed`

## LLM prompt logging

Every LLM call made through `BaseLlmApiProvider` is logged to `<os.tmpdir()>/tailoredin/logs/llm/` (via `getLogDirectory()` from `@tailoredin/core`). Each log is a Markdown file named `{timestamp}_{RequestClassName}.md` containing four sections: **Input** (structured input data as JSON), **Output Schema** (the Zod schema as JSON Schema), **Prompt** (full rendered prompt text), and **Response** (parsed JSON on success, or error + raw response on failure).

When adding a new `LlmJsonRequest` subclass, override `getInput()` to expose the structured input data for logging. The default returns `undefined` (shown as "No structured input available").

## Integration tests

Run against a real PostgreSQL instance via Testcontainers:

```bash
pnpm --filter @tailoredin/infrastructure run test:integration
```

Tests live in `libs/infrastructure/test-integration/`. 60 s timeout per test.
