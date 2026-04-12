# Plan: Skills Block 4 — Skills Sync Pipeline

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Cross-source reconciliation process that reads from all 4 source tables (ESCO, MIND, Linguist, Tanova) and feeds the domain `skills` + `skill_categories` tables. Handles deduplication by `normalizedLabel` + alias matching, merges aliases from all sources, and applies source priority rules for conflicts. Manually triggered via `bun skills:sync`.

## Depends on

- Block 2 (domain tables must exist)
- Blocks 3a + 3b + 3c (all source tables must exist and be populated)

## Deliverables

### Sync Service

- [ ] `infrastructure/src/skill-sync/SkillSyncService.ts` — the core reconciliation logic:
  - **Category resolution**: maps source-level categories → domain `SkillCategory` records. Uses `normalizedLabel` for dedup. Creates categories: Programming Languages, Frontend, Backend, Databases, Cloud & Infrastructure, DevOps & CI/CD, AI & Machine Learning, Architecture & Methodology, Leadership & Communication.
  - **Skill resolution** (for each candidate):
    1. Compute `normalizedLabel` from canonical name
    2. Check if a skill with that `normalizedLabel` already exists
    3. Check if any existing skill's aliases match the candidate's `normalizedLabel` (or vice versa)
    4. Match found → **merge**: append new aliases, prefer richer description, keep existing ID
    5. No match → **insert** new skill
  - **Alias merging**: collect alternate names from all sources (`altLabels`, `synonyms`, `aliases`). Deduplicate by `normalizedLabel`.
  - **SkillType assignment** (see spec for full mapping table):
    - Linguist authoritative for `LANGUAGE`
    - MIND authoritative for `TECHNOLOGY`
    - ESCO transversal for `INTERPERSONAL`
    - Keyword matching for `METHODOLOGY`
  - **Source priority for conflicts**:
    - Display label: MIND > Linguist > Tanova > ESCO
    - Description: longest non-null wins
    - Aliases: union of all sources
  - **Upsert**: `INSERT ... ON CONFLICT (normalized_label) DO UPDATE`

### CLI Script

- [ ] `infrastructure/scripts/skills-sync.ts` — CLI entry point: `bun skills:sync`
  - Reads from all source tables
  - Calls `SkillSyncService`
  - Logs summary: categories created/updated, skills created/updated/merged, aliases added

### Wiring

- [ ] Add `skills:sync` script to package.json

### Tests

- [ ] Integration test: populate source tables with fixture data from multiple sources, run sync, verify:
  - Deduplication (same skill from multiple sources → single domain skill)
  - Alias merging (aliases from all sources combined)
  - Source priority (MIND label preferred over ESCO)
  - SkillType assignment correctness
  - Category assignment
  - Idempotency (re-run sync, same result)

## Verification

```bash
bun run typecheck
bun run test
bun run --cwd infrastructure test:integration
bun run check
```
