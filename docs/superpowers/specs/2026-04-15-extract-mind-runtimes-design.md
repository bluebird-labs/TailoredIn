# Extract MIND Runtimes + Cross-Reference Linguist Interpreters

**Date:** 2026-04-15

## Problem

Runtimes like Node.js, Deno, and Bun don't appear in skill search results. They exist in the data but are trapped in metadata columns the sync pipeline never reads:

- **MIND**: `runtime_environments` JSONB column on `mind_skills` stores runtimes per language (e.g., JavaScript → ["Node.js", "Deno", "Bun"]) but `readMindSkills()` only reads `mind_name`, `mind_type`, `synonyms`, `mind_source_file`.
- **Linguist**: `interpreters` column stores runtime-related names (e.g., JavaScript → ["node", "nodejs"]) but `readLinguistLanguages()` only reads `aliases`.

## Solution

Two additions to `SkillSyncService`:

### 1. Extract MIND runtimes as standalone skills

New `readMindRuntimes()` method:
- Query `mind_skills` for rows with non-empty `runtime_environments`
- Extract each unique runtime as a `CandidateSkill` with:
  - `type`: `TECHNOLOGY`
  - `categoryNormalizedLabel`: `'backend'`
  - `sourcePriority`: `2` (same as other MIND entries)
- Deduplicate by `normalizedLabel` within the reader (same runtime can appear on multiple languages)

### 2. Cross-reference Linguist interpreters as runtime aliases

New `crossReferenceInterpreters()` method:
- Join through the **parent language name**: MIND tells us JavaScript has runtime "Node.js", Linguist tells us JavaScript has interpreters ["node", "nodejs"]
- For each runtime, check which interpreters from the same parent language fuzzy-match the runtime name
- **Matching rule**: strip non-alphanumeric characters from both names, then check prefix containment. Examples:
  - `"nodejs"` → `"nodejs"`, `"Node.js"` → `"nodejs"` → exact match ✓
  - `"node"` → `"node"`, `"Node.js"` → `"nodejs"` → `"nodejs".startsWith("node")` ✓
  - `"ts-node"` → `"tsnode"`, `"Node.js"` → `"nodejs"` → no match ✗
- Add matched interpreters as aliases on the runtime `CandidateSkill`

### Updated sync flow

```
Phase 2 (read sources):
  1. readLinguistLanguages()      → CandidateSkill[] (unchanged)
  2. readMindSkills()             → CandidateSkill[] (unchanged)
  3. readMindRuntimes()           → CandidateSkill[] (NEW)
  4. crossReferenceInterpreters() → mutates runtime candidates with interpreter aliases (NEW)

Phase 3 (deduplicate):
  allCandidates = [...linguist, ...mind, ...runtimes]
  deduplicateSkills(allCandidates)

Phase 4 (upsert):
  unchanged
```

## Edge Cases

- **Same runtime from multiple languages**: deduplicated by `normalizedLabel` within `readMindRuntimes()` — first occurrence wins
- **Interpreter matches multiple runtimes**: each gets the alias independently; outer dedup resolves collisions
- **Runtime also exists as standalone MIND skill** (e.g., from `runtime_environments.json` source file): dedup merges them, combining aliases from both sources

## Files to Modify

| File | Change |
|---|---|
| `infrastructure/src/skill-sync/SkillSyncService.ts` | Add `readMindRuntimes()`, `readLinguistInterpreters()`, `crossReferenceInterpreters()`, update `sync()` |
| `infrastructure/test-integration/skill-sync/skill-sync.test.ts` | Add tests for runtime extraction and interpreter aliasing |

## Verification

1. Integration test: sync with JavaScript having `runtimeEnvironments: ["Node.js", "Deno", "Bun"]` and Linguist interpreters `["node", "nodejs"]` → "Node.js" skill exists with aliases containing "nodejs" and "node"
2. Integration test: "Deno" and "Bun" exist as standalone skills with category "backend"
3. Integration test: search "nodejs" returns "Node.js"
4. Run: `bun run typecheck`, `bun run check`, `bun run --cwd infrastructure test:integration`
