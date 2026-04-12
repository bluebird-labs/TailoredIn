# MIND Import Pipeline

Dataset: **MIND Tech Ontology** ([MIND-TechAI/MIND-tech-ontology](https://github.com/MIND-TechAI/MIND-tech-ontology))

MIND is a structured ontology of modern technology skills, covering programming languages, frameworks, libraries, databases, protocols, tools, and services. It includes a dependency graph (`impliesKnowingSkills`) and concept associations (`impliesKnowingConcepts`), making it the richest source for tech skill relationships.

This module loads the MIND JSON dataset, validates it against Zod schemas, and bulk-imports it into PostgreSQL.

## CLI Usage

```bash
bun mind:import <path-to-mind-repo-clone>
```

The directory must be a local clone of the MIND repo containing `skills/` and `concepts/` subdirectories with JSON files.

```bash
git clone https://github.com/MIND-TechAI/MIND-tech-ontology /tmp/mind-ontology
bun mind:import /tmp/mind-ontology
```

The script reads the git commit hash from the repo clone and stores it as `mind_version` in every row for reproducibility.

## Pipeline Stages

### Stage 1: JSON parsing + validation (`MindDatasetParser`)

Scans two directories in the repo clone:

- **`skills/`** — per-category JSON files (`programming_languages.json`, `frameworks_frontend.json`, `libraries_data.json`, etc.). Each file contains an array of skill objects. The `__aggregated_skills.json` file is skipped (it duplicates individual files).
- **`concepts/`** — per-type JSON files (`architectural_patterns.json`, `application_tasks.json`, etc.). Each file contains an array of concept objects.

For each file, every item is validated against a Zod schema (`MindSkillSchema` or `MindConceptSchema`). The parser attaches metadata:
- Skills get a `sourceFile` field (e.g. `"programming_languages"` from the filename).
- Concepts get a `mindType` field (e.g. `"architectural_patterns"` from the filename).

Both directories are parsed in parallel. Validation errors are accumulated and thrown as a batch.

Returns a typed `MindDataset` with `skills: MindParsedSkill[]` and `concepts: MindParsedConcept[]`.

### Stage 2: Database import (`MindImporter`)

`MindImporter` performs idempotent bulk import via raw SQL with `INSERT ... ON CONFLICT DO UPDATE`. Batches of 500 rows. Three phases:

1. **Skills** — upsert into `mind_skills`. All JSONB arrays are `JSON.stringify()`-ed.
2. **Concepts** — upsert into `mind_concepts`.
3. **Relations** — derived from `impliesKnowingSkills` and `impliesKnowingConcepts` arrays on each skill. Each array entry becomes a row in `mind_relations` with the appropriate `relation_type`.

Rows are deduplicated by conflict key before batching to avoid "ON CONFLICT DO UPDATE cannot affect row a second time" errors.

## Zod Schemas

| Schema | Validates | Required fields | Optional arrays (default `[]`) |
|---|---|---|---|
| `MindSkillSchema` | Individual skill objects from `skills/*.json` | `name`, `type` (string array) | `synonyms`, `technicalDomains`, `impliesKnowingSkills`, `impliesKnowingConcepts`, `conceptualAspects`, `architecturalPatterns`, `supportedProgrammingLanguages`, `specificToFrameworks`, `adapterForToolOrService`, `implementsPatterns`, `associatedToApplicationDomains`, `solvesApplicationTasks`, `buildTools`, `runtimeEnvironments` |
| `MindConceptSchema` | Individual concept objects from `concepts/*.json` | `name` | `synonyms` |

Fields vary by skill type — libraries have `supportedProgrammingLanguages`, `specificToFrameworks`, etc. that programming languages don't. The schema uses the union of all fields with defaults, so missing arrays resolve to `[]`.

## Database Tables

3 PostgreSQL tables created via `Migration_20260508000000_create_mind_tables`:

**`mind_skills`** (PK = `mind_name` text):

| Column | Type | Notes |
|---|---|---|
| `mind_name` | text NOT NULL | PK — source `name` field (e.g. "React", "Java") |
| `mind_type` | jsonb NOT NULL | Always an array (e.g. `["ProgrammingLanguage"]`) |
| `synonyms` | jsonb DEFAULT `[]` | Alternate names including common misspellings |
| `technical_domains` | jsonb DEFAULT `[]` | e.g. `["frontend", "backend"]` |
| `implies_knowing_skills` | jsonb DEFAULT `[]` | Dependency graph (e.g. Next.js implies React) |
| `implies_knowing_concepts` | jsonb DEFAULT `[]` | Concept associations |
| `conceptual_aspects` | jsonb DEFAULT `[]` | |
| `architectural_patterns` | jsonb DEFAULT `[]` | |
| `supported_programming_languages` | jsonb DEFAULT `[]` | For libraries/frameworks |
| `specific_to_frameworks` | jsonb DEFAULT `[]` | For libraries |
| `adapter_for_tool_or_service` | jsonb DEFAULT `[]` | For libraries |
| `implements_patterns` | jsonb DEFAULT `[]` | For libraries |
| `associated_to_application_domains` | jsonb DEFAULT `[]` | |
| `solves_application_tasks` | jsonb DEFAULT `[]` | For libraries |
| `build_tools` | jsonb DEFAULT `[]` | For languages |
| `runtime_environments` | jsonb DEFAULT `[]` | For languages |
| `mind_source_file` | text NOT NULL | Which JSON file (e.g. `"programming_languages"`) |
| `mind_version` | text NOT NULL | Git commit hash of the MIND repo |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**`mind_concepts`** (PK = `mind_name` text):

| Column | Type | Notes |
|---|---|---|
| `mind_name` | text NOT NULL | PK — source `name` field |
| `mind_type` | text NOT NULL | Source file category (e.g. `"architectural_patterns"`) |
| `synonyms` | jsonb DEFAULT `[]` | |
| `mind_version` | text NOT NULL | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**`mind_relations`** (composite PK = `mind_source_name` + `mind_target_name` + `relation_type`):

| Column | Type | Notes |
|---|---|---|
| `mind_source_name` | text NOT NULL | Skill that implies knowledge |
| `mind_target_name` | text NOT NULL | Target skill or concept |
| `relation_type` | text NOT NULL | `"impliesKnowingSkills"` or `"impliesKnowingConcepts"` |
| `mind_version` | text NOT NULL | |
| `created_at` | timestamptz | |

## Data Profile

| Table | Approximate rows | Notes |
|---|---|---|
| `mind_skills` | ~3,333 | Programming languages, frameworks, libraries, databases, tools, services, protocols, markup |
| `mind_concepts` | ~974 | Architectural patterns, application tasks, technical domains |
| `mind_relations` | ~10,897 | Derived from `impliesKnowingSkills` + `impliesKnowingConcepts` arrays |

## File Inventory

```
infrastructure/src/mind/
├── README.md                ← This file
├── MindDataset.ts           ← Result types (MindParsedSkill, MindParsedConcept, MindDataset)
├── MindDatasetParser.ts     ← JSON parser + Zod validation
├── MindImporter.ts          ← Bulk import to PostgreSQL (raw SQL, batched upserts)
├── index.ts                 ← Barrel exports
├── entities/
│   ├── index.ts
│   ├── MindConceptEntity.ts
│   ├── MindRelationEntity.ts
│   └── MindSkillEntity.ts
└── schemas/
    ├── mind-concept.ts
    └── mind-skill.ts
```

## Test Coverage

**Unit tests** (9 tests in `test/mind/MindDatasetParser.test.ts`):
- Parses all skills and concepts from fixtures
- Attaches `sourceFile` to skills and `mindType` to concepts
- Maps all skill fields correctly (type, synonyms, domains, build tools, runtimes, etc.)
- Maps concept fields correctly
- Defaults optional arrays to `[]`
- Preserves `impliesKnowing` arrays for relation derivation
- Throws on nonexistent directory

All unit tests run against hand-crafted fixture JSON files (3 languages + 2 frameworks + 3 concepts).

**Integration tests** (4 tests in `test-integration/mind/mind-import.test.ts`):
- Import populates all 3 tables with correct counts
- Idempotency: running twice yields same row counts
- Relations are derived correctly from `impliesKnowingSkills` and `impliesKnowingConcepts`
- JSONB fields are stored and retrieved correctly

## Not Yet Implemented

- **No use case** — nothing in the application layer consumes the pipeline
- **No API trigger** — import is CLI-only
- **No DI wiring** — classes are plain (no `@injectable()`)
- **Migration ordering** — the migration timestamp is a placeholder; must be reordered after Block 2 (domain tables) lands
