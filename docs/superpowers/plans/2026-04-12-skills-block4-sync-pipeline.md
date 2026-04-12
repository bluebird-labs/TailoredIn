# Plan: Skills Block 4 — Skills Sync Pipeline

**Spec:** `/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Cross-source reconciliation service that reads from 4 populated source tables (Linguist, MIND, Tanova, ESCO) and upserts into the domain `skills` + `skill_categories` tables. This is the bridge between raw imported data and the clean skill catalog that the application layer queries. Infrastructure-only — no domain or application changes needed.

## Depends on

- Block 2 (domain tables must exist) — `DONE`
- Blocks 3a + 3b + 3c (all source tables must exist and be populated) — `DONE`
- Normalization fix + ordinal drop (slug-style `normalizeLabel`, 11 categories) — `DONE` (bd6b166)

## Deliverables

### Files to Create

| File | Purpose |
|------|---------|
| `infrastructure/src/skill-sync/SkillSyncService.ts` | Core reconciliation logic |
| `infrastructure/src/skill-sync/index.ts` | Barrel export |
| `infrastructure/scripts/skills-sync.ts` | CLI entry point: `bun skills:sync` |
| `infrastructure/test-integration/skill-sync/skill-sync.test.ts` | Integration tests |

### Files to Modify

| File | Change |
|------|--------|
| `infrastructure/src/index.ts` | Add barrel re-export |
| `package.json` | Add `"skills:sync"` script |

---

## SkillSyncService — Design

### Internal Types

```typescript
type CandidateSkill = {
  label: string;
  normalizedLabel: string;
  type: SkillType;
  categoryNormalizedLabel: string | null;
  description: string | null;
  aliases: SkillAlias[];
  sourcePriority: number; // 1=Linguist, 2=MIND, 3=Tanova, 4=ESCO
};
```

### Class Structure

```typescript
export class SkillSyncService {
  constructor(private readonly connection: Connection) {}

  async sync(): Promise<void>
  private async upsertCategories(): Promise<Map<string, string>>  // normalizedLabel -> id
  private async readLinguistLanguages(): Promise<CandidateSkill[]>
  private async readMindSkills(): Promise<CandidateSkill[]>
  private async readTanovaSkills(): Promise<CandidateSkill[]>
  private async readEscoSkills(): Promise<CandidateSkill[]>
  private deduplicateSkills(candidates: CandidateSkill[]): CandidateSkill[]
  private mergeInto(existing: CandidateSkill, candidate: CandidateSkill): string[]  // returns newly-added alias normalizedLabels
  private async upsertSkills(skills: CandidateSkill[], categoryMap: Map<string, string>): Promise<void>
  private async batchUpsert(table, columns, conflictColumns, rows): Promise<void>
}
```

### Phase 1: Category Upsert

11 fixed categories:

| Label | normalizedLabel |
|-------|-----------------|
| Programming Languages | `programming-languages` |
| Frontend | `frontend` |
| Backend | `backend` |
| Mobile | `mobile` |
| Databases | `databases` |
| Cloud & Infrastructure | `cloud-infrastructure` |
| DevOps & CI/CD | `devops-ci-cd` |
| Testing & Quality | `testing-quality` |
| AI & Machine Learning | `ai-machine-learning` |
| Architecture & Methodology | `architecture-methodology` |
| Leadership & Communication | `leadership-communication` |

SQL: `INSERT ... ON CONFLICT (normalized_label) DO UPDATE SET label = EXCLUDED.label, updated_at = EXCLUDED.updated_at`

Use `crypto.randomUUID()` for `id` — discarded on conflict (not in UPDATE SET), preserving existing IDs. After upsert, `SELECT id, normalized_label FROM skill_categories` to build the lookup map.

### Phase 2: Source Reading

**Processing order: Linguist → MIND → Tanova → ESCO**

Linguist goes first because it's the most authoritative source for programming language labels and types. By processing it first, Linguist "owns" language entries by default — no special-case override logic needed in `mergeInto`. MIND then fills in the tech skills Linguist doesn't cover (frameworks, databases, tools). Tanova and ESCO add the remaining soft skills and methodology.

---

**Linguist** (`readLinguistLanguages`) — ~500 languages (filtered), priority 1
```sql
SELECT "linguist_name", "linguist_type", "aliases"
FROM "linguist_languages"
WHERE "linguist_type" IN ('programming', 'markup', 'data')
```
- **label** = `linguist_name`
- **type**: `"programming"` → `LANGUAGE`, `"markup"`/`"data"` → `TECHNOLOGY`
- **aliases**: `aliases` jsonb array → `{label, normalizedLabel}` each
- **category**: all → `programming-languages`
- **sourcePriority** = 1
- **description** = null

---

**MIND** (`readMindSkills`) — ~3,333 skills, priority 2
```sql
SELECT "mind_name", "mind_type", "synonyms", "mind_source_file" FROM "mind_skills"
```
- **label** = `mind_name`
- **type**: `mind_type` jsonb array contains `"ProgrammingLanguage"` → `LANGUAGE`, else → `TECHNOLOGY`
- **aliases**: `synonyms` jsonb array → `{label, normalizedLabel}` each
- **category**: mapped from `mind_source_file` (see mapping table below)
- **sourcePriority** = 2
- **description** = null

---

**Tanova** (`readTanovaSkills`) — ~100 skills, priority 3
```sql
SELECT "canonical_name", "category", "subcategory", "aliases", "description" FROM "tanova_skills"
```
- **label** = `canonical_name`
- **type** derived from `category` field directly (no keyword heuristics):
  - `category = "technology"` + `subcategory = "programming_languages"` → `LANGUAGE`
  - `category = "technology"` → `TECHNOLOGY`
  - `category = "methodology"` → `METHODOLOGY`
  - `category = "soft_skill"` → `INTERPERSONAL`
  - fallback → `TECHNOLOGY`
- **aliases**: `aliases` jsonb array
- **category**: mapped from `subcategory` (see mapping table below)
- **sourcePriority** = 3
- **description** = `description`

---

**ESCO** (`readEscoSkills`) — digital + transversal collections only, priority 4
```sql
SELECT es."preferred_label", es."skill_type", es."alt_labels", es."description",
       array_agg(DISTINCT esc."collection_type") AS "collection_types"
FROM "esco_skills" es
INNER JOIN "esco_skill_collections" esc ON es."concept_uri" = esc."concept_uri"
WHERE esc."collection_type" IN ('digital', 'transversal')
GROUP BY es."concept_uri", es."preferred_label", es."skill_type", es."alt_labels", es."description"
```
- **label** = `preferred_label`
- **type**:
  - transversal (any skill_type) → `INTERPERSONAL` — all transversal skills go here regardless of knowledge vs competence
  - digital → `TECHNOLOGY` — accepted as a known approximation; some digital skills are closer to METHODOLOGY but there's no clean signal to distinguish them. Known wart, clean up by hand later if needed.
- **aliases**: split `alt_labels` on `|`, trim each
- **category**: transversal → `leadership-communication`; digital → `null` (too diverse for a single category)
- **sourcePriority** = 4
- **description** = `description`

### Source File → Category Mapping

Shared constant mapping `mind_source_file` / Tanova `subcategory` → category `normalizedLabel`:

```typescript
const SOURCE_TO_CATEGORY: Record<string, string> = {
  // MIND source files
  programming_languages: 'programming-languages',
  markup_languages: 'frontend',             // MIND scopes this to web context (HTML, CSS, SVG)
  frameworks_frontend: 'frontend',
  frameworks_mobile: 'mobile',
  frameworks_backend: 'backend',
  frameworks_fullstack: 'backend',
  libraries_ui: 'frontend',
  libraries_data: 'ai-machine-learning',    // Pandas, NumPy, etc. are data science libs
  protocols: 'backend',                     // HTTP, gRPC, WebSockets — cross-cutting but backend is least-bad
  runtime_environments: 'backend',          // Node.js, Deno, Bun
  databases: 'databases',
  databases_nosql: 'databases',
  cloud_services: 'cloud-infrastructure',
  cloud_platforms: 'cloud-infrastructure',
  infrastructure: 'cloud-infrastructure',
  operating_systems: 'cloud-infrastructure',
  containerization: 'devops-ci-cd',
  ci_cd: 'devops-ci-cd',
  devops: 'devops-ci-cd',
  build_tools: 'devops-ci-cd',
  package_managers: 'devops-ci-cd',
  version_control: 'devops-ci-cd',          // Git — universal but no better bucket
  ides: 'devops-ci-cd',
  testing: 'testing-quality',
  machine_learning: 'ai-machine-learning',
  ai_tools: 'ai-machine-learning',
  data_science: 'ai-machine-learning',
  architectural_patterns: 'architecture-methodology',
  design_patterns: 'architecture-methodology',
  // Tanova subcategories
  frontend_frameworks: 'frontend',
  backend_frameworks: 'backend',
  mobile_development: 'mobile',
  project_management: 'architecture-methodology',
  leadership: 'leadership-communication',
};
```

Unknown keys → `null` (uncategorized).

### Phase 3: Deduplication Algorithm

All candidates concatenated in priority order (Linguist → MIND → Tanova → ESCO).

Two in-memory indexes:
1. `byNormalizedLabel: Map<string, CandidateSkill>` — primary normalizedLabel → skill
2. `aliasIndex: Map<string, string>` — alias normalizedLabel → owning skill's normalizedLabel

For each candidate:
1. Check `candidate.normalizedLabel` in `byNormalizedLabel` → match
2. Check `candidate.normalizedLabel` in `aliasIndex` → follow pointer → match
3. Check candidate's alias normalizedLabels in `byNormalizedLabel` → match
4. Check candidate's alias normalizedLabels in `aliasIndex` → match
5. Match found → `mergeInto(existing, candidate)` **then register any new aliases from the merge in `aliasIndex`**
6. No match → insert into `byNormalizedLabel` + register all aliases in `aliasIndex`

**Critical: after merging (step 5), scan the merged skill's aliases and register any newly-added ones in `aliasIndex`.** Without this, a second source contributing the same alias would miss the match. Implementation: `mergeInto` returns the list of newly-added alias normalizedLabels, and the caller registers them.

### Merge Strategy

- **Label**: keep existing (higher priority, processed first — Linguist owns language labels, MIND owns tech labels)
- **Description**: longest non-null wins
- **SkillType**: keep existing (first source wins by processing order — no special-case overrides needed because Linguist is processed first for languages)
- **Category**: keep first non-null
- **Aliases**: union by normalizedLabel. Also add candidate's primary label as alias if `candidate.normalizedLabel !== existing.normalizedLabel`. Also union in candidate's own aliases. All deduped by normalizedLabel, excluding the existing skill's own normalizedLabel.

Example: MIND has "PostgreSQL" (normalized: `postgresql`, alias: "Postgres" → `postgres`). Later ESCO has "Postgres" (normalized: `postgres`). Match found via aliasIndex. Merge: MIND's "PostgreSQL" stays as primary label. ESCO's "Postgres" is already an alias. No change needed.

### Phase 4: Skill Upsert

```sql
INSERT INTO "skills" ("id", "label", "normalized_label", "type", "category_id", "description", "aliases", "created_at", "updated_at")
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT ("normalized_label") DO UPDATE SET
  "label" = EXCLUDED."label",
  "type" = EXCLUDED."type",
  "category_id" = EXCLUDED."category_id",
  "description" = EXCLUDED."description",
  "aliases" = EXCLUDED."aliases",
  "updated_at" = EXCLUDED."updated_at"
```

Each row: `[crypto.randomUUID(), label, normalizedLabel, type, categoryId|null, description|null, JSON.stringify(aliases), new Date(), new Date()]`

Batch at 500 rows. Same `batchUpsert` pattern as `MindImporter` (`infrastructure/src/mind/MindImporter.ts`).

**Idempotency note:** Re-running sync fully overwrites `label`, `type`, `category_id`, `description`, and `aliases` for every matched skill. This is intentional — the sync is a bootstrap tool, not an ongoing sync. No user-edited skills exist yet. If user-editable skills are added later, an `is_user_modified` flag should gate the upsert. Document this trade-off in a code comment.

---

## CLI Script

`infrastructure/scripts/skills-sync.ts` — follows `mind-import.ts` pattern:
- `MikroORM.init(getOrmConfig())` → connection → `new SkillSyncService(connection).sync()` → `orm.close(true)`
- No CLI arguments (reads from DB, writes to DB)
- Root `package.json`: `"skills:sync": "bun --env-file=.env run infrastructure/scripts/skills-sync.ts"`

---

## Integration Test

File: `infrastructure/test-integration/skill-sync/skill-sync.test.ts`

### Fixture Data (seeded via direct SQL before tests)

**mind_skills** (6 rows):
- "JavaScript" — type: `["ProgrammingLanguage"]`, source: `programming_languages`, synonyms: `["JS"]`
- "React" — type: `["Framework"]`, source: `frameworks_frontend`, synonyms: `["React.js", "ReactJS"]`
- "PostgreSQL" — type: `["Database"]`, source: `databases`, synonyms: `["Postgres"]`
- "Docker" — type: `["Tool"]`, source: `containerization`, synonyms: `[]`
- "TensorFlow" — type: `["Library"]`, source: `machine_learning`, synonyms: `["TF"]`
- "ExoticThing" — type: `["Tool"]`, source: `exotic_things`, synonyms: `[]` (unknown source file → null category)

**linguist_languages** (3 rows):
- "JavaScript" — type: `programming`, aliases: `["JS"]` (dupe with MIND)
- "TypeScript" — type: `programming`, aliases: `["TS"]`
- "HTML" — type: `markup`, aliases: `[]`

**tanova_skills** (4 rows):
- "React" — category: `technology`, subcategory: `frontend_frameworks`, aliases: `["React.js"]`, description: short (dupe with MIND)
- "Agile" — category: `methodology`, subcategory: `project_management`, aliases: `["Agile Methodology"]`, description: long
- "Team Leadership" — category: `soft_skill`, subcategory: `leadership`, aliases: `["Team Lead"]`, description: short
- "Scrum" — category: `methodology`, subcategory: `project_management`, aliases: `[]`, description: medium

**esco_skills + esco_skill_collections** (3 rows):
- "adapt to change" — transversal, skill/competence, alt_labels: `"embrace change|flexibility"`
- "programming concepts" — digital, knowledge, alt_labels: `"coding principles"`
- "JavaScript" — digital, knowledge, alt_labels: `"JS|ECMAScript"` (dupe with Linguist + MIND)

### Test Scenarios

1. **Creates all 11 categories** — count + label verification
2. **Deduplicates JavaScript** across Linguist + MIND + ESCO → single row, Linguist label wins (processed first), LANGUAGE type, aliases unioned (JS from all sources, ECMAScript from ESCO)
3. **Deduplicates React** across MIND + Tanova → single row, MIND label (processed before Tanova), aliases deduped
4. **Correct categories** — JavaScript → Programming Languages, React → Frontend, Docker → DevOps & CI/CD, TensorFlow → AI & Machine Learning
5. **ESCO transversal → INTERPERSONAL** — "adapt to change" gets type=interpersonal
6. **Tanova METHODOLOGY** — "Agile" and "Scrum" get type=methodology (derived from `category = "methodology"`)
7. **Longest description wins** — Agile's description is the longest among merged sources
8. **ESCO-only skill with null category** — "programming concepts" (digital, no transversal) has category_id = null
9. **Unknown MIND source file** — "ExoticThing" (source: `exotic_things`) gets category_id = null
10. **Idempotent** — run sync twice, same IDs + counts preserved
11. **experience_skills untouched** — count remains 0

---

## Key Reference Files

| File | Why |
|------|-----|
| `infrastructure/src/mind/MindImporter.ts` | Batch upsert pattern (TableImport, batchUpsert, Connection, Logger) |
| `core/src/normalizeLabel.ts` | Normalization function with C-family pre-map |
| `domain/src/entities/Skill.ts` | Target table schema (column names, types, SkillAlias jsonb) |
| `domain/src/value-objects/SkillType.ts` | SkillType enum values |
| `infrastructure/scripts/mind-import.ts` | CLI entry point pattern |
| `infrastructure/test-integration/support/TestDatabase.ts` | Testcontainers setup |
| `infrastructure/test-integration/esco/esco-import.test.ts` | Integration test pattern |

## Verification

```bash
bun run typecheck
bun run test
bun run --cwd infrastructure test:integration
bun run check
bun run dep:check
```
