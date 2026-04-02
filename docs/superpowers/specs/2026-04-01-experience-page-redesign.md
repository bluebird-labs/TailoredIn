# Spec: Experience Page Redesign — Resume-Style Layout

**Date:** 2026-04-01
**Status:** Draft
**Mockups:** `.superpowers/brainstorm/10308-1775088194/content/full-design.html`

## Problem

The current experience page is a heavy CRUD interface with 3 levels of nested bordered cards (experience → bullet → variant), action buttons on every item, and everything expanded at once. It doesn't resemble the resume output it's editing, making it hard to visualize how content will appear in the final PDF.

## Design

Replace the card-based layout with a **resume-style reading layout** with editing affordances tucked to the side and inline.

### Layout: Two-Column Split

```
┌─────────────────────────────────────────┬──────────┐
│ Resume-style content (left)             │  Action  │
│                                         │  gutter  │
│ Title .......................... Dates   │  (right) │
│ Company                       Location  │          │
│ Summary (italic)                        │  Edit    │
│                                         │  Delete  │
│ • Bullet text            [edit] [⟳ 2]  │          │
│ • Bullet text (expanded)  [edit] [⟳ 2▴]│  + Add   │
│   ┃ Variant 1 [APPROVED] [edit] [del]   │  bullet  │
│   ┃ Variant 2 [PENDING]  [✓] [✗] [edit] │          │
│   ┃ + Add variant                       │  4 bul   │
│ • Bullet text                   [edit]  │  3 var   │
│                                         │          │
├─────────────────────────────────────────┼──────────┤
│ Next experience...                      │  ...     │
└─────────────────────────────────────────┴──────────┘
```

### Left Panel — Resume Content

Each experience renders as a section that reads like the actual resume:

- **Header row:** Title (bold, 15px) left-aligned, dates (12px, muted) right-aligned
- **Subtitle:** Company name (13px, medium weight), location (12px, muted, right)
- **Summary:** Italic, muted, 12px — only if present
- **Bullet list:** Unstyled list with `•` prefix, 13px body text

No cards, no borders between experiences — just a subtle bottom border separating each experience block.

### Right Gutter — Experience-Level Actions

Fixed-width (~120px) panel on the right side of each experience:

- **Experience** section: Edit (opens dialog for metadata), Delete
- **Bullets** section: + Add (inline input at bottom of bullet list)
- **Stats footer:** "{N} bullets · {N} var" — at a glance count

### Inline Bullet Pills — Always Visible

Each bullet row ends with small pill-shaped buttons:

- **`edit`** — always present, 10px, muted border. Opens inline text editing (same as current).
- **`⟳ N`** — variant count pill, only shown when variants exist. Indigo tint (`#eef2ff` bg, `#6366f1` text). Click toggles variant expansion.
- No delete on bullets inline — that's a destructive action, accessed via edit mode or gutter.

### Inline Variant Expand

Clicking `⟳ N` toggles a variant section below the bullet:

- **Visual treatment:** Left border (2px, `#c7d2fe`), indented 20px from bullet
- **Active bullet** gets a subtle blue background (`#f8faff`) and the pill inverts to solid (`#6366f1` bg, white text, `▴` indicator)
- Each variant is a small card (white bg, subtle border, 6px radius) containing:
  - Variant text (12px)
  - Tag row: approval status badge, angle badge, source badge
  - Action pills (right-aligned): `edit`, `del`
  - **PENDING only:** `✓` (approve, green) and `✗` (reject, red) pills before edit/del
- **"+ Add variant"** link at the bottom of the expanded list

### Approval Status Badges

| Status | Background | Text | Border |
|---|---|---|---|
| APPROVED | `#f0fdf4` | `#16a34a` | `#bbf7d0` |
| PENDING | `#fefce8` | `#ca8a04` | `#fde68a` |
| REJECTED | `#fef2f2` | `#dc2626` | `#fecaca` |

### Interactions

| Action | Trigger | Behavior |
|---|---|---|
| Edit experience metadata | Gutter "Edit" button | Opens dialog (same as current) |
| Delete experience | Gutter "Delete" button | Confirmation dialog |
| Add bullet | Gutter "+ Add" button | Inline input at bottom of bullet list |
| Edit bullet | Inline `edit` pill | Replaces bullet text with input + save/cancel |
| Toggle variants | Inline `⟳ N` pill | Expands/collapses variant list below bullet |
| Approve variant | `✓` pill (PENDING only) | Mutation, badge updates to APPROVED |
| Reject variant | `✗` pill (PENDING only) | Mutation, badge updates to REJECTED |
| Edit variant | `edit` pill on variant | Inline text editing within variant card |
| Delete variant | `del` pill on variant | Immediate delete (variant-level, low risk) |
| Add variant | "+ Add variant" link | Inline form at bottom of variant list |

### Component Breakdown

The current `experience.tsx` is a single 700+ line file. Decompose into:

| Component | File | Responsibility |
|---|---|---|
| `ExperiencePage` | `experience.tsx` | Page shell, experience list, add dialog |
| `ExperienceRow` | `experience-row.tsx` | Single experience: header, summary, bullet list, gutter |
| `BulletLine` | `bullet-line.tsx` | Single bullet with inline pills + variant toggle |
| `VariantList` | `variant-list.tsx` | Expanded variant list with cards + add form |
| `VariantCard` | `variant-card.tsx` | Single variant with badges + action pills |

### Sorting

Experiences sort by `startDate` descending (most recent first). Dates are `YYYY-MM` format so string comparison works.

## Files to Modify

| File | Change |
|---|---|
| `web/src/routes/resume/experience.tsx` | Rewrite — new layout, extract components |
| `web/src/components/experience/experience-row.tsx` | **New** |
| `web/src/components/experience/bullet-line.tsx` | **New** |
| `web/src/components/experience/variant-list.tsx` | **New** |
| `web/src/components/experience/variant-card.tsx` | **New** |

## What's NOT Changing

- API endpoints — same data, same mutations
- Data model — no domain/infrastructure changes
- Other pages — this is experience page only
- Create/edit experience dialog — keeps the same form (with MonthYearPicker)
