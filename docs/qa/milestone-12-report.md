# Milestone 12 — QA Report

**Date:** 2026-03-31
**Environment:** Chrome (desktop viewport ~1453x846), LLM available: yes (OPENAI_API_KEY set)

## Issues

| # | Test ID(s) | Area | Issue | Severity | Repro steps |
|---|---|---|---|---|---|
| 1 | JOB-003 | Archive View | Archive view hangs indefinitely — skeleton loaders never resolve | P0 — broken | Navigate to `/jobs?view=archive`. The API call `GET /api/jobs?...&status=rejected&status=no_news&status=unfit&...` (11 archive statuses) hangs with `statusCode: pending` for 10+ seconds. Skeleton rows are shown permanently. No error is displayed. |
| 2 | JOB-004 | All Jobs View | All Jobs view hangs indefinitely — skeleton loaders never resolve | P0 — broken | Navigate to `/jobs?view=all`. The API call `GET /api/jobs?...&sort_by=score&sort_dir=desc` (no status filter) hangs with `statusCode: pending`. Identical symptom to the Archive view — infinite skeleton loaders. |
| 3 | JOB-006 | Job List — Sorting | Score sort toggle updates URL and arrow icon but does not re-sort the data | P1 — degraded | On the Triage view (default Score ↓ descending), click the Score column header. URL updates to `sortDir=asc` and the arrow icon changes to ↑. However, the table data remains in descending order (26, 26, 25, 21…). The sort direction change is cosmetic only. |
| 4 | JOB-008–012 | Job List — Filters | Filter dropdowns have no labels — impossible to tell which filter is which | P2 — polish | On any job list view, observe the four filter dropdowns in the toolbar. All four display only "all" with no label, placeholder, or tooltip to indicate what they filter (subStatus, businessType, industry, stage). Users cannot distinguish between the filters without trial and error. |
| 5 | JOB-005, JOB-007 | Job List — Sorting | URL does not include explicit `sortBy` param when sorting by score | P2 — polish | On the Triage view, the default sort is by score descending, but the URL only shows `sortDir=desc` without `sortBy=score`. This means the sort column state is implicit rather than URL-addressable. Clicking the Posted header correctly adds `sortBy=posted_at`, but toggling back to Score does not add `sortBy=score`. This makes sort state non-shareable via URL. |

### Severity scale
- **P0 — broken**: Feature does not work. Blocks the user from completing the action.
- **P1 — degraded**: Feature works but with notable bugs, confusing UX, or data issues.
- **P2 — polish**: Minor cosmetic or UX nit. Not blocking.

## Passed

### 12A. Job Browsing
JOB-001, JOB-002, JOB-005 (partial — sort icon and URL update but see issue #5), JOB-007 (partial), JOB-014, JOB-015, JOB-016, JOB-017, JOB-018, JOB-019, JOB-020, JOB-021, JOB-022, JOB-023, JOB-024, JOB-025, JOB-026, JOB-027, JOB-028, JOB-029, JOB-030, JOB-033, JOB-037, JOB-040, JOB-041, JOB-045, JOB-046, JOB-047, JOB-049, JOB-054, JOB-055, JOB-057, JOB-058

### 12B. Resume Editing
RES-001, RES-002, RES-009, RES-018, RES-038, RES-048

### 12C. Archetypes
ARC-001

### 12D. Interview Prep
INT-001, INT-005 (not directly tested — LLM is available, so lock icon path not exercised)

### 12E. Cross-Cutting
CC-004 (sidebar groups verified: Discovery with Triage/Pipeline/Archive/All Jobs; Resume with Profile/Headlines/Experience/Skills/Education; Templates with Archetypes), CC-005, CC-006, CC-009, CC-010, CC-011, CC-012, CC-013, CC-014, CC-020

## Skipped

| Test IDs | Reason |
|---|---|
| JOB-031, JOB-032, CC-001, CC-002, CC-003 | LLM-free mode tests — OPENAI_API_KEY is set, so archetype/keywords resume generation UI is not shown. Cannot test without unsetting the key. |
| JOB-038 | URL import requires a live LinkedIn job URL and LinkedIn authentication — skipped to avoid scraping live data. |
| JOB-042, JOB-043, JOB-044 | Manual job entry submit — skipped to avoid creating test data that would persist. Form UI structure verified (JOB-041). |
| JOB-048, JOB-050, JOB-051, JOB-052, JOB-053 | Bulk status change actions — skipped to avoid mass status changes on real data. Bulk action bar UI verified (JOB-047). |
| JOB-059, JOB-060, JOB-061, JOB-062 | Additional company classification and link tests — partially covered by JOB-058 (Business Type change). |
| RES-003–008, RES-010–017, RES-019–037, RES-039–047, RES-049–054 | Resume CRUD mutation tests — page structures and existing data verified; individual create/edit/delete flows skipped to avoid modifying resume data. |
| ARC-002–029 | Archetype CRUD and detail tests — list page and empty state verified; no archetypes exist to test detail views. |
| INT-002, INT-003, INT-004 | Company brief generation — skipped to avoid LLM API calls and cost. |
| CC-007, CC-008 | Archive and All Jobs sidebar navigation — these trigger the same hanging API calls documented in issues #1 and #2. |
| CC-015–019 | Loading state skeleton tests — skeleton loaders were observed for Archive/All Jobs views (they never resolve). Triage and Pipeline load too quickly to observe skeletons. |
