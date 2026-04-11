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
├── index.ts                 ← Barrel exports
├── zod-csv.d.ts             ← Ambient types for zod-csv
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

## What does not exist yet

- **No database tables or migrations** — the parsed data stays in memory as `EscoDataset`
- **No persistence layer** — no repositories, no ORM entities, no write path to Postgres
- **No use case** — nothing in the application layer orchestrates or consumes the pipeline
- **No CLI or API trigger** — no way to kick off the import from outside
- **No deduplication or incremental import** — every run parses the full dataset from scratch
- **No DI wiring** — `EscoCsvParser` and `EscoDatasetParser` have `@injectable()` but are not bound in the composition root yet
