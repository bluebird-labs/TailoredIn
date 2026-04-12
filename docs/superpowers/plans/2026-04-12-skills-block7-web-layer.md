# Plan: Skills Block 7 — Web Layer (Skill Picker UI)

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

UI for adding/removing skills on an experience in the profile page. Skill picker with fuzzy typeahead search, results grouped by category, selected skills as removable chips. Follows the existing click-to-edit interaction pattern from the UX guidelines.

## Depends on

- Block 6 (API routes must exist)

## Deliverables

### API Client

- [ ] Add Eden Treaty types for `GET /skills`, `GET /skill-categories`, `PUT /experiences/:id/skills`
- [ ] TanStack Query hooks: `useSearchSkills(query)`, `useListSkillCategories()`, `useSyncExperienceSkills()`

### Skill Picker Component

- [ ] `web/src/components/skill-picker/SkillPicker.tsx` — typeahead input component
  - Debounced input fires `GET /skills?q=<query>`
  - Results dropdown grouped by category (from `SkillCategoryDto`)
  - Click to select a skill → adds to selected set
  - Handles empty state, loading state, no results
- [ ] `web/src/components/skill-picker/SkillChip.tsx` — removable chip/tag for a selected skill
  - Shows skill label + optional category color/icon
  - X button to remove

### Experience Integration

- [ ] Update experience detail/edit view to show skills section
  - Display mode: show skill chips (read-only)
  - Edit mode: show SkillPicker + existing chips with remove buttons
  - Save calls `PUT /experiences/:id/skills` with current skillId set
- [ ] Integrate with existing click-to-edit pattern (mutual exclusion of editable sections)

### Design System Compliance

- [ ] Follow design-system.md: OKLch color tokens, no bold/semibold, borders not shadows
- [ ] Follow ux-guidelines.md: click-to-edit, mutual exclusion, validation timing

## Verification

```bash
bun run typecheck
bun run check
# Manual: start dev servers (wt:up), navigate to profile → experience, test:
# - Typeahead search with various queries
# - Typo tolerance (e.g., "raect" finds React)
# - Alias search (e.g., "golang" finds Go)
# - Add/remove skills
# - Save and reload — skills persist
# - Empty experience (no skills yet)
```
