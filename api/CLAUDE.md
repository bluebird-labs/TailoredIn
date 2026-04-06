# api/ — HTTP Server & Composition Root

Package: `@tailoredin/api`

Elysia HTTP server, DI composition root, and Eden Treaty client export. This is the outermost layer — it wires everything together and exposes the API.

## Key files

| File | Purpose |
|---|---|
| `src/index.ts` | Elysia app bootstrap, port 8000, request logging middleware |
| `src/container.ts` | DI container setup — binds all services and use cases |
| `src/client.ts` | Eden Treaty type-safe client export for the web frontend |
| `src/helpers/profile-id.ts` | Shared helper to extract profile ID from requests |

## Route class anatomy

One file per endpoint (`<VerbNoun>Route.ts`), organized in domain subdirectories (e.g., `routes/experience/CreateExperienceRoute.ts`). Each is an `@injectable()` class with a `plugin()` method:

```typescript
@injectable()
export class GetExperienceRoute {
  public constructor(
    @inject(DI.Experience.GetExperience) private readonly getExperience: GetExperience,
  ) {}

  public plugin(): Elysia {
    return new Elysia().get('/experiences/:id', async ({ params }) => {
      const result = await this.getExperience.execute({ experienceId: params.id });
      return { data: result };
    });
  }
}
```

## Response envelope

See `CONVENTIONS.md` for the full response envelope spec (success/error shapes, HTTP status codes, pagination).

## Error mapping

Map `Result` errors to HTTP status codes:

```typescript
const result = await this.updateExperience.execute(input);
if (!result.ok) {
  if (result.error === 'NOT_FOUND') throw new NotFoundError();
}
return { data: result.value };
```

## Wiring a new service in container.ts

See [infrastructure/CLAUDE.md](../infrastructure/CLAUDE.md) for the full "Adding a new service" workflow (port → implementation → token → binding).

## Eden Treaty client

`src/client.ts` exports the Elysia app type so the web layer gets full type safety:

```typescript
export type App = typeof app; // re-exported from index.ts
```

The web layer consumes this via `edenTreaty<App>(baseUrl)`. Adding new routes automatically updates the client's types — no manual sync needed.

## Mounting routes

In `src/index.ts`, resolve routes from the container:

```typescript
app.use(container.get(ExperienceRoutes).plugin());
```
