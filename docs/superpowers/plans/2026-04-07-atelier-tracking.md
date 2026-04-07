# Atelier & Generation Settings — Session Tracking

**Spec:** `docs/superpowers/specs/2026-04-07-atelier-generation-settings-design.md`
**Plan:** `.claude/plans/linear-finding-wand.md`

## Phase 1 — Parallel Streams (no dependencies)

| Stream | Branch | Status | Worktree |
|--------|--------|--------|----------|
| 1: Domain + Application | `feat/atelier-domain-app` | In progress | — |
| 2a: Migration + ORM entities | `feat/atelier-infra` | Not started | — |
| 4a: Frontend shell (mock data) | `feat/atelier-web` | Not started | — |

## Phase 2 — After Stream 1 merges

| Stream | Branch | Status | Worktree |
|--------|--------|--------|----------|
| 2b: Repos + Generator changes | `feat/atelier-infra` | Blocked by Stream 1 | — |
| 3: API routes + DI wiring | `feat/atelier-api` | Blocked by Stream 1 | — |
| 4b: Connect frontend to API | `feat/atelier-web` | Blocked by Streams 2b + 3 | — |

## Merge Order

1. Stream 1 → `main`
2. Streams 2 (full) + 3 → `main` (parallel)
3. Stream 4 (full) → `main`

## Session Log

| # | Stream | Started | Completed | Notes |
|---|--------|---------|-----------|-------|
| 1 | Stream 1: Domain + App | 2026-04-07 | — | Branch: feat/atelier-domain-app |
