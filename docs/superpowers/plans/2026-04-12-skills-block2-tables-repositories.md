# Plan: Skills Block 2 — Domain Tables Migration + Repositories

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Create the PostgreSQL tables for the skills domain model and implement the repository adapters. This block introduces the `pg_trgm` extension and a GIN trigram index for fuzzy typeahead search on skills.

## Depends on

- Block 1 (domain entities + ports must exist)

## Deliverables

### Migration

- [ ] New migration file in `infrastructure/src/db/migrations/`:
  - `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
  - `CREATE TABLE skill_categories` — `id uuid PK`, `label text NOT NULL`, `normalized_label text NOT NULL UNIQUE`, `ordinal integer NOT NULL`, `created_at timestamptz`, `updated_at timestamptz`
  - `CREATE TABLE skills` — `id uuid PK`, `label text NOT NULL`, `normalized_label text NOT NULL UNIQUE`, `type text NOT NULL`, `category_id uuid FK NULLABLE → skill_categories(id)`, `description text NULLABLE`, `aliases jsonb DEFAULT '[]'`, `search_text text GENERATED ALWAYS AS (label || ' ' || COALESCE((SELECT string_agg(elem->>'label', ' ') FROM jsonb_array_elements(aliases) AS elem), '')) STORED`, `created_at timestamptz`, `updated_at timestamptz`
  - `CREATE INDEX skills_search_trgm_idx ON skills USING GIN (search_text gin_trgm_ops);`
  - `CREATE TABLE experience_skills` — `id uuid PK`, `experience_id uuid FK NOT NULL → experiences(id)`, `skill_id uuid FK NOT NULL → skills(id)`, `created_at timestamptz`
  - `UNIQUE (experience_id, skill_id)` on experience_skills

### Repositories

- [ ] `infrastructure/src/skill/PostgresSkillRepository.ts` — implements `SkillRepository`
  - `search(query, limit)` — uses `similarity(search_text, $1)` ranking + `search_text % $1 OR search_text ILIKE $1 || '%'` filter
  - `findByIds(ids)` — `WHERE id = ANY($1)`
  - `findAll()` — ordered by label
  - `findByNormalizedLabel(normalizedLabel)` — `WHERE normalized_label = $1`
- [ ] `infrastructure/src/skill/PostgresSkillCategoryRepository.ts` — implements `SkillCategoryRepository`
  - `findAll()` — ordered by ordinal
  - `findByIdOrFail(id)` — throws `EntityNotFoundError`

### Infrastructure Wiring

- [ ] Register `Skill`, `SkillCategory`, `ExperienceSkill` entities in `infrastructure/src/db/orm-config.ts`
- [ ] Add DI tokens for `SkillRepository` and `SkillCategoryRepository` in `infrastructure/src/DI.ts`
- [ ] Update `infrastructure/DATABASE.mmd` via `bun run db:diagram`

### Integration Tests

- [ ] `infrastructure/test-integration/skill/PostgresSkillRepository.test.ts` — CRUD + search with trigram fuzzy matching + alias search
- [ ] `infrastructure/test-integration/skill/PostgresSkillCategoryRepository.test.ts` — CRUD + ordering

## Verification

```bash
bun run typecheck
bun run test
bun run --cwd infrastructure test:integration
bun run check
bun run dep:check
bun run db:diagram
```
