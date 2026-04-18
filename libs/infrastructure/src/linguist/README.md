# Linguist Language Import

Imports GitHub [Linguist](https://github.com/github-linguist/linguist) language data into the `linguist_languages` table. Linguist is the library GitHub uses to detect programming languages — it catalogs 500+ languages with aliases, file extensions, colors, and type classifications.

## Source data

Single YAML file: `lib/linguist/languages.yml` from the Linguist repo.

```bash
git clone --depth 1 https://github.com/github-linguist/linguist.git /tmp/linguist
```

## Usage

```bash
bun linguist:import <path-to-languages.yml> [--version <commit-hash>]
```

Example:

```bash
bun linguist:import /tmp/linguist/lib/linguist/languages.yml \
  --version $(git -C /tmp/linguist rev-parse HEAD)
```

The `--version` flag records the source commit hash in every row (defaults to `"unknown"`). The import is idempotent — running it again updates existing rows via `ON CONFLICT DO UPDATE`.

## Architecture

```
linguist/
  schemas/
    linguist-language.ts   Zod schema for a single YAML entry
  entities/
    LinguistLanguageEntity.ts   MikroORM entity (table: linguist_languages)
  LinguistParser.ts        Reads YAML, validates each entry with Zod
  LinguistImporter.ts      Batch upserts (500 rows) via raw SQL
```

Follows the same pattern as `infrastructure/src/esco/`.

## Table schema

| Column | Type | Notes |
|---|---|---|
| `linguist_name` (PK) | text | YAML key (e.g. "JavaScript", "C++") |
| `linguist_type` | text | "programming", "markup", "data", "prose" |
| `color` | text | Hex color code (e.g. "#f1e05a") |
| `aliases` | jsonb | Alternative names (e.g. ["js", "node"]) |
| `extensions` | jsonb | File extensions (e.g. [".js", ".mjs"]) |
| `interpreters` | jsonb | CLI interpreters (e.g. ["node"]) |
| `linguist_language_id` | integer | GitHub's internal numeric ID |
| `linguist_group` | text | Parent language if this is a variant |
| `linguist_version` | text | Source git commit hash |

## Tests

```bash
bun test infrastructure/test/linguist/              # unit tests (parser + schema)
bun run --cwd infrastructure test:integration        # integration tests (requires Docker)
```
