# Plan: Skills Block 3b — Linguist Source Import

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Import GitHub Linguist language data (500+ languages) into a source-scoped infrastructure table. Linguist is the most exhaustive list of programming languages, with aliases, colors (useful for UI), and type classification. Single YAML source file.

## Depends on

- Block 2 (migration ordering)
- No code dependency — can be developed in parallel with other Block 3s

## Deliverables

### Migration

- [ ] New migration file:
  - `CREATE TABLE linguist_languages` — see spec for full schema (PK: `linguist_name`, `linguist_type`, `color`, `aliases` JSONB, `extensions` JSONB, `interpreters` JSONB, `linguist_language_id`, `linguist_group`, `linguist_version`)

### Infrastructure Code

- [ ] `infrastructure/src/linguist/entities/LinguistLanguageEntity.ts` — MikroORM entity for `linguist_languages`
- [ ] `infrastructure/src/linguist/schemas/` — Zod schema for YAML validation (one entry per language key)
- [ ] `infrastructure/src/linguist/LinguistParser.ts` — reads `languages.yml`, parses YAML (use `yaml` package or Bun built-in), validates with Zod, returns typed array
- [ ] `infrastructure/src/linguist/LinguistImporter.ts` — batch upserts (500 rows) into `linguist_languages`. Uses `INSERT ... ON CONFLICT DO UPDATE`.
- [ ] `infrastructure/src/linguist/index.ts` — barrel exports
- [ ] `infrastructure/scripts/linguist-import.ts` — CLI entry point: `bun linguist:import <path-to-yaml>`

### Wiring

- [ ] Register entity in `infrastructure/src/db/orm-config.ts`
- [ ] Add `linguist:import` script to package.json

### Tests

- [ ] Unit tests for `LinguistParser` + Zod schema (with fixture YAML)
- [ ] Integration test: import fixture, verify rows, verify idempotency

## Verification

```bash
bun run typecheck
bun run test
bun run --cwd infrastructure test:integration
bun run check
```
