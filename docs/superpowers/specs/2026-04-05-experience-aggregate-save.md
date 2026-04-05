# Experience Aggregate-Level Save

**Date:** 2026-04-05
**Status:** Not started
**Priority:** High — current implementation violates DDD transactional boundaries

---

## Problem

The Experience aggregate contains child entities (Accomplishments) that are currently mutated independently via separate API endpoints. This breaks the DDD rule that all mutations within an aggregate must go through the aggregate root in a single transaction.

### Current Architecture (broken)

```
ExperienceFormModal
├── Experience fields → PUT /experiences/:id (saved on "Save" click)
├── Add accomplishment → POST /experiences/:id/accomplishments (saved immediately)
├── Edit accomplishment → PUT /experiences/:id/accomplishments/:aid (saved immediately)
├── Delete accomplishment → DELETE /experiences/:id/accomplishments/:aid (saved immediately)
└── Reorder accomplishments → PUT /experiences/:id/accomplishments/:aid × N (saved immediately on drop)
```

**Problems:**
1. **No transactional boundary** — accomplishment changes are persisted independently of the parent experience. A user can add an accomplishment, then cancel the experience form, and the accomplishment persists orphaned from the user's intent.
2. **Inconsistent UX** — experience fields use Save/Discard with dirty tracking, but accomplishment changes are immediate. The user sees a Save button but some changes have already been saved.
3. **No rollback** — if the user discards changes on the experience form, accomplishment mutations have already been committed. There's no undo.
4. **Race conditions** — reordering fires N parallel PUT requests, each of which invalidates the query cache. The first invalidation refetches stale data before the others complete, causing visual snapping. (Partially mitigated with `useReorderAccomplishments` batch hook, but the fundamental issue remains.)
5. **Partial failure** — if 2 of 4 accomplishment reorder PUTs succeed and 2 fail, the aggregate is left in an inconsistent state.

### Desired Architecture

```
ExperienceFormModal
├── Experience fields ─────────────┐
├── Accomplishment adds ───────────┤
├── Accomplishment edits ──────────┤ → All collected as local state
├── Accomplishment deletes ────────┤
└── Accomplishment reorder ────────┘
                                   ↓ (on "Save" click)
                            PUT /experiences/:id
                            {
                              title, companyName, location, ...
                              accomplishments: [
                                { id: "existing-1", title: "...", narrative: "...", ordinal: 0 },
                                { id: null, title: "New one", narrative: "...", ordinal: 1 },  // add
                                // missing id "existing-2" → delete
                              ]
                            }
                                   ↓
                            UpdateExperience use case
                            (diffs accomplishments, applies all in one transaction)
```

---

## Scope of Changes

### Domain Layer (`domain/`)

- **Experience aggregate** — may need a method like `updateAccomplishments(accomplishments)` that handles the diff logic (add new, update existing, remove missing, reorder)
- Verify that `Experience` entity already holds `accomplishments` as a managed collection

### Application Layer (`application/`)

- **`UpdateExperience` use case** — extend input to accept the full accomplishments list:
  ```typescript
  type UpdateExperienceInput = {
    id: string;
    title: string;
    companyName: string;
    // ... other experience fields
    accomplishments: {
      id: string | null;        // null = new accomplishment
      title: string;
      narrative: string;
      ordinal: number;
    }[];
  };
  ```
- The use case diffs the incoming list against the persisted one:
  - Items with `id: null` → create
  - Items with existing `id` → update (title, narrative, ordinal)
  - Persisted items whose `id` is absent from the input → delete
- All changes applied to the aggregate, then `repository.save(experience)` persists atomically

### Infrastructure Layer (`infrastructure/`)

- **`PostgresExperienceRepository.save()`** — must handle accomplishment inserts, updates, and deletes within the same transaction (MikroORM's `em.flush()` should handle this if the ORM entity's collection is properly managed)
- Verify that the ORM `Experience` entity has a `@OneToMany` collection for accomplishments with `orphanRemoval: true`

### API Layer (`api/`)

- **`UpdateExperienceRoute`** — extend the request body schema to accept `accomplishments` array
- The individual accomplishment endpoints (`POST/PUT/DELETE /experiences/:id/accomplishments/...`) can remain for now but should no longer be used by the form modal. Consider deprecating them later.

### Frontend (`web/`)

#### State Management

- **`ExperienceFormModal`** — becomes the single source of truth for all changes:
  - Experience field dirty tracking (already exists via `useDirtyTracking`)
  - Accomplishment list state: a local `useState<LocalAccomplishment[]>` initialized from the experience's accomplishments
  - Tracks adds (items with temporary IDs), edits (changed title/narrative), deletes (removed items), and reorder (changed ordinals)
  - The `dirtyCount` passed to `FormModal` should include accomplishment changes

- **`AccomplishmentListEditor`** — changes from API-driven to callback-driven:
  - No longer calls `useAddAccomplishment`, `useUpdateAccomplishment`, `useDeleteAccomplishment`
  - Instead receives callbacks: `onAdd(title, narrative)`, `onUpdate(id, title, narrative)`, `onDelete(id)`, `onReorder(ids)`
  - Parent manages the state; editor is purely presentational + local editing

- **`AccomplishmentEditor`** — becomes a controlled component:
  - Receives `accomplishment` and `onChange(field, value)` / `onDelete()` callbacks
  - No longer has its own `useDirtyTracking` — dirty state is managed by the parent form
  - The `SaveBar` per-accomplishment is removed (there's one Save for the whole form)

#### Drag-and-Drop (already partially implemented)

- The `@dnd-kit` integration in `AccomplishmentListEditor` stays, but `handleDragEnd` just calls `onReorder(newIds)` instead of firing API mutations
- Optimistic reorder is trivial since it's just local state

#### Save Flow

On Save click:
1. Validate experience fields (existing)
2. Validate all accomplishments (title required, etc.)
3. Call `updateExperience.mutate({ ...experienceFields, accomplishments: localAccomplishments })`
4. On success: reset dirty state, show toast
5. On error: keep dirty state, show error toast

On Discard:
1. Reset experience fields to saved state (existing)
2. Reset accomplishments to the original list from the server
3. All local adds/edits/deletes/reorders are discarded

---

## Files to Modify

| Layer | File | Change |
|---|---|---|
| domain | `domain/src/entities/Experience.ts` | Add `updateAccomplishments()` method if needed |
| application | `application/src/use-cases/experience/UpdateExperience.ts` | Accept accomplishments in input, diff and apply |
| application | `application/test/use-cases/experience/UpdateExperience.test.ts` | Test accomplishment diff logic |
| infrastructure | `infrastructure/src/repositories/PostgresExperienceRepository.ts` | Ensure save handles accomplishment collection changes |
| api | `api/src/routes/experience/UpdateExperienceRoute.ts` | Extend body schema with accomplishments array |
| web | `web/src/components/resume/experience/ExperienceFormModal.tsx` | Manage local accomplishment state, pass to children |
| web | `web/src/components/resume/experience/AccomplishmentListEditor.tsx` | Switch from API-driven to callback-driven |
| web | `web/src/components/resume/experience/AccomplishmentEditor.tsx` | Controlled component, remove individual save |
| web | `web/src/hooks/use-experiences.ts` | Update `useUpdateExperience` input type to include accomplishments |

---

## What to Keep

- Individual accomplishment API endpoints (`POST/PUT/DELETE`) — keep for now, may be useful elsewhere
- Drag-and-drop with `@dnd-kit` — keep the UI, just change the handler from API call to local state update
- `useDirtyTracking` hook — reuse for experience fields, extend or complement for accomplishment tracking

## What to Remove

- Per-accomplishment `SaveBar` in `AccomplishmentEditor`
- `useDirtyTracking` inside `AccomplishmentEditor` (moves to parent)
- Direct API calls from `AccomplishmentListEditor` (`useAddAccomplishment`, `useUpdateAccomplishment`, `useDeleteAccomplishment`, `useReorderAccomplishments`)
- `onAccomplishmentDirtyChange` callback prop (dirty tracking moves inside the form)

---

## Testing

1. **Unit tests** (application layer): UpdateExperience use case with accomplishment diffs — add, update, delete, reorder, mixed operations, empty list, no changes
2. **Frontend**: Open experience edit, add an accomplishment, reorder, edit another, delete one — verify nothing persists until Save. Click Discard — verify everything reverts. Click Save — verify all changes persist atomically.
3. **Edge cases**: Save with validation errors on an accomplishment, save with no accomplishment changes (only experience fields), concurrent edits
