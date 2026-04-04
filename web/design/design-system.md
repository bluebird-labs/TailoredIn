# TailoredIn Web Frontend — Design System Spec

## Context

TailoredIn is a personal job-search pipeline and resume-tailoring tool. The web frontend (Milestone 3A scaffold complete) needs a cohesive design system before feature work begins. The current `app.css` uses shadcn/ui defaults — neutral grays with no personality. This spec defines the visual identity, color tokens, typography, component patterns, and layout rules that all subsequent milestones will build on.

## Design Direction

**Personality:** Sharp & vibrant — confident, distinctive amber identity. Crisp like Linear but warm instead of cold. Rounded corners and rich amber tones create a precision tool with personality.

**Why this matters:** This is a personal tool used daily during a job search — a process that's inherently stressful. The UI should feel like a focused, high-quality workspace that you enjoy opening, not a bland corporate dashboard.

## Color System

All colors use OKLch (perceptually uniform). The palette centers on a **Warm Amber / Honey** accent with warm neutral backgrounds.

### Light Mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.97 0.012 55)` | Page background — warm amber-tinted |
| `--foreground` | `oklch(0.16 0.03 50)` | Primary text — dark warm |
| `--card` | `oklch(0.995 0.008 55)` | Card surfaces |
| `--card-foreground` | `oklch(0.16 0.03 50)` | Card text |
| `--popover` | `oklch(0.995 0.008 55)` | Popover surfaces |
| `--popover-foreground` | `oklch(0.16 0.03 50)` | Popover text |
| `--primary` | `oklch(0.58 0.17 45)` | Primary amber accent |
| `--primary-foreground` | `oklch(1 0 0)` | Text on primary |
| `--secondary` | `oklch(0.93 0.025 55)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.30 0.04 50)` | Text on secondary |
| `--muted` | `oklch(0.92 0.02 55)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.45 0.05 50)` | Muted text |
| `--accent` | `oklch(0.90 0.06 45)` | Amber tint |
| `--accent-foreground` | `oklch(0.36 0.10 45)` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Destructive red (unchanged) |
| `--border` | `oklch(0.85 0.035 50)` | Borders — visible, warm |
| `--input` | `oklch(0.85 0.035 50)` | Input borders |
| `--ring` | `oklch(0.60 0.15 45)` | Focus ring |
| `--sidebar` | `oklch(0.20 0.035 50)` | Dark warm sidebar |
| `--sidebar-foreground` | `oklch(0.60 0.04 50)` | Sidebar inactive text |
| `--sidebar-primary` | `oklch(0.82 0.12 45)` | Sidebar logo / active — golden |
| `--sidebar-primary-foreground` | `oklch(0.20 0.035 50)` | Inverse |
| `--sidebar-accent` | `oklch(0.30 0.06 45)` | Sidebar active item bg |
| `--sidebar-accent-foreground` | `oklch(0.90 0.08 45)` | Sidebar active item text |
| `--sidebar-border` | `oklch(0.30 0.04 50)` | Sidebar dividers |
| `--sidebar-ring` | `oklch(0.50 0.08 45)` | Sidebar focus ring |

### Dark Mode (`.dark`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.15 0.015 50)` | Deep warm gray |
| `--foreground` | `oklch(0.93 0.015 55)` | Primary text |
| `--card` | `oklch(0.20 0.02 50)` | Card surfaces |
| `--card-foreground` | `oklch(0.93 0.015 55)` | Card text |
| `--popover` | `oklch(0.20 0.02 50)` | Popover surfaces |
| `--popover-foreground` | `oklch(0.93 0.015 55)` | Popover text |
| `--primary` | `oklch(0.70 0.14 45)` | Primary amber — brighter |
| `--primary-foreground` | `oklch(0.15 0.015 50)` | Text on primary |
| `--secondary` | `oklch(0.23 0.02 50)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.86 0.02 55)` | Text on secondary |
| `--muted` | `oklch(0.23 0.02 50)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.55 0.04 50)` | Muted text |
| `--accent` | `oklch(0.30 0.07 45)` | Amber tint on dark |
| `--accent-foreground` | `oklch(0.78 0.10 45)` | Amber text on dark accent |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Destructive red (unchanged) |
| `--border` | `oklch(0.30 0.03 50)` | Borders |
| `--input` | `oklch(0.30 0.03 50)` | Input borders |
| `--ring` | `oklch(0.70 0.12 45)` | Focus ring |
| `--sidebar` | `oklch(0.17 0.03 50)` | Sidebar |
| `--sidebar-foreground` | `oklch(0.58 0.04 50)` | Sidebar inactive text |
| `--sidebar-primary` | `oklch(0.80 0.12 45)` | Sidebar active text |
| `--sidebar-primary-foreground` | `oklch(0.17 0.03 50)` | Inverse |
| `--sidebar-accent` | `oklch(0.26 0.05 45)` | Sidebar active bg |
| `--sidebar-accent-foreground` | `oklch(0.85 0.09 45)` | Sidebar active text |
| `--sidebar-border` | `oklch(0.25 0.03 50)` | Sidebar border |
| `--sidebar-ring` | `oklch(0.48 0.07 45)` | Sidebar focus ring |

### Chart Colors

Five-step amber-to-neutral scale for data visualization:

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `oklch(0.58 0.17 45)` | `oklch(0.70 0.14 45)` |
| `--chart-2` | `oklch(0.68 0.14 45)` | `oklch(0.60 0.12 45)` |
| `--chart-3` | `oklch(0.52 0.10 55)` | `oklch(0.50 0.08 55)` |
| `--chart-4` | `oklch(0.62 0.06 55)` | `oklch(0.45 0.05 55)` |
| `--chart-5` | `oklch(0.78 0.04 55)` | `oklch(0.35 0.04 55)` |

## Typography

**Font:** Geist Variable (already installed via `@fontsource-variable/geist`)

**Weight scale — light & airy:**

| Element | Weight | Size | Letter-spacing |
|---|---|---|---|
| Page headings (h1) | 500 (medium) | 22px / 1.375rem | -0.01em |
| Section headings (h2) | 500 (medium) | 18px / 1.125rem | -0.005em |
| Card titles (h3) | 500 (medium) | 15px / 0.9375rem | -0.01em |
| Body text | 400 (regular) | 14px / 0.875rem | 0.01em |
| Small / metadata | 400 (regular) | 13px / 0.8125rem | 0.01em |
| Labels / category headers | 400 (regular) | 11px / 0.6875rem | 0.06em (uppercase) |
| Tiny / timestamps | 400 (regular) | 11px / 0.6875rem | 0.01em |

**No bold (700) anywhere in the default UI.** The heaviest weight used is medium (500) for headings. This creates the airy, elegant feel.

## Layout

### Sidebar (Dark Warm Contrast)

- Width: 230px (collapsible on mobile)
- Background: dark warm tone (`--sidebar`)
- Three navigation groups: Discovery, Resume, Templates
- Group labels: 10px uppercase, wide letterspacing, muted color
- Nav items: 13px, 8px vertical padding, 8px border-radius
- Active item: lighter background (`--sidebar-accent`), amber text (`--sidebar-accent-foreground`)
- Inactive items: muted gray text (`--sidebar-foreground`)
- Logo/brand: "✦ TailoredIn" in `--sidebar-primary` (amber)
- Bottom: theme toggle (light/dark mode switch)

### Content Area

- Background: warm off-white (`--background`)
- Max content width: not constrained (sidebar + content fills viewport)
- Padding: 32px vertical, 36px horizontal
- Page header: title (h1) + subtitle (muted-foreground, 13px)
- Top-right: action buttons (Filter, Sort) — outlined style, 8px radius

### Cards (Job Cards, Profile Cards, etc.)

- Background: `--card`
- Border: 1px solid `--border`
- Border-radius: 14px (override shadcn default of `--radius-lg`)
- Padding: 20px 22px
- Spacing between cards: 12px gap
- No drop shadows — borders only

### Status Tabs

- Horizontal tab row below page header
- Active tab: amber text (`--accent-foreground`), 2px amber bottom border
- Inactive tabs: muted text, no border
- Font: 12px, 500 weight for active, 400 for inactive

## Component Patterns

### Score Badge

- Small pill: `padding: 4px 10px`, `border-radius: 20px`, 11px font, 500 weight
- High-score variant (≥75): amber tint background (`--accent`), amber text (`--accent-foreground`)
- Standard variant (<75): neutral muted background, muted text
- Position: top-right of card, secondary to title

### Skill Tags

- Pill-shaped: `padding: 3px 10px`, `border-radius: 20px`, 11px font, 400 weight
- Matching skill (user has this skill): amber-tinted background + text
- Non-matching skill: neutral gray background + text
- Wrapped in flex row with 6px gap

### Buttons

- Primary: amber background (`--primary`), white text, 8px radius
- Secondary/outline: white background, border, muted text, 8px radius
- Ghost: no background, no border, muted text
- All buttons: 400 weight, 13px font

### Form Inputs

- Background: `--card` (elevated surface, visually distinct from page `--background`)
- Disabled background: `--muted`
- Border: `--input`, 8px radius
- Focus ring: amber (`--ring`)
- Labels: 13px, 400 weight, `--foreground`
- Helper text: 12px, `--muted-foreground`

### Modal Forms

- Use `FormModal` shared component for create/edit with 3+ fields
- Max width: `sm:max-w-lg` (512px)
- Content area: `max-h-[60vh]` with overflow scroll
- Footer: Save (primary) + Cancel (ghost), same styling as SaveBar
- Dirty-cancel: triggers ConfirmDialog with discard warning

### Dark Mode Toggle

- Located at bottom of sidebar
- Icon-based: sun/moon from lucide-react
- Toggles `.dark` class on `<html>` element
- Preference persisted to `localStorage`

## Radius Scale

Slightly larger than shadcn default to support the warm, rounded feel:

```
--radius: 0.75rem  (was 0.625rem)
```

This makes `--radius-lg` = 0.75rem (12px), which with the card override of 14px keeps things soft.

## Accessibility

- All color pairings must meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text)
- The existing `ColorUtil` in `core/` provides `meetsWCAGNormalTextContrastRatio()` — use it for any dynamic color applications (e.g., company brand colors on resumes)
- Focus rings use amber (`--ring`) with `/50` opacity outline
- Sidebar active states have sufficient contrast against the dark background

## Files to Modify

| File | Change |
|---|---|
| `web/src/app.css` | Replace `:root` and `.dark` token values with the warm amber palette above |
| `web/src/components/layout/sidebar.tsx` | Add theme toggle at sidebar bottom, update nav structure if needed |

## Verification

1. Start the dev server (`bun run --cwd web dev`) and visually confirm light mode matches the mockup
2. Toggle dark mode and confirm the dark variant
3. Verify all shadcn/ui components (button, card, input, dialog, table) inherit the new tokens correctly
4. Check sidebar active/inactive states
5. Spot-check WCAG contrast on key pairings (foreground on background, accent-foreground on accent, sidebar text on sidebar)
