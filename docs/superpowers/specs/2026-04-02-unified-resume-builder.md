# Unified Resume Builder — Design Spec

## Overview

Replace the current `/resume/builder` (checkbox-based content picker) and `/resume/experience` (CRUD list) with a single unified page that renders like a resume document. All editing happens through modals; the page itself is a clean preview of what the PDF will look like.

## Page Structure

### Sticky Header Bar
- Left: "Resume Builder" label
- Right: "Generate PDF" button with download icon
- No keywords input in this version

### Resume Document Area (centered, max-width ~680px)

The page renders top-to-bottom in the same order and visual style as the Typst PDF output:

#### 1. Personal Info Header
- **Name**: Large Raleway font, left-aligned
- **Contact row**: Icon + text pairs in a single line, wrapping if needed
  - LinkedIn (network icon), Email (envelope), Phone (handset), Location (map pin), GitHub (octocat)
  - Same order as PDF output
- **Edit button**: Pencil icon, top-right corner, low opacity, visible on hover
- **Interaction**: Pencil opens a modal with form fields for all personal info (first name, last name, email, phone, LinkedIn URL, GitHub URL, location)

#### 2. Headline
- Rendered as italic text below the contact row, separated by a thin rule
- **Swap button**: Swap-arrows icon on the right, low opacity
- **Interaction**: Opens a modal/popover listing all available headlines. Select one to replace the current headline.

#### 3. Experience Section
- Section title: "EXPERIENCE" uppercase with bottom border (matching PDF)
- Experiences sorted by `startDate` descending (most recent first)
- **Company grouping**: Consecutive positions at the same company grouped under one company header with aggregated date range
- **Each company block renders**:
  - Company name (bold) + date range (right-aligned)
  - Per position: title (semibold) + date range, optional italic summary, visible bullet points as `•` list
- **Edit button**: Pencil icon, top-right of company block, appears on hover
- **Only visible (included) bullets shown on the page** — hidden bullets are completely absent from the preview

##### Experience Edit Modal
Opens per company block. Contains all positions at that company. For each position:
- **Editable fields**: Title, Location, Start date, End date (grid layout)
- **Bullets section**: Each bullet shows its default approved variant text. Listed as cards with:
  - Drag handle (grip dots) for reordering
  - Variant text (the first approved variant per bullet)
  - Eye/eye-off icon to toggle inclusion in the PDF
- Hidden bullets shown dimmed + strikethrough in the modal
- Note: The generate payload sends `bullet_variant_ids`, so toggling a bullet on/off actually includes/excludes its approved variant ID
- "Done" button closes the modal; page updates immediately

#### 4. Education Section
- Section title: "EDUCATION" uppercase with bottom border
- Each entry as a compact single line: **Degree** — Institution, Location + Year (right)
- **Eye icon** per entry to toggle inclusion (appears on hover)
- Excluded entries shown dimmed + strikethrough on the page

### Icon System (Lucide-style SVG, monochrome)
| Icon | Purpose | Where |
|------|---------|-------|
| Eye | Included in PDF | Education rows, modal bullets |
| Eye-off | Excluded from PDF | Education rows, modal bullets |
| Grip dots | Drag to reorder | Modal bullets |
| Pencil | Edit (opens modal) | Personal info, experience blocks |
| Swap arrows | Change selection | Headline |
| Download | Generate PDF | Header button |
| LinkedIn, Mail, Phone, MapPin, GitHub | Contact info | Personal info row |

All icons are low-opacity by default (0.25), increase on hover (0.6). No emoji anywhere.

## State Management

### Local UI State
- `selectedHeadlineId: string` — which headline is active
- `visibleBulletVariantIds: Map<string, Set<string>>` — per experience, which variant IDs are visible
- `bulletOrder: Map<string, string[]>` — per experience, ordered list of bullet IDs
- `visibleEducationIds: Set<string>` — which education entries are included
- `editingCompany: string | null` — which company block has its modal open
- `editingPersonalInfo: boolean` — personal info modal open

### Data Fetching (React Query)
Reuses existing hooks:
- `useExperiences()` — experiences with bullets and variants
- `useHeadlines()` — headline list
- `useEducations()` — education list
- Profile data (existing query or new hook)

### Auto-Selection on Load
- **Headline**: First available
- **Experiences**: All experiences selected, with bullet taper (8, 6, 5, 4, 3, 3, 2, 2, 2) — most recent experience gets up to 8 visible approved variants, decreasing for older ones
- **Education**: Only B.S. degrees preselected
- Bullet order: Default ordinal from database

### Generate PDF
Constructs payload from local state and calls `POST /api/resumes/generate`:
```typescript
{
  headline_id: selectedHeadlineId,
  experience_selections: experiences.map(exp => ({
    experience_id: exp.id,
    bullet_variant_ids: visibleBulletVariantIds.get(exp.id) ?? []
  })),
  education_ids: [...visibleEducationIds],
  skill_category_ids: [],
  skill_item_ids: [],
  keywords: []
}
```

## Pages to Remove
- `/resume/experience` — functionality absorbed into unified builder
- Navigation sidebar entry for "Experience" removed; "Builder" becomes the primary entry

## Pages Unchanged
- `/resume/profile` — still exists for full profile editing
- `/resume/education` — still exists for CRUD on education entries
- `/resume/headlines` — still exists for CRUD on headlines
- `/resume/skills` — still exists, untouched

## Components

### New Components
- `ResumePreview` — the document-like page body (personal info, headline, experiences, education)
- `PersonalInfoModal` — modal for editing contact/profile fields
- `HeadlineSwapModal` — modal/popover for picking a headline
- `ExperienceEditModal` — modal per company with position fields + sortable bullet list
- `ContactIconRow` — renders contact info with SVG icons

### Reused Components
- `SortableList` / `SortableItem` from `@dnd-kit` (already in codebase for skills page)
- `Dialog` from shadcn/ui
- `MonthYearPicker` (existing component)
- Existing React Query hooks

### Components to Retire
- `ExperienceRow`, `BulletLine`, `VariantCard`, `VariantList` — replaced by the new modal-based editing
- Current `builder.tsx` checkbox-based UI

## Mutations

The experience edit modal saves changes via existing API endpoints:
- `PUT /experiences/:id` — update title, location, dates
- Bullet reorder — `PUT /bullets/:id` with updated ordinal
- Bullet visibility is local state only (not persisted to DB) — it controls what gets sent in the generate payload

Personal info modal saves via `PUT /profile` (existing endpoint).

## E2E Tests

### Tests to Rewrite
- `e2e/tests/resume/experience.spec.ts` — the experience page no longer exists as a standalone; all 11 tests need to be replaced with builder-centric equivalents
- `e2e/tests/resume-generation/generate.spec.ts` — generation now happens from the builder page, not from a job detail page; needs new selectors and flow

### New E2E Test File: `e2e/tests/resume/builder.spec.ts`

Covers:
1. **Page renders with seeded data** — name, contact icons, headline, experiences grouped by company, education visible
2. **Personal info modal** — pencil opens modal, edit a field, save, page updates
3. **Headline swap** — swap icon opens modal, select different headline, page shows new text
4. **Experience edit modal opens** — pencil on company block opens modal with positions and bullets
5. **Bullet visibility toggle** — toggle eye off in modal, close, bullet gone from preview; toggle back on, bullet reappears
6. **Bullet reorder** — drag bullet to new position in modal, close, order reflected on page
7. **Experience field edit** — change title in modal, save, page reflects new title
8. **Education visibility toggle** — click eye on education row, entry dims; click again, restores
9. **Generate PDF** — click generate, intercept response, verify PDF headers (status 200, content-type application/pdf, %PDF- magic bytes)
10. **Generate respects visibility** — hide a bullet, generate, verify different PDF size than with all bullets visible

### Test to Remove
- `e2e/tests/resume/experience.spec.ts` — delete entirely

### Test to Update
- `e2e/tests/resume-generation/generate.spec.ts` — rewrite to test generation from builder page instead of job detail page (or merge into builder.spec.ts)

## No Changes to Backend
All existing API endpoints and use cases remain as-is. The only change is on the frontend.
