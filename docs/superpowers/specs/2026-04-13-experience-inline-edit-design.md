# Experience Page Inline Editing

## Context

The Experience detail page (`/experiences/$experienceId`) currently uses a modal (`ExperienceFormModal`) for all editing — overview fields, skills, and accomplishments are all edited inside one large modal dialog. This is inconsistent with the Education list, which already uses the inline `EditableSection` pattern. The goal is to replace the modal with inline click-to-edit sections, making the experience page feel lighter and more direct.

## Overview Tab Layout

Two-column grid layout (`1fr 280px`), matching the current grid but with different content distribution.

### Left Column

**Details section** — `EditableSection` with `variant="card"`.
- Display mode: `InfoRow` grid showing company name, website, location, start date, end date, bullet min, bullet max.
- Edit mode: `EditableField` inputs for all seven fields. Company name, start date, end date are required. Website and location are optional. Bullet min/max are number fields.
- API: `PUT /experiences/:id` (UpdateExperience use case) — sends all experience core fields.
- Note: the `title` field also appears in the `DetailPageHeader`. It updates reactively via TanStack Query cache invalidation after save.

**Summary section** — `EditableSection` with `variant="card"`.
- Display mode: summary text paragraph, or italic "No summary" placeholder.
- Edit mode: single `EditableField` textarea.
- API: `PUT /experiences/:id` (same UpdateExperience use case) — sends summary along with current field values.

### Right Column (Sidebar)

**Linked Company card** — read-only, kept exactly as-is. Links to `/companies/$companyId`.

**Skills section** — `EditableSection` with `variant="card"`.
- Display mode: skill chips rendered with `SkillChip`. If empty, italic "No skills tagged" placeholder.
- Edit mode: existing skill chips with X buttons for removal, plus the `SkillPicker` component inline for adding new skills. Tracks added/removed skill IDs as local state.
- API: `PUT /experiences/:id/skills` (SyncExperienceSkills use case) — sends the full `skill_ids` array on save.

### Removed Elements

- **Quick Stats card** — removed (information is redundant with the visible chips, accomplishment tab count badge, and now-editable bullet range fields).
- **Header Edit button** — removed (no more modal trigger).
- **ExperienceFormModal import/usage** — removed from the route file.

## Accomplishments Tab

Each accomplishment is its own `EditableSection` card with `variant="card"`.

### List Layout

1. **"Add accomplishment" button** — at the top, dashed outline button (`+ Add accomplishment`). Opens a create modal (same `FormModal` pattern as `CreateEducationModal`).
2. **Accomplishment cards** — stacked below, numbered `#1`, `#2`, etc.

### Display Mode (per card)

Shows `#N` index, title (15px medium), and narrative text (14px muted) — same as current layout.

### Edit Mode (per card)

- Title field — `EditableField` type `text`, required.
- Narrative field — `EditableField` type `textarea`, required.
- Delete button — trash icon in top-right corner, triggers `ConfirmDialog` before deleting.
- Inline `SaveBar` at the bottom.
- API: `PUT /experiences/:id/accomplishments/:accomplishmentId` (UpdateAccomplishment) for save, `DELETE /experiences/:id/accomplishments/:accomplishmentId` (DeleteAccomplishment) for delete.

### Create Modal

Triggered by the "Add accomplishment" button. Uses `FormModal` with title + narrative fields. API: `POST /experiences/:id/accomplishments` (AddAccomplishment). Sets ordinal to current list length.

## Shared Behavior

All editable sections on the page (Details, Summary, Skills, and all Accomplishment cards) share a single `EditableSectionProvider` at the route level. This enforces mutual exclusion — only one section can be in edit mode at a time. Other sections appear dimmed/blocked while one is active.

Each section follows the established pattern:
- `useDirtyTracking` hook for form state and dirty detection.
- Validation on save attempt only (not on keystroke).
- `SaveBar` with Save/Discard buttons.
- Escape key discards if clean.
- Auto-close on successful save (when `isDirty` transitions to false after save attempt).
- Toast feedback on success/error via `sonner`.

## Files to Modify

| File | Change |
|---|---|
| `web/src/routes/experiences/$experienceId.tsx` | Rewrite: replace modal with `EditableSectionProvider` + inline sections |
| `web/src/components/resume/experience/ExperienceFormModal.tsx` | Delete (no longer used from this page — check for other usages first) |
| `web/src/components/resume/experience/AccomplishmentListEditor.tsx` | Delete if only used inside the modal |
| `web/src/components/resume/experience/AccomplishmentEditor.tsx` | Delete if only used inside the modal |
| `web/src/lib/validation.ts` | Add `validateExperienceDetails` and `validateAccomplishment` functions if not already present |
| `web/design/ux-guidelines.md` | Update the "Complex entities" note to reflect that Experiences now use inline editing |

## Files to Reuse (no modifications)

| File | Purpose |
|---|---|
| `web/src/components/shared/EditableSection.tsx` | Compound component for display/editor slots |
| `web/src/components/shared/EditableField.tsx` | Form field with dirty indicator |
| `web/src/components/shared/EditableSectionContext.tsx` | Mutual exclusion provider + hook |
| `web/src/components/shared/SaveBar.tsx` | Inline save/discard buttons |
| `web/src/components/shared/ConfirmDialog.tsx` | Delete confirmation |
| `web/src/components/shared/FormModal.tsx` | Create accomplishment modal |
| `web/src/components/shared/InfoCard.tsx` | Card wrapper with label |
| `web/src/components/shared/InfoRow.tsx` | Key-value display row |
| `web/src/components/skill-picker/SkillChip.tsx` | Skill chip display |
| `web/src/components/skill-picker/SkillPicker.tsx` | Skill search + add |
| `web/src/hooks/use-dirty-tracking.ts` | Form state + dirty tracking |
| `web/src/hooks/use-experiences.ts` | Experience query + mutations |

## Verification

1. Run `bun run typecheck` — no type errors.
2. Run `bun run check` — Biome lint/format passes.
3. Run `bun run knip` — no dead exports from removed files.
4. Start dev server (`bun wt:up`) and verify:
   - Overview tab: click Details card, edit fields, save — values persist after reload.
   - Overview tab: click Summary card, edit text, discard — reverts to original.
   - Overview tab: click Skills section, add a skill, remove a skill, save — chips update.
   - Mutual exclusion: click Details while Summary is open — Summary should block.
   - Accomplishments tab: click a card, edit title/narrative, save.
   - Accomplishments tab: delete an accomplishment with confirmation.
   - Accomplishments tab: add new accomplishment via top button + modal.
   - Escape key discards clean sections.
5. Run `bun e2e:test` — existing E2E tests pass (update any that test the old modal flow).
