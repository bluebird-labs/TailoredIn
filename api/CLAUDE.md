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

One file per logical endpoint (`<VerbNoun>Route.ts`). Each is an `@injectable()` class with a `plugin()` method:

```typescript
@injectable()
export class GetJobRoute {
  public constructor(
    @inject(DI.Job.GetJob) private readonly getJob: GetJob,
  ) {}

  public plugin(): Elysia {
    return new Elysia().get('/jobs/:id', async ({ params }) => {
      const result = await this.getJob.execute({ jobId: params.id });
      return { data: result };
    });
  }
}
```

Related endpoints are grouped into a route module (e.g., `TailoredResumeRoutes.ts`) instead of individual files.

## Response envelope

Every response follows one of two shapes (see `CONVENTIONS.md` for full details):

```typescript
// Success
{ data: T, pagination?: PaginationMeta }

// Error
{ error: { code: string, message: string } }
```

HTTP status codes carry the signal — no `success: boolean` fields.

## Error mapping

Map `Result` errors to HTTP status codes:

```typescript
const result = await this.changeStatus.execute(input);
if (!result.ok) {
  if (result.error === 'NOT_FOUND') throw new NotFoundError();
  if (result.error === 'INVALID_TRANSITION') return error(422, { code: 'INVALID_TRANSITION', ... });
}
return { data: result.value };
```

## Wiring a new service in container.ts

```typescript
// Use cases: plain class, useFactory
container.bind({
  provide: DI.Job.GetJob,
  useFactory: () => new GetJob(container.get(DI.Job.Repository)),
});

// Infrastructure services: class with DI, useClass
container.bind({
  provide: DI.Job.Repository,
  useClass: PostgresJobRepository,
});
```

## Eden Treaty client

`src/client.ts` exports the Elysia app type so the web layer gets full type safety:

```typescript
export type App = typeof app; // re-exported from index.ts
```

The web layer consumes this via `edenTreaty<App>(baseUrl)`. Adding new routes automatically updates the client's types — no manual sync needed.

## Mounting routes

In `src/index.ts`, resolve routes from the container:

```typescript
app.use(container.get(GetJobRoute).plugin());
app.use(container.get(TailoredResumeRoutes).plugin());
```
