# Resume Versions in the Unified Builder — Design Spec

## Overview

Evolve the builder into the app's primary page where users manage multiple resume versions (currently called "archetypes"). Each version stores a label, headline selection, and content selection (which bullets, education entries are included). All changes auto-save to the database. Seeds are converted to a one-time migration so data persists across restarts.

## Two Sub-Projects

This design has two independent pieces that should be implemented separately:

### Sub-Project A: Seeds → Migration
Convert the current seed data into a one-time SQL migration. Remove the seed mechanism from `bun up`. After this, data entered through the UI persists across restarts.

### Sub-Project B: Resume Versions in Builder
Add version tabs to the builder page. Each tab is an archetype. Selections auto-save to the archetype's `contentSelection` via API. Remove the standalone `/archetypes` pages from the sidebar.

---

## Sub-Project A: Seeds → Migration

### What Changes

1. **New migration** (`Migration_<timestamp>_seed_data.ts`) that inserts all resume seed data as SQL:
   - Profile (Sylvain Estevez)
   - 8 experiences with bullets and default approved variants
   - 1 headline ("Leader")
   - 3 education entries
   - 7 skill categories with items
   - 2 archetypes (Lead IC, Nerd) with content selections
   - Skills vocabulary (80+ skills with affinities and name variants)
   - Job data (companies, jobs, job status updates) — if currently seeded

2. **Remove seed step from `bun up`** (`infrastructure/dev/up.ts`):
   - Delete the `runSeedsForContext()` call
   - Keep migrations step

3. **Delete seed files**:
   - `infrastructure/src/db/seeds/DatabaseSeeder.ts`
   - `infrastructure/src/db/seeds/ResumeDataSeeder.ts`
   - `infrastructure/src/db/seeds/SkillsSeeder.ts`
   - `infrastructure/src/db/seeds/JobDataSeeder.ts`
   - `infrastructure/src/db/seeds/data/resume-data.ts`
   - `infrastructure/src/db/seeds/data/` directory

### Migration Strategy
- The migration uses `INSERT ... ON CONFLICT DO NOTHING` so it's safe to run on databases that already have the data (from previous seeds)
- UUIDs are hardcoded in the migration (same ones from seeds) for referential integrity

---

## Sub-Project B: Resume Versions in Builder

### Navigation Restructure

```
Resume (top section, default)
  ├─ Builder        ← / redirects here
  ├─ Profile
  ├─ Headlines
  ├─ Skills
  └─ Education

Discovery (second section)
  ├─ Triage
  ├─ Pipeline
  ├─ Archive
  └─ All Jobs
```

- `/` redirects to `/resume/builder`
- "Templates" / "Archetypes" nav group removed from sidebar
- `/archetypes` routes stay in codebase (API works) but no UI links

### Builder Page: Version Tabs

#### Tab Bar (below sticky header, above document preview)
- One tab per archetype, labeled with archetype `label` (e.g., "Lead IC", "Nerd")
- Active tab highlighted
- **"+" button** at the end of the tab row — opens a small popover:
  - "New blank" — creates archetype with empty content selection
  - "Duplicate current" — creates archetype with current version's content selection cloned
- **Right-click / context menu** per tab:
  - "Rename" — inline edit of the label
  - "Delete" — with confirmation dialog
- Last-used tab remembered via `localStorage` (just the archetype ID)

#### State Management — No Local State

The builder reads the active archetype's `contentSelection` and `headlineId` directly from the React Query cache. Every change writes to the API immediately:

| User Action | API Call | Invalidation |
|---|---|---|
| Toggle bullet visibility | `PUT /archetypes/:id/content` | archetype detail |
| Reorder bullets | `PUT /bullets/:id` (ordinal) + `PUT /archetypes/:id/content` | experiences + archetype |
| Swap headline | `PUT /archetypes/:id` (headlineId) | archetype detail |
| Toggle education | `PUT /archetypes/:id/content` | archetype detail |
| Edit experience fields | `PUT /experiences/:id` | experiences |
| Edit personal info | `PUT /profile` | profile |
| Create version | `POST /archetypes` | archetype list |
| Delete version | `DELETE /archetypes/:id` | archetype list |
| Rename version | `PUT /archetypes/:id` | archetype detail |

#### Auto-Save Flow
1. User toggles a bullet eye icon in the modal
2. Builder computes the updated `contentSelection` from the current state
3. Calls `PUT /archetypes/:id/content` with the new selection
4. React Query invalidates and refetches the archetype
5. Preview re-renders from the fresh data

No dirty state, no save button. If the API call fails, show a toast error and revert the toggle.

### Data Flow: Reading from Archetype

```
Archetype (DB)
  ├─ headlineId → determines which headline text shows
  └─ contentSelection
       ├─ experienceSelections[].experienceId → which experiences appear
       ├─ experienceSelections[].bulletVariantIds → which bullets are visible
       ├─ educationIds → which education rows are included
       ├─ skillCategoryIds → (unused in current builder, future)
       └─ skillItemIds → (unused in current builder, future)
```

The builder fetches:
- All experiences (with bullets/variants) — full catalog
- All headlines — full catalog  
- All education — full catalog
- The active archetype — to know what's selected

Then renders only what the archetype's `contentSelection` includes.

### Bullet Order

Currently `contentSelection.experienceSelections[].bulletVariantIds` is an ordered array. The order in this array determines the display order on the preview. Reordering bullets in the modal updates both:
1. The bullet's `ordinal` in the DB (via `PUT /bullets/:id`)
2. The variant ID order in the archetype's `contentSelection`

### Generate PDF

Same as today — constructs the payload from the active archetype's selections and calls `POST /api/resumes/generate`. No change needed.

### Components

#### Modified
- `web/src/routes/resume/builder.tsx` — add version tabs, read from archetype, auto-save
- `web/src/components/resume/builder/ResumePreview.tsx` — derive visible content from archetype's contentSelection instead of local state
- `web/src/components/resume/builder/ExperienceEditModal.tsx` — eye toggle calls API instead of local state
- `web/src/components/layout/sidebar.tsx` — reorder nav sections, remove Archetypes group

#### New
- `web/src/components/resume/builder/VersionTabs.tsx` — tab bar with +/rename/delete
- `web/src/hooks/use-archetypes.ts` — React Query hooks for archetype CRUD (if not existing)

#### Removed from Sidebar
- `/archetypes` link (routes stay, just not linked)

### Route Changes
- `/` → redirect to `/resume/builder`
- `/resume/builder` remains the builder page

### E2E Tests

Update `e2e/tests/resume/builder.spec.ts`:
- Test version tab rendering (seeded archetypes appear as tabs)
- Test creating a new blank version
- Test duplicating a version
- Test renaming a version
- Test deleting a version
- Test switching versions (different content shown)
- Test auto-save (toggle bullet, reload, verify persisted)
- Test generate PDF from a version

## No Backend Changes

The archetype CRUD API already exists:
- `GET /archetypes` — list all
- `POST /archetypes` — create
- `PUT /archetypes/:id` — update metadata (label, headlineId)
- `PUT /archetypes/:id/content` — update content selection
- `DELETE /archetypes/:id` — delete

No new API routes needed.
