# Plan: Skills Block 6 — API Layer

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

HTTP routes for skill search (typeahead), category listing, and experience skill management. Elysia routes following existing patterns. DI wiring for new use cases and repositories.

## Depends on

- Block 2 (repositories)
- Block 5 (use cases)

## Deliverables

### Routes

- [ ] `api/src/routes/skill/SearchSkillsRoute.ts` — `GET /skills?q=<query>&limit=<n>`
  - Query params: `q` (string, required), `limit` (number, optional, default 20)
  - Returns `{ data: SkillDto[] }`
- [ ] `api/src/routes/skill/ListSkillCategoriesRoute.ts` — `GET /skill-categories`
  - Returns `{ data: SkillCategoryDto[] }`
- [ ] `api/src/routes/experience/SyncExperienceSkillsRoute.ts` — `PUT /experiences/:id/skills`
  - Body: `{ skillIds: string[] }`
  - Returns `{ data: ExperienceDto }`

### DI Wiring

- [ ] Add DI tokens for `SearchSkills`, `ListSkillCategories`, `SyncExperienceSkills` use cases in `infrastructure/src/DI.ts`
- [ ] Wire repositories + use cases in `api/src/container.ts`
- [ ] Register routes in `api/src/index.ts`

### Existing Route Updates

- [ ] Update experience GET routes to include skills in the `ExperienceDto` response

## Verification

```bash
bun run typecheck
bun run test
bun run check
bun run dep:check
# Manual: start API server, test endpoints with curl/httpie
```
