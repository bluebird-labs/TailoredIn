# Detail Pages, Modal Stacking & Navigation Patterns

**Date:** 2026-04-05
**Status:** Draft
**Scope:** Companies + Experiences detail pages, modal stacking treatment, navigation flow changes, storybook additions, design doc updates

---

## Context

TailoredIn currently uses an edit-modal-first pattern for all entities. Clicking a company or experience card opens a form modal. This creates UX problems:

1. **No information-oriented view** — users must open an edit modal to read company details or experience accomplishments
2. **Modal-over-modal confusion** — "View Company" from an experience opens a second modal on top, with no visual hierarchy between the two
3. **Nested content is cramped** — job descriptions under companies and accomplishments under experiences don't have room to breathe inside a modal

This spec introduces **detail pages** as the primary read view, **modal stacking treatment** for visual depth, and updates navigation flows accordingly.

---

## 1. Detail Pages

### 1.1 Company Detail Page

**Route:** `/companies/:id`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Breadcrumb: Companies / {name}                      │
├─────────────────────────────────────────────────────┤
│ [Logo]  Acme Corporation              [Website][Edit]│
│         SaaS · Series B · Technology                │
├─────────────────────────────────────────────────────┤
│ Overview | Job Descriptions (3)                     │
├────────────────────────┬────────────────────────────┤
│ ABOUT                  │ DETAILS                    │
│ Description text...    │ Website    acme.com        │
│                        │ LinkedIn   linkedin.com/…  │
│                        │ Industry   Technology      │
│                        │ Stage      Series B        │
│                        │ Business   SaaS            │
└────────────────────────┴────────────────────────────┘
```

**Components:**

| Element | Behavior |
|---|---|
| Breadcrumb | `Companies` link → `/companies/`, current page name as plain text |
| Header | Company logo (letter fallback), name (h1), meta badges (businessType, stage, industry) |
| Website button | `btn-outline`, opens external link in new tab |
| Edit button | `btn-primary`, opens existing `CompanyFormModal` in edit mode |
| Tabs | `Overview` (default), `Job Descriptions` with count badge |
| Overview tab | Two-column grid: About card (description) + Details card (key-value rows) |
| Job Descriptions tab | List of job description cards (future — currently no JD entity, placeholder empty state) |

**Data fetching:** New query `useCompany(id)` hitting `GET /api/companies/:id`. Query key: `queryKeys.companies.detail(id)`.

### 1.2 Experience Detail Page

**Route:** `/experiences/:id`

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ Breadcrumb: Experiences / {title}                            │
├──────────────────────────────────────────────────────────────┤
│ [Co.Logo]  Senior Software Engineer                    [Edit]│
│            ↗ Acme Corporation · San Francisco · Mar 2022–Now │
├──────────────────────────────────────────────────────────────┤
│ Overview | Accomplishments (4)                               │
├──────────────────────────────────────┬───────────────────────┤
│ SUMMARY                              │ LINKED COMPANY        │
│ Leading a team of 6 engineers…       │ ┌───────────────────┐ │
│                                      │ │ [A] Acme Corp   → │ │
│ DETAILS                              │ │     SaaS · Ser B  │ │
│ Title      Senior Software Engineer  │ └───────────────────┘ │
│ Company    Acme Corporation          │                       │
│ Location   San Francisco, CA         │ QUICK STATS           │
│ Period     Mar 2022 – Present        │ Accomplishments  4    │
│                                      │ Duration      3y 1m   │
└──────────────────────────────────────┴───────────────────────┘
```

**Components:**

| Element | Behavior |
|---|---|
| Breadcrumb | `Experiences` link → `/experiences/`, current title as plain text |
| Header | Linked company logo (or letter fallback), title (h1), company name as clickable link → `/companies/:id`, location, date range |
| Edit button | `btn-primary`, opens existing `ExperienceFormModal` in edit mode |
| Tabs | `Overview` (default), `Accomplishments` with count badge |
| Overview tab | Main column (Summary card + Details card) + side panel (Linked Company card + Quick Stats card) |
| Linked Company card | Clickable → navigates to `/companies/:id`. Shows logo, name, meta, arrow icon. Hover: `bg-accent/40` wash |
| Accomplishments tab | Vertical list of accomplishment cards: ordinal badge, title (h3), narrative text |

**Data fetching:** New query `useExperience(id)` hitting `GET /api/experiences/:id`. Query key: `queryKeys.experiences.detail(id)`.

**Side panel layout:** Main column takes `1fr`, side panel is fixed `280px`. On the Overview tab only.

---

## 2. Modal Stacking (Scale + Blur)

When a second dialog opens over an existing modal (e.g., discard confirmation over an edit form), the background modal receives a "pushed back" treatment.

### CSS Treatment

| Property | Background modal | Foreground modal |
|---|---|---|
| `transform` | `scale(0.90)` | none (default) |
| `filter` | `blur(1.5px)` | none |
| `opacity` | `0.5` | `1` |
| `transition` | `transform 200ms ease, filter 200ms ease, opacity 200ms ease` | standard dialog enter animation |
| `box-shadow` | existing | `0 16px 48px rgba(0,0,0,0.2)` |

### Overlay Between Modals

A light overlay (`rgba(0, 0, 0, 0.15)`) renders between the background and foreground modals. This is in addition to the existing page-level backdrop overlay.

### Implementation

The `FormModal` component needs to detect when a child dialog (e.g., `ConfirmDialog`, `AlertDialog`) is open and apply the stacking classes to its own `DialogContent`. This can be achieved via:

- A `data-stacked="true"` attribute on the background modal's `DialogContent` when a nested dialog opens
- CSS targeting `[data-stacked="true"]` for the scale/blur/opacity treatment
- The nested dialog's `onOpenChange` toggles this attribute on the parent

### When It Applies

- `FormModal` with nested `ConfirmDialog` (discard changes)
- Any future case where a dialog spawns another dialog
- Does NOT apply to popovers, dropdowns, or tooltips overlapping a modal

---

## 3. Navigation Flow Changes

### Before (current)

```
Company list → click card → CompanyFormModal (edit)
Experience list → click card → ExperienceFormModal (edit)
Experience modal → "View Company" → CompanyFormModal (modal over modal)
```

### After (new)

```
Company list → click card → /companies/:id (detail page) → Edit button → CompanyFormModal
Experience list → click card → /experiences/:id (detail page) → Edit button → ExperienceFormModal
Experience detail → click linked company → /companies/:id (navigation, no modal)
```

### Card Click Behavior Change

- `CompanyCard` and `ExperienceCard` become navigation links (`<Link to="/companies/$id">`)
- No longer call `onClick` to open a modal
- Cards gain a subtle hover arrow or navigation indicator
- Delete action remains on the card via hover-revealed dropdown menu (existing pattern)

### "View Company" Replacement

The `CompanySearchPopover` in the experience edit flow currently has a "View" action that opens `CompanyFormModal`. This should be changed to navigate to `/companies/:id` (closing the modal first, or opening in a new context).

On the Experience detail page, the Linked Company card in the side panel is a direct navigation link.

---

## 4. Storybook Additions

### New Stories

| Component | Story file | Variants |
|---|---|---|
| `DetailPageHeader` | `DetailPageHeader.stories.tsx` | With logo, without logo, with external link, with/without edit button |
| `DetailTabs` | `DetailTabs.stories.tsx` | Two tabs, three tabs, with count badges, active states |
| `InfoCard` | `InfoCard.stories.tsx` | Description variant, key-value rows variant, empty state |
| `LinkedEntityCard` | `LinkedEntityCard.stories.tsx` | With logo, without logo, hover state |
| `StackedModal` | `StackedModal.stories.tsx` | FormModal with ConfirmDialog on top demonstrating scale+blur |

### Story Location

All stories co-located with their component files per existing convention.

---

## 5. Design Document Updates

### `web/design/ux-guidelines.md`

Add new section **"5. Detail Pages"** covering:

- When to use detail pages vs. modals vs. inline editing (detail pages for entities with nested content or cross-references)
- Read-only default with Edit button → modal pattern
- Breadcrumb navigation pattern
- Tab pattern with count badges
- Linked Entity Card pattern (clickable card navigating to another detail page)
- Side panel layout for supplementary info

Update existing section **"1. Editing & Forms → Modal Forms"** to add:

- Stacked modal visual treatment rules (scale + blur)
- When stacking applies vs. doesn't

### `web/design/design-system.md`

Add to **"Component Patterns"** section:

- **Detail Page Header**: logo (52px, 12px radius), h1 title, meta badges, action buttons right-aligned
- **Breadcrumb**: 13px, muted-fg with primary-colored links, `/` separator
- **Info Card (Read-Only)**: same card styling, section-label (11px uppercase), description or key-value rows
- **Linked Entity Card**: card with hover `bg-accent/40`, logo + name + meta + arrow, 14px border-radius
- **Accomplishment Card**: title (h3 15px/500), narrative (14px/400), ordinal badge (11px muted)
- **Stacked Modal**: background `scale(0.90) blur(1.5px) opacity(0.5)`, foreground shadow `0 16px 48px`

---

## 6. Shared Components to Create

| Component | Location | Purpose |
|---|---|---|
| `DetailPageHeader` | `web/src/components/shared/DetailPageHeader.tsx` | Reusable header with logo, title, meta items, action buttons |
| `DetailTabs` | `web/src/components/shared/DetailTabs.tsx` | Tab bar wrapping existing `Tabs` primitive with count badge support |
| `InfoCard` | `web/src/components/shared/InfoCard.tsx` | Read-only card with section label + children (description or key-value layout) |
| `LinkedEntityCard` | `web/src/components/shared/LinkedEntityCard.tsx` | Clickable navigation card for cross-entity links |
| `Breadcrumb` | `web/src/components/shared/Breadcrumb.tsx` | Simple breadcrumb with parent link + current page text |

---

## 7. Route & API Changes

### New Routes (TanStack Router)

| File | Route |
|---|---|
| `web/src/routes/companies/$companyId.tsx` | `/companies/:companyId` |
| `web/src/routes/experiences/$experienceId.tsx` | `/experiences/:experienceId` |

### New API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/companies/:id` | Single company detail (**new — does not exist yet**) |
| `GET` | `/api/experiences/:id` | Single experience detail with accomplishments (**new — does not exist yet**) |

### New Query Hooks

| Hook | Query Key |
|---|---|
| `useCompany(id)` | `queryKeys.companies.detail(id)` |
| `useExperience(id)` | `queryKeys.experiences.detail(id)` |

---

## Verification

1. **Company detail page**: Navigate to `/companies/:id` — breadcrumb, header, tabs, Overview and Job Descriptions tabs render correctly
2. **Experience detail page**: Navigate to `/experiences/:id` — header with company link, Overview with side panel, Accomplishments tab
3. **Navigation flow**: Click company card in list → detail page (not modal). Click Edit → modal opens. Close modal → back on detail page
4. **Cross-entity navigation**: Click Linked Company card on experience detail → navigates to company detail page
5. **Modal stacking**: On a detail page, click Edit → modal opens. Make a change, click Cancel → confirm dialog appears with background modal scaled/blurred
6. **Storybook**: All 5 new stories render correctly with variants. Run `bun run --cwd web storybook` and verify
7. **Design docs**: Review updated `ux-guidelines.md` and `design-system.md` for completeness and consistency with implementation
8. **Quality checks**: `bun run typecheck`, `bun run check`, `bun run test` all pass
