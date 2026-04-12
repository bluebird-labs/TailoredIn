# Tanova Import Pipeline

Dataset: **Tanova Skills Taxonomy** ([tanova-ai/skills-taxonomy](https://github.com/tanova-ai/skills-taxonomy))

Tanova is a curated taxonomy of ~100 skills covering technology, business, marketing, and creative domains. Each skill includes aliases, parent/child/related skill graphs, transferability scores, and proficiency level markers. The dataset is a single nested JSON file (`taxonomy.json`).

This module loads the Tanova JSON dataset, validates it against Zod schemas, and bulk-imports it into PostgreSQL.

## CLI Usage

```bash
bun tanova:import <path-to-taxonomy.json-or-directory>
```

Accepts either the `taxonomy.json` file directly or a directory containing it. To obtain the data:

```bash
git clone https://github.com/tanova-ai/skills-taxonomy .local/tanova-skills-taxonomy
bun tanova:import .local/tanova-skills-taxonomy
```

## Source Data Structure

The JSON has a nested `categories.<category>.<subcategory>.skills[]` layout:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-01-15",
  "categories": {
    "technology": {
      "programming_languages": {
        "skills": [
          {
            "id": "javascript",
            "canonical_name": "JavaScript",
            "aliases": ["JS", "ECMAScript"],
            "category": "technology",
            "subcategory": "programming_languages",
            "tags": ["frontend", "backend", "web"],
            "description": "A high-level, interpreted programming language.",
            "parent_skills": [],
            "child_skills": ["typescript"],
            "related_skills": ["typescript", "nodejs"],
            "transferability": { "typescript": 0.95, "python": 0.6 },
            "proficiency_levels": {
              "beginner": { "markers": ["..."], "typical_experience": "0-6 months" },
              "intermediate": { "markers": ["..."], "typical_experience": "6 months - 2 years" }
            },
            "typical_roles": ["Frontend Developer", "Full Stack Developer"],
            "industry_demand": "very_high",
            "prerequisites": []
          }
        ]
      }
    }
  }
}
```

## Pipeline Stages

### Stage 1: JSON parsing + validation (`TanovaDatasetParser`)

Reads `taxonomy.json` via `Bun.file().json()`, validates the top-level structure with `TanovaTaxonomySchema`, then flattens the nested `categories.<cat>.<subcat>.skills[]` hierarchy into a flat array of `TanovaSkill` objects. Each skill already carries its own `category` and `subcategory` fields from the source.

Returns `{ skills: TanovaSkill[], version: string }`.

### Stage 2: Database import (`TanovaImporter`)

Performs idempotent bulk import via raw SQL with `INSERT ... ON CONFLICT (tanova_id) DO UPDATE SET ...`. Batches of 500 rows. JSONB fields are serialized with `JSON.stringify()`. The `tanova_version` column is set from the taxonomy's top-level `version` field. Logs row count and duration.

## Zod Schemas

| Schema | Purpose |
|---|---|
| `TanovaSkillSchema` | Validates a single skill object (id, canonical_name, aliases, tags, transferability, proficiency_levels, etc.) |
| `TanovaTaxonomySchema` | Validates the top-level JSON structure (version, last_updated, nested categories) |
| `IndustryDemandEnum` | Enum: `very_high`, `high`, `medium`, `low` |

## Database Table

One PostgreSQL table created via `Migration_20260508000000_create_tanova_skills`:

| Column | Type | Notes |
|---|---|---|
| `tanova_id` | text PK | Source `id` field (e.g. "javascript", "docker") |
| `canonical_name` | text | Source `canonical_name` |
| `category` | text (nullable) | e.g. "technology" |
| `subcategory` | text (nullable) | e.g. "programming_languages" |
| `tags` | jsonb | `["frontend", "backend", "web"]` |
| `description` | text (nullable) | Skill description |
| `aliases` | jsonb | `["JS", "ECMAScript"]` |
| `parent_skills` | jsonb | Tanova IDs |
| `child_skills` | jsonb | Tanova IDs |
| `related_skills` | jsonb | Tanova IDs |
| `transferability` | jsonb (nullable) | `{ "typescript": 0.95, "python": 0.6 }` |
| `proficiency_levels` | jsonb (nullable) | `{ beginner: {...}, intermediate: {...}, ... }` |
| `typical_roles` | jsonb | `["Frontend Developer", "Full Stack Developer"]` |
| `industry_demand` | text (nullable) | "very_high", "high", "medium", "low" |
| `prerequisites` | jsonb | Tanova IDs |
| `tanova_version` | text | Git commit hash or semver from source |
| `created_at` | timestamptz | Auto-set |
| `updated_at` | timestamptz | Auto-set |

## File Inventory

```
infrastructure/src/tanova/
├── README.md                ← This file
├── TanovaDatasetParser.ts   ← JSON parser + flattener
├── TanovaImporter.ts        ← Bulk import to PostgreSQL (raw SQL, batched upserts)
├── index.ts                 ← Barrel exports
├── entities/
│   ├── index.ts
│   └── TanovaSkillEntity.ts ← MikroORM entity for tanova_skills
└── schemas/
    └── tanova-skill.ts      ← Zod schemas (TanovaSkillSchema, TanovaTaxonomySchema)
```

## Test Coverage

**Unit tests** (11 tests in `test/tanova/TanovaDatasetParser.test.ts`):
- Parses fixture into flat skill array with correct count
- Flattens skills from all categories and subcategories
- Preserves category/subcategory from source data
- Preserves all skill fields (aliases, tags, transferability, proficiency_levels, etc.)
- Handles skills with optional fields omitted
- Schema rejects missing required fields (id, canonical_name)
- Schema defaults array fields to empty arrays
- Schema rejects invalid industry_demand values
- Taxonomy schema rejects missing version
- Taxonomy schema accepts empty categories

All unit tests run against a synthetic fixture (`test/tanova/fixtures/taxonomy.json`) with 4 skills across 2 categories.

**Integration tests** (4 tests in `test-integration/tanova/tanova-import.test.ts`):
- Import populates table with correct row count
- Idempotency: running twice yields same row count
- Stores correct field values (text, jsonb, version)
- Stores skills from all categories

## Not Yet Implemented

- **No use case** -- nothing in the application layer consumes this pipeline
- **No API trigger** -- import is CLI-only
- **No DI wiring** -- parser and importer are plain classes, not bound in the composition root
- **Migration ordering** -- placeholder timestamp; must be reordered after Block 2 domain tables migration lands
