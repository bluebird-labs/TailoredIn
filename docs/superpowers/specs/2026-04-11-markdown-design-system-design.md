# Markdown-Oriented Design System Evolution

## Context

TailoredIn is registering `tailoredin.md` as its domain. This design system evolution aligns the UI's visual identity with the `.md` brand — the app should look and feel like a beautifully typeset markdown document. The warm amber identity stays as the core personality; markdown syntax becomes the primary design vocabulary rendered in that amber.

This spec covers two parallel tracks:
1. **Design system visual evolution** — layering markdown-inspired elements onto the existing system
2. **Experience editor prototype** — rethinking the Experience detail page with inline editing via Milkdown

## Approach

**Approach A: Parallel Tracks** (selected). Evolve the design system visuals AND prototype the Milkdown editor on Experiences. The database schema stays unchanged — this is a UI/UX evolution. Both tracks inform each other but can be evaluated independently.

---

## Track 1: Design System Visual Evolution

### Typography

**New font addition**: Geist Mono Variable (`@fontsource-variable/geist-mono`) alongside existing Geist Variable.

| Context | Font | Usage |
|---|---|---|
| Body text, headings, navigation, buttons | Geist Variable (existing) | Primary reading font |
| Metadata, labels, dates, badges, structural markers | Geist Mono | Structured data, markdown syntax |

### Markdown Structural Markers

All markers use the **primary amber** color (`--marker: oklch(0.58 0.17 45)`). They are not decoration — they ARE the visual identity.

| Marker | Usage | Sizing |
|---|---|---|
| `#` | Page headings (h1) | Same size as heading text (22px), amber, mono, medium weight |
| `##` | Section headings (h2/h3) | Same size as section text (15px), amber, mono |
| `###` | Card/item titles in lists | Same size as card title (14px), amber, mono |
| `---` | Frontmatter fences and horizontal dividers | Amber, mono, visible as block delimiters |
| `>` | Blockquote/callout prefix | Amber, mono, 14px, with 3px amber left border and tinted background |
| `-` | List item bullets | 15px, amber, mono, medium weight |
| `/` | Search field prefix | Replaces magnifying glass icon (vim/Obsidian convention) |
| `[x]` / `[ ]` | Checkbox display (view mode) | GFM task-list syntax, mono |

### Frontmatter Blocks

Structured metadata renders as a YAML-like frontmatter block:

- Background: `--code-bg` (slightly cooler/darker than `--muted`)
- Border: `1px solid --border`, `8px` border-radius
- Fences (`---`) rendered in amber at top and bottom
- Keys in `--marker-muted` (lighter amber), values in `--fg`
- In edit mode: values become inline editable fields with dashed underlines

### New Color Tokens

| Token | Value (light) | Value (dark) | Usage |
|---|---|---|---|
| `--code-bg` | `oklch(0.94 0.015 50)` | `oklch(0.22 0.015 50)` | Frontmatter blocks, inline code badges, search input bg |
| `--marker` | `oklch(0.58 0.17 45)` (= `--primary`) | `oklch(0.70 0.14 45)` (= dark primary) | All markdown syntax markers |
| `--marker-muted` | `oklch(0.70 0.12 45)` | `oklch(0.55 0.10 45)` | Frontmatter keys, secondary markers |

### Document Rhythm

- Body text line-height increases to **1.75** in content areas (from default ~1.5)
- Frontmatter block line-height: **1.8–2.0** for scannable key-value pairs
- More generous vertical spacing between content sections
- Breadcrumb separators change from `›` to `/` (filesystem-like), rendered in mono

### Badge Evolution

Current pill badges (`rounded-full`, secondary bg) become code-style badges:

- `font-family: var(--mono)`
- `border-radius: 4px` (not pill)
- `background: var(--code-bg)`
- `border: 1px solid var(--border)`
- `color: var(--accent-fg)`

### Logo

Sidebar logo evolves to: `✦ tailoredin` with `.md` at reduced opacity, in Geist Mono.

### Sidebar Group Labels

Group labels (`Resume`, `Directory`) gain a `##` prefix in marker-muted color.

---

## Track 2: Experience Editor Prototype

### Inline Editing (Modal Replacement)

The current modal-based editing is replaced with inline editing. The markdown structure stays visible during editing.

**View mode**: All content renders as a styled markdown document. Every section is clickable.

**Edit mode**: Clicking a section (or the edit button) activates inline editing:
- An amber border (`1px solid --edit-border`) wraps the editing area with an `EDITING` label
- Text fields become editable with dashed underlines that solidify on focus
- Active field row gets a subtle amber highlight
- Markdown markers (`#`, `---`, `>`, `-`) remain visible
- Save bar appears at the bottom with dirty count badge + Save/Discard buttons

### Form Controls in Frontmatter

Every non-text control lives inside the frontmatter block as a `key: value` pair. In view mode all values render as plain monospace text (the block reads like YAML). In edit mode each value type reveals its appropriate affordance:

**Select/Dropdown** (`company`, `industry`, `stage`, `status`, `businessType`):
- View: plain text value
- Edit: clicking reveals a `▼` chevron and opens a searchable dropdown
- The dropdown uses `code-bg` styling, monospace font
- Includes search input for long option lists

**Checkbox** (`current role`, `remote`, `featured`):
- View: GFM syntax — `[x] true` or `[ ] false` in monospace
- Edit: real checkbox with amber border/fill, keeps `true`/`false` label
- Single click toggles

**Date Picker** (`startDate`, `endDate`):
- View: ISO format `YYYY-MM` in monospace
- Edit: clicking the date splits into year and month segments
- Clicking a segment opens a compact month-picker grid
- Year navigation with `‹ ›` arrows
- The date string itself is the trigger — no separate calendar icon

**Numeric Range +/-** (`bulletMin`, `bulletMax`):
- View: compact `min–max` string (e.g., `2–5`)
- Edit: `−` / `+` stepper buttons flanking each number, with `to` separator
- Buttons: monospace, amber color, minimal border styling
- Values also directly typeable

### Milkdown Editor Integration

Free-text fields (summary, accomplishment narratives) use **Milkdown** (`@milkdown/kit` v7) for Obsidian-style inline markdown editing:

- Markdown-native: ProseMirror + remark under the hood
- Headless/fully themeable — will use Tailwind classes and CSS variables
- Inline preview: markdown syntax styled as you type (not split-pane)
- Scope: resume descriptions are short — lightweight use, not full documents

### Experience Page Layout (New)

```
# Senior Software Engineer

---
company: Voi Technology
website: voi.com
location: Stockholm, Sweden
start: 2021-01   end: 2023-12
current: [ ] false
bullets: 2–5
---

> Led backend platform team building real-time fleet management
> systems for electric scooter operations across 100+ cities.

———

## Accomplishments  `4`

- Fleet Rebalancing Engine
  Designed and shipped an ML-powered rebalancing system...

- Event Sourcing Migration
  Led migration from REST-based sync to event-sourced architecture...
```

### Accomplishment Editing

- Each accomplishment is a `-` list item with title + indented narrative
- In edit mode: title becomes an editable input, narrative becomes a Milkdown editor
- Active item gets amber background highlight
- `+ add accomplishment` prompt at the bottom follows markdown list convention
- Reordering via drag handle on the `-` bullet (grab cursor on hover)

---

## Companies List (New)

The companies list page is redesigned to follow the same markdown document structure:

### Heading Hierarchy

- `#` Companies (page title) with frontmatter-style meta: `count: N  directory: company`
- `##` Results section header with entry count
- `###` per company card title

### Search

- `/` prefix in monospace replaces magnifying glass icon
- Input uses `code-bg` background, monospace font

### Company Card (New)

Each card contains:
1. Logo + `###` company name + monospace domain below
2. Inline frontmatter metadata: `industry: X · stage: Y · type: Z` on one line in `code-bg` block
3. Description as blockquote with `>` marker

Badges are replaced by the inline `key: value` metadata — more informative, less visual clutter.

### Add Button

`+ new` in monospace — terse, action-oriented.

---

## What Does NOT Change

- Warm amber OKLch color palette (all existing tokens preserved)
- Geist Variable as primary font
- Border-only cards, no shadows
- Sidebar + content layout structure
- Medium weight (500) headings, no bold
- shadcn/ui + Base UI component library
- Click-to-edit interaction pattern (now inline instead of modal)
- TanStack Query data fetching, Eden Treaty API client
- Database schema — no data model changes in this phase

---

## Files to Modify

| File | Changes |
|---|---|
| `web/src/app.css` | New tokens (`--code-bg`, `--marker`, `--marker-muted`), Geist Mono import, document rhythm styles |
| `web/design/design-system.md` | Update spec with markdown design language |
| `web/src/components/ui/badge.tsx` | New `code` variant with mono font and square radius |
| `web/src/components/shared/EditableSection.tsx` | Adapt for inline editing with frontmatter structure |
| `web/src/routes/experiences/$experienceId.tsx` | Rewrite to markdown document layout + inline editing |
| `web/src/components/resume/experience/` | New frontmatter renderer, inline form controls |
| `web/src/components/layout/sidebar.tsx` | Logo update, `##` group label prefixes |
| `web/src/routes/companies/index.tsx` | Markdown heading hierarchy, `/` search |
| `web/src/components/companies/CompanyCard.tsx` | `###` title, inline metadata, blockquote description |
| `web/src/components/companies/CompanyList.tsx` | `##` section header, search prefix |
| `web/package.json` | Add `@milkdown/kit`, `@fontsource-variable/geist-mono` |

## New Files

| File | Purpose |
|---|---|
| `web/src/components/shared/Frontmatter.tsx` | Reusable frontmatter block renderer (view + edit modes) |
| `web/src/components/shared/MarkdownHeading.tsx` | Heading with `#`/`##`/`###` marker prefix |
| `web/src/components/shared/MarkdownDivider.tsx` | `---` styled divider |
| `web/src/components/shared/MarkdownBlockquote.tsx` | `>` blockquote with amber left border |
| `web/src/components/shared/FrontmatterField.tsx` | Per-field-type inline editor (text, select, checkbox, date, range) |
| `web/src/components/shared/MilkdownEditor.tsx` | Milkdown wrapper configured for the design system |

---

## Verification

1. **Visual regression**: Compare each page against the approved mockups in `docs/design-system-md/mockups/`
2. **Inline editing**: Create/edit an experience entirely without modals — verify all field types work
3. **Milkdown**: Type markdown syntax in summary/narrative fields, confirm inline preview renders
4. **Companies list**: Verify heading hierarchy, `/` search, card metadata rendering
5. **Dark mode**: Verify all new tokens have dark mode values and markers remain visible
6. **Accessibility**: WCAG AA contrast for all new marker colors against backgrounds
7. **Quality checks**: `bun run typecheck && bun run check && bun run dep:check && bun run knip && bun run test`
8. **E2E tests**: `bun e2e:test` — verify no regressions in existing flows

## Mockups

All approved visual references are in `docs/design-system-md/mockups/`:
- `01-reinforced-markdown-markers.html` — amber markdown syntax as primary visual identity
- `02-inline-editing.html` — modal-free inline editing with markdown structure preserved
- `03-markdown-form-controls.html` — select, checkbox, date picker, range controls in frontmatter style
- `04-companies-list.html` — companies list page with markdown heading hierarchy
