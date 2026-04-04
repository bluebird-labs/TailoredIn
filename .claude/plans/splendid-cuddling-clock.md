# Plan: Add Distinct Input Field Backgrounds

## Context

Input fields currently use `bg-transparent` in light mode, making them visually merge with the page background (`--background`). The design system spec doesn't prescribe an input background. The user wants fields to feel distinct from the page — we'll use `bg-card` as the input surface, since `--card` is already the established "elevated surface" token.

**Color contrast:**
- Light: `--card` `oklch(0.995)` vs `--background` `oklch(0.97)` — subtle warm lift
- Dark: `--card` `oklch(0.20)` vs `--background` `oklch(0.15)` — visible surface distinction

## Changes

### 1. Update design spec — `web/design/design-system.md`

In the **Form Inputs** section, add background prescription:

```
### Form Inputs
- Background: `--card` (elevated surface, distinct from page)
- Border: `--input`, 8px radius
- ...
```

### 2. Update components (4 files)

All changes replace `bg-transparent` → `bg-card` and `dark:bg-input/30` → `dark:bg-card`:

| File | What changes |
|---|---|
| `web/src/components/ui/input.tsx:12` | `bg-transparent` → `bg-card`, `dark:bg-input/30` → `dark:bg-card`, `disabled:bg-input/50` → `disabled:bg-muted`, `dark:disabled:bg-input/80` → `dark:disabled:bg-muted` |
| `web/src/components/ui/textarea.tsx:10` | Same pattern |
| `web/src/components/ui/select.tsx:31` | `bg-transparent` → `bg-card`, `dark:bg-input/30` → `dark:bg-card`, `dark:hover:bg-input/50` → `dark:hover:bg-muted` |
| `web/src/components/ui/button.tsx:15` | outline variant: `bg-background` → `bg-card`, `dark:bg-input/30` → `dark:bg-card`, `dark:hover:bg-input/50` → `dark:hover:bg-muted` |

**Not changed:** `command.tsx` CommandInput — sits inside a popover (`bg-popover`), so `bg-transparent` is correct there.

### 3. Verify

- `bun run typecheck` — no type errors
- `bun run check` — Biome lint/format passes
- Visual check: start `bun run web:dev` and confirm fields are visually distinct from page in both light and dark mode
