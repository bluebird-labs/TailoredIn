# Plan: Skills Block 3a — MIND Source Import

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Import MIND Tech Ontology data (~3,333 skills + 974 concepts + 10,897 relations) into source-scoped infrastructure tables. MIND is the richest source for modern tech skills. Data lives in per-category JSON files with varying fields per type. Follows the existing ESCO import pattern.

## Depends on

- Block 2 (migration ordering — MIND tables migration must come after domain tables)
- No code dependency — can be developed in parallel with other Block 3s

## Deliverables

### Migration

- [ ] New migration file:
  - `CREATE TABLE mind_skills` — see spec for full schema (PK: `mind_name`, JSONB arrays for synonyms/domains/skills/concepts, `mind_source_file`, `mind_version`)
  - `CREATE TABLE mind_concepts` — PK: `mind_name`, `mind_type`, `synonyms` JSONB, `mind_version`
  - `CREATE TABLE mind_relations` — composite PK: `(mind_source_name, mind_target_name, relation_type)`, `mind_version`

### Infrastructure Code

- [ ] `infrastructure/src/mind/entities/MindSkillEntity.ts` — MikroORM entity for `mind_skills`
- [ ] `infrastructure/src/mind/entities/MindConceptEntity.ts` — MikroORM entity for `mind_concepts`
- [ ] `infrastructure/src/mind/entities/MindRelationEntity.ts` — MikroORM entity for `mind_relations`
- [ ] `infrastructure/src/mind/schemas/` — Zod schemas for JSON validation (skill schema, concept schema — handle varying fields per type)
- [ ] `infrastructure/src/mind/MindDatasetParser.ts` — reads `skills/*.json` + `concepts/*.json` from a local repo clone, validates with Zod, returns typed dataset
- [ ] `infrastructure/src/mind/MindImporter.ts` — batch upserts (500 rows) into mind tables. Phase 1: skills + concepts. Phase 2: relations (derived from `impliesKnowingSkills`/`impliesKnowingConcepts` arrays). Uses `INSERT ... ON CONFLICT DO UPDATE`.
- [ ] `infrastructure/src/mind/index.ts` — barrel exports
- [ ] `infrastructure/scripts/mind-import.ts` — CLI entry point: `bun mind:import <path-to-repo-clone>`

### Wiring

- [ ] Register mind entities in `infrastructure/src/db/orm-config.ts`
- [ ] Add `mind:import` script to `infrastructure/package.json` (or root `package.json`)

### Tests

- [ ] Unit tests for `MindDatasetParser` + Zod schemas (with fixture data)
- [ ] Integration test: import a small fixture dataset, verify rows in all 3 tables, verify idempotency (re-import same data)

## Verification

```bash
bun run typecheck
bun run test
bun run --cwd infrastructure test:integration
bun run check
```
