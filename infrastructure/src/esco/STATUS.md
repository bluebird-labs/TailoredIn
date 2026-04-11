# ESCO Import Pipeline — Status

Dataset: ESCO v1.2.1 (European Skills, Competences, Qualifications and Occupations)

## What exists

### Stage 1: Directory validation (`EscoDirectoryLoader`)

Scans a directory, verifies all 19 expected CSV files are present, and returns an `EscoDirectory` object mapping camelCase keys to absolute file paths. Throws `ZodError` if any file is missing.

### Stage 2: CSV parsing (`EscoCsvParser` + `EscoDatasetParser`)

`EscoCsvParser` is a generic parser that reads one CSV file, validates every row against a Zod schema, and returns typed arrays. It handles:

- Empty CSV cells → `undefined` conversion (CSV empty strings vs Zod `.optional()`)
- Column order independence (zod-csv maps positionally, so the parser builds extraction schemas matching CSV header order)
- Multiline quoted fields (altLabels, scope notes, descriptions contain newlines)
- Type coercion (`z.coerce.number()` for `greenShare`)

`EscoDatasetParser` orchestrates all 19 files in parallel via `Promise.all`, returning a fully typed `EscoDataset`.

### Zod schemas (14 schemas for 19 files)

| Schema | Files it validates |
|---|---|
| `SkillSchema` | `skills_en.csv` |
| `OccupationSchema` | `occupations_en.csv` |
| `ISCOGroupSchema` | `ISCOGroups_en.csv` |
| `SkillGroupSchema` | `skillGroups_en.csv` |
| `OccupationSkillRelationSchema` | `occupationSkillRelations_en.csv` |
| `SkillSkillRelationSchema` | `skillSkillRelations_en.csv` |
| `BroaderRelationOccPillarSchema` | `broaderRelationsOccPillar_en.csv` |
| `BroaderRelationSkillPillarSchema` | `broaderRelationsSkillPillar_en.csv` |
| `ConceptSchemeSchema` | `conceptSchemes_en.csv` |
| `DictionarySchema` | `dictionary_en.csv` |
| `SkillsHierarchySchema` | `skillsHierarchy_en.csv` |
| `GreenShareOccupationSchema` | `greenShareOcc_en.csv` |
| `SkillCollectionSchema` | 6 files: `greenSkills`, `digitalSkills`, `digCompSkills`, `transversalSkills`, `languageSkills`, `researchSkills` |
| `OccupationCollectionSchema` | `researchOccupationsCollection_en.csv` |

### Test coverage

46 unit tests across 3 test files:

- `EscoDirectoryLoader.test.ts` — 4 tests (file discovery, key mapping, missing files, bad directory)
- `EscoCsvParser.test.ts` — 35 tests (all 19 files parse, empty string handling, enum variants, type coercion, multiline fields, column order independence, error handling)
- `EscoDatasetParser.test.ts` — 7 tests (full dataset parse, typed field checks, collection consistency)

All tests run against fixture CSV files containing ~20 rows each from real ESCO data.

### Supporting files

- `ESCO.md` — Schema reference documentation with column descriptions, types, and ER diagram
- `zod-csv.d.ts` — Ambient type declaration working around zod-csv's broken NodeNext module resolution

## File inventory

```
infrastructure/src/esco/
├── ESCO.md                  ← Schema reference doc
├── STATUS.md                ← This file
├── EscoCsvParseError.ts     ← Error class (file path + per-row ZodErrors)
├── EscoCsvParser.ts         ← Generic CSV→schema parser
├── EscoDataset.ts           ← Result type (19 readonly typed arrays)
├── EscoDatasetParser.ts     ← Orchestrator (parses all 19 files)
├── EscoDirectoryLoader.ts   ← Directory scanner + file validation
├── EscoImporter.ts          ← Bulk import to PostgreSQL (raw SQL, batched upserts)
├── index.ts                 ← Barrel exports
├── zod-csv.d.ts             ← Ambient types for zod-csv
├── entities/
│   ├── index.ts
│   ├── EscoBroaderRelationOccPillarEntity.ts
│   ├── EscoBroaderRelationSkillPillarEntity.ts
│   ├── EscoConceptSchemeEntity.ts
│   ├── EscoDictionaryEntity.ts
│   ├── EscoGreenShareOccupationEntity.ts
│   ├── EscoIscoGroupEntity.ts
│   ├── EscoOccupationCollectionEntity.ts
│   ├── EscoOccupationEntity.ts
│   ├── EscoOccupationSkillRelationEntity.ts
│   ├── EscoSkillCollectionEntity.ts
│   ├── EscoSkillEntity.ts
│   ├── EscoSkillGroupEntity.ts
│   ├── EscoSkillSkillRelationEntity.ts
│   └── EscoSkillsHierarchyEntity.ts
└── schemas/
    ├── broader-relation-occ-pillar.ts
    ├── broader-relation-skill-pillar.ts
    ├── concept-scheme.ts
    ├── dictionary.ts
    ├── green-share-occupation.ts
    ├── isco-group.ts
    ├── occupation.ts
    ├── occupation-collection.ts
    ├── occupation-skill-relation.ts
    ├── skill.ts
    ├── skill-collection.ts
    ├── skill-group.ts
    ├── skill-skill-relation.ts
    └── skills-hierarchy.ts
```

### Stage 3: Database schema + bulk import (`EscoImporter`)

14 PostgreSQL tables created via `Migration_20260506000000_create_esco_tables`:

**Concept tables** (PK = `concept_uri` text, with `esco_version`, `created_at`, `updated_at`):
- `esco_skills`, `esco_occupations`, `esco_isco_groups`, `esco_skill_groups`
- `esco_concept_schemes` (PK = `concept_scheme_uri`)
- `esco_dictionary` (composite PK: `filename`, `data_header`)

**Relationship tables** (composite PKs, no timestamps):
- `esco_occupation_skill_relations` (FK → occupations + skills)
- `esco_skill_skill_relations` (FK → skills ×2)
- `esco_broader_relations_occ_pillar`, `esco_broader_relations_skill_pillar` (polymorphic, no FK)
- `esco_skills_hierarchy` (auto-increment PK)

**Collection tables:**
- `esco_skill_collections` (composite PK: `concept_uri` + `collection_type`, FK → skills)
- `esco_occupation_collections` (FK → occupations)
- `esco_green_share_occupations` (polymorphic, no FK)

`EscoImporter` performs idempotent bulk import via raw SQL with `INSERT ... ON CONFLICT DO UPDATE`. Skills hierarchy uses DELETE + INSERT (no natural unique key). Batches of 500 rows. Logs per-table row counts and duration.

**CLI:** `bun esco:import <path-to-esco-directory>` (script at `scripts/esco-import.ts`)

### Integration tests

4 integration tests in `test-integration/esco/esco-import.test.ts`:
- Import populates all 14 tables
- Idempotency: running twice yields same row counts
- Collection type discriminator values are correct
- FK constraints exist on relationship tables

## What does not exist yet

- **No use case** — nothing in the application layer orchestrates or consumes the pipeline
- **No API trigger** — import is CLI-only
- **No embeddings or vector columns** — planned for a separate session
- **No DI wiring** — `EscoCsvParser` and `EscoDatasetParser` have `@injectable()` but are not bound in the composition root yet
