# Plan: Skills Block 3c — Tanova Source Import

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Import Tanova Skills Taxonomy (~100 skills) into a source-scoped infrastructure table. Smallest dataset but well-structured with relationships, transferability scores, and proficiency levels. Data is in a nested JSON structure: `categories.<category>.<subcategory>.skills[]`.

## Depends on

- Block 2 (migration ordering)
- No code dependency — can be developed in parallel with other Block 3s

## Deliverables

### Migration

- [ ] New migration file:
  - `CREATE TABLE tanova_skills` — see spec for full schema (PK: `tanova_id`, `canonical_name`, `category`, `subcategory`, `tags` JSONB, `description`, `aliases` JSONB, `parent_skills`/`child_skills`/`related_skills` JSONB, `transferability` JSONB, `proficiency_levels` JSONB, `tanova_version`)

### Infrastructure Code

- [ ] `infrastructure/src/tanova/entities/TanovaSkillEntity.ts` — MikroORM entity for `tanova_skills`
- [ ] `infrastructure/src/tanova/schemas/` — Zod schema for JSON validation (handles nested `categories.<cat>.<subcat>.skills[]` structure)
- [ ] `infrastructure/src/tanova/TanovaDatasetParser.ts` — reads `taxonomy.json`, flattens nested structure into flat array of skills, validates with Zod
- [ ] `infrastructure/src/tanova/TanovaImporter.ts` — batch upserts (500 rows) into `tanova_skills`. Uses `INSERT ... ON CONFLICT DO UPDATE`.
- [ ] `infrastructure/src/tanova/index.ts` — barrel exports
- [ ] `infrastructure/scripts/tanova-import.ts` — CLI entry point: `bun tanova:import <path-to-json>`

### Wiring

- [ ] Register entity in `infrastructure/src/db/orm-config.ts`
- [ ] Add `tanova:import` script to package.json

### Tests

- [ ] Unit tests for `TanovaDatasetParser` + Zod schema (with fixture JSON)
- [ ] Integration test: import fixture, verify rows, verify idempotency

## Verification

```bash
bun run typecheck
bun run test
bun run --cwd infrastructure test:integration
bun run check
```
