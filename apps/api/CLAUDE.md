# apps/api/ — HTTP Server & Composition Root

Package: `@tailoredin/api`

NestJS HTTP server and module composition root. This is the outermost layer — it wires everything together and exposes the API.

## Key files

| File | Purpose |
|---|---|
| `src/main.ts` | NestJS bootstrap, starts Express server |
| `src/app.module.ts` | Root NestJS module — imports all feature modules |
| `src/config/env.schema.ts` | Zod schema for environment validation |

## Controller anatomy

Controllers organized by domain (e.g., `controllers/experience/ExperienceController.ts`). Zod DTOs for request validation:

```typescript
@Controller('experiences')
export class ExperienceController {
  public constructor(
    @Inject(DI.Experience.GetExperience) private readonly getExperience: GetExperience,
  ) {}

  @Get(':id')
  public async get(@Param('id') id: string) {
    const result = await this.getExperience.execute({ experienceId: id });
    return { data: result };
  }
}
```

## Auth

- Global `JwtAuthGuard` (applied via `APP_GUARD`)
- `@Public()` decorator exempts routes (login, health)
- `@CurrentUser()` param decorator extracts `{ accountId, profileId }` from request

## Validation

- `createZodDto()` from `nestjs-zod` creates DTOs from Zod schemas
- Global `ZodValidationPipe` returns 422 on validation failures
- Zod schemas live alongside controllers

## Response envelope

See `CONVENTIONS.md` for the full response envelope spec (success/error shapes, HTTP status codes, pagination).

## Wiring providers in modules

```typescript
{
  provide: DI.Experience.Repository,
  useClass: PostgresExperienceRepository,
}
```

See [infrastructure/CLAUDE.md](../../libs/infrastructure/CLAUDE.md) for the full "Adding a new service" workflow (port → implementation → token → module provider).

## OpenAPI

`@nestjs/swagger` + `nestjs-zod` generates OpenAPI spec automatically from controllers and Zod DTOs.
