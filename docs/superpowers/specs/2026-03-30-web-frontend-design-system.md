# TailoredIn Web Frontend — Design System Spec

## Context

TailoredIn is a personal job-search pipeline and resume-tailoring tool. The web frontend (Milestone 3A scaffold complete) needs a cohesive design system before feature work begins. The current `app.css` uses shadcn/ui defaults — neutral grays with no personality. This spec defines the visual identity, color tokens, typography, component patterns, and layout rules that all subsequent milestones will build on.

## Design Direction

**Personality:** Warm & approachable — friendly, slightly playful, inviting. In the space of Notion and Todoist rather than Linear or Vercel. Rounded corners, softer colors, subtle personality touches.

**Why this matters:** This is a personal tool used daily during a job search — a process that's inherently stressful. The UI should feel like a calm, organized workspace, not a corporate dashboard.

## Color System

All colors use OKLch (perceptually uniform). The palette centers on a **Warm Amber / Honey** accent with warm neutral backgrounds.

### Light Mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.975 0.008 80)` | Page background — warm off-white |
| `--foreground` | `oklch(0.22 0.02 80)` | Primary text |
| `--card` | `oklch(1 0.005 80)` | Card surfaces — near-white with warmth |
| `--card-foreground` | `oklch(0.22 0.02 80)` | Card text |
| `--popover` | `oklch(1 0.005 80)` | Popover surfaces |
| `--popover-foreground` | `oklch(0.22 0.02 80)` | Popover text |
| `--primary` | `oklch(0.60 0.16 45)` | Primary amber accent — buttons, active states |
| `--primary-foreground` | `oklch(1 0 0)` | Text on primary |
| `--secondary` | `oklch(0.95 0.015 80)` | Secondary surfaces — warm light gray |
| `--secondary-foreground` | `oklch(0.35 0.02 80)` | Text on secondary |
| `--muted` | `oklch(0.94 0.01 80)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.55 0.015 80)` | Muted text — descriptions, metadata |
| `--accent` | `oklch(0.94 0.03 45)` | Amber tint — highlighted tags, active tab bg |
| `--accent-foreground` | `oklch(0.45 0.10 45)` | Text on accent — amber-toned |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Destructive red (unchanged) |
| `--border` | `oklch(0.93 0.008 80)` | Borders — warm gray |
| `--input` | `oklch(0.93 0.008 80)` | Input borders |
| `--ring` | `oklch(0.65 0.12 45)` | Focus ring — amber |
| `--sidebar` | `oklch(0.22 0.025 50)` | Dark warm sidebar background |
| `--sidebar-foreground` | `oklch(0.62 0.02 50)` | Sidebar inactive text |
| `--sidebar-primary` | `oklch(0.88 0.07 50)` | Sidebar logo / active item text — warm amber |
| `--sidebar-primary-foreground` | `oklch(0.22 0.025 50)` | Inverse for sidebar badges |
| `--sidebar-accent` | `oklch(0.30 0.04 50)` | Sidebar active item background |
| `--sidebar-accent-foreground` | `oklch(0.88 0.06 50)` | Sidebar active item text |
| `--sidebar-border` | `oklch(0.30 0.02 50)` | Sidebar internal dividers |
| `--sidebar-ring` | `oklch(0.50 0.06 50)` | Sidebar focus ring |

### Dark Mode (`.dark`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.16 0.01 80)` | Page background — deep warm gray (not pure black) |
| `--foreground` | `oklch(0.92 0.01 80)` | Primary text |
| `--card` | `oklch(0.20 0.01 80)` | Card surfaces |
| `--card-foreground` | `oklch(0.90 0.01 80)` | Card text |
| `--popover` | `oklch(0.20 0.01 80)` | Popover surfaces |
| `--popover-foreground` | `oklch(0.90 0.01 80)` | Popover text |
| `--primary` | `oklch(0.70 0.12 45)` | Primary amber — slightly brighter for dark bg |
| `--primary-foreground` | `oklch(0.16 0.01 80)` | Text on primary |
| `--secondary` | `oklch(0.24 0.01 80)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.85 0.01 80)` | Text on secondary |
| `--muted` | `oklch(0.24 0.01 80)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.58 0.01 80)` | Muted text |
| `--accent` | `oklch(0.28 0.05 45)` | Amber tint on dark |
| `--accent-foreground` | `oklch(0.75 0.08 45)` | Amber-toned text on dark accent |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Destructive red (unchanged) |
| `--border` | `oklch(0.26 0.008 80)` | Borders |
| `--input` | `oklch(0.28 0.01 80)` | Input borders |
| `--ring` | `oklch(0.70 0.10 45)` | Focus ring — amber |
| `--sidebar` | `oklch(0.19 0.02 50)` | Sidebar — slightly different shade from content |
| `--sidebar-foreground` | `oklch(0.55 0.02 50)` | Sidebar inactive text |
| `--sidebar-primary` | `oklch(0.82 0.08 50)` | Sidebar logo / active text |
| `--sidebar-primary-foreground` | `oklch(0.19 0.02 50)` | Inverse |
| `--sidebar-accent` | `oklch(0.26 0.035 50)` | Sidebar active item bg |
| `--sidebar-accent-foreground` | `oklch(0.82 0.07 50)` | Sidebar active item text |
| `--sidebar-border` | `oklch(0.24 0.015 50)` | Sidebar border / right edge |
| `--sidebar-ring` | `oklch(0.45 0.05 50)` | Sidebar focus ring |

### Chart Colors

Five-step amber-to-neutral scale for data visualization:

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `oklch(0.60 0.16 45)` | `oklch(0.70 0.12 45)` |
| `--chart-2` | `oklch(0.70 0.12 45)` | `oklch(0.60 0.10 45)` |
| `--chart-3` | `oklch(0.55 0.08 60)` | `oklch(0.50 0.06 60)` |
| `--chart-4` | `oklch(0.65 0.04 80)` | `oklch(0.45 0.03 80)` |
| `--chart-5` | `oklch(0.80 0.02 80)` | `oklch(0.35 0.02 80)` |

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

- Border: `--input`, 8px radius
- Focus ring: amber (`--ring`)
- Labels: 13px, 400 weight, `--foreground`
- Helper text: 12px, `--muted-foreground`

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
