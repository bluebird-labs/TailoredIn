# API Conventions Design

## Context

The TailoredIn API has grown organically with inconsistent response formats, pagination approaches, and sorting patterns. This spec documents the target conventions that all endpoints should follow, drawn from Stripe and GitHub API design patterns.

## Current State

- **Response format**: Routes manually return `{ data: T }` or `{ error: string }` — no standard envelope
- **Pagination**: Only `ListJobs` is paginated, using `page` / `page_size` (1-indexed)
- **Sorting**: Only `ListJobs` supports it, via separate `sort_by` and `sort_dir` params
- **Error responses**: Inconsistent — some return `{ error: string }`, others `{ error: string, message: string }`

## Target Conventions

All conventions are documented in `CONVENTIONS.md` under the "API Conventions" section. Key decisions:

### Response Envelope

Two shapes — success and error — distinguished by HTTP status code:

```typescript
// Success (2xx)
{ data: T, pagination?: Pagination }

// Error (4xx/5xx)
{ error: { code: string, message: string } }
```

- `data` is flat — the resource or array directly, not keyed by entity type
- No redundant `success`/`error` booleans — HTTP status is the signal
- `error.code` is machine-readable (e.g., `"NOT_FOUND"`), `error.message` is human-readable

### Pagination

Limit/offset replacing page/page_size:
- Query params: `limit` (default 25, max 100) and `offset` (default 0)
- Response: `{ pagination: { limit, offset, total, hasNext } }`

### Sorting

Single `sort` param with comma-separated fields:
- `?sort=score:desc,posted_at` (default direction: ascending)
- Replaces the current `sort_by` + `sort_dir` pair

### Filtering

- Snake_case query params matching field names
- Array values via repeated params (`?status=NEW&status=APPLIED`)

## Migration Notes

Existing endpoints will be migrated in a separate task. The conventions in CONVENTIONS.md serve as the target state.

## Affected Files

- `CONVENTIONS.md` — API Conventions section added
- Future: all route files in `api/src/routes/`, pagination/sorting DTOs in `application/`
