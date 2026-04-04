# High-Contrast Amber Design System Overhaul

## Context

The current design tokens produce a UI that reads as "shadcn defaults with a slight amber tint." Borders are nearly invisible (0.008 chroma, 4.5% lightness gap), muted text is desaturated gray, tags are colorless blobs, and the sidebar feels washed out. The palette system has been removed. The personality is shifting from "Notion/Todoist warm-cozy" to **sharp, vibrant, and confident** — like Linear's crispness but with amber identity.

This spec covers:
1. Full token overhaul (light + dark + sidebar) for high-contrast amber identity
2. New reusable `FormModal` shared component
3. Expanded Storybook coverage (FormModal, Button variants, EditableField group)
4. UX guidelines update: prefer modals for high-data-density create/edit

---

## 1. Token Overhaul

### Design Principles

- **Chroma everywhere**: Neutrals shift from `0.008-0.02` to `0.02-0.05`. The app should feel amber even in "quiet" areas.
- **Hue alignment**: Shift neutral hue from `80` (yellow-gray) to `50-55` (warm amber) so the entire surface family is coherent with the primary.
- **Visible structure**: Borders must be clearly perceptible — minimum ~12% lightness gap from their background.
- **Sharp, not soft**: Stronger lightness separation between text and background. Foreground text gets darker, muted text gets more saturated.

### Light Mode (`:root`)

```
Token                       Current                          Proposed
──────────────────────────  ───────────────────────────────  ──────────────────────────────
--background                oklch(0.975 0.008 80)            oklch(0.97 0.012 55)
--foreground                oklch(0.22 0.02 80)              oklch(0.16 0.03 50)
--card                      oklch(1 0.005 80)                oklch(0.995 0.008 55)
--card-foreground           oklch(0.22 0.02 80)              oklch(0.16 0.03 50)
--popover                   oklch(1 0.005 80)                oklch(0.995 0.008 55)
--popover-foreground        oklch(0.22 0.02 80)              oklch(0.16 0.03 50)
--primary                   oklch(0.60 0.16 45)              oklch(0.58 0.17 45)        ← slightly darker, more saturated
--primary-foreground        oklch(1 0 0)                     oklch(1 0 0)               ← unchanged
--secondary                 oklch(0.95 0.015 80)             oklch(0.93 0.025 55)
--secondary-foreground      oklch(0.35 0.02 80)              oklch(0.30 0.04 50)
--muted                     oklch(0.94 0.01 80)              oklch(0.92 0.02 55)
--muted-foreground          oklch(0.55 0.015 80)             oklch(0.45 0.05 50)
--accent                    oklch(0.94 0.03 45)              oklch(0.90 0.06 45)
--accent-foreground         oklch(0.45 0.10 45)              oklch(0.36 0.10 45)
--destructive               oklch(0.577 0.245 27.325)        oklch(0.577 0.245 27.325)  ← unchanged
--border                    oklch(0.93 0.008 80)             oklch(0.85 0.035 50)
--input                     oklch(0.93 0.008 80)             oklch(0.85 0.035 50)
--ring                      oklch(0.65 0.12 45)              oklch(0.60 0.15 45)
--chart-1                   oklch(0.60 0.16 45)              oklch(0.58 0.17 45)
--chart-2                   oklch(0.70 0.12 45)              oklch(0.68 0.14 45)
--chart-3                   oklch(0.55 0.08 60)              oklch(0.52 0.10 55)
--chart-4                   oklch(0.65 0.04 80)              oklch(0.62 0.06 55)
--chart-5                   oklch(0.80 0.02 80)              oklch(0.78 0.04 55)
```

### Light Mode — Sidebar

```
Token                           Current                      Proposed
──────────────────────────────  ───────────────────────────  ──────────────────────────────
--sidebar                       oklch(0.22 0.025 50)         oklch(0.20 0.035 50)
--sidebar-foreground            oklch(0.62 0.02 50)          oklch(0.60 0.04 50)
--sidebar-primary               oklch(0.88 0.07 50)          oklch(0.82 0.12 45)
--sidebar-primary-foreground    oklch(0.22 0.025 50)         oklch(0.20 0.035 50)
--sidebar-accent                oklch(0.30 0.04 50)          oklch(0.30 0.06 45)
--sidebar-accent-foreground     oklch(0.88 0.06 50)          oklch(0.90 0.08 45)
--sidebar-border                oklch(0.30 0.02 50)          oklch(0.30 0.04 50)
--sidebar-ring                  oklch(0.50 0.06 50)          oklch(0.50 0.08 45)
```

### Dark Mode (`.dark`)

```
Token                       Current                          Proposed
──────────────────────────  ───────────────────────────────  ──────────────────────────────
--background                oklch(0.16 0.01 80)              oklch(0.15 0.015 50)
--foreground                oklch(0.92 0.01 80)              oklch(0.93 0.015 55)
--card                      oklch(0.20 0.01 80)              oklch(0.20 0.02 50)
--card-foreground           oklch(0.90 0.01 80)              oklch(0.93 0.015 55)
--popover                   oklch(0.20 0.01 80)              oklch(0.20 0.02 50)
--popover-foreground        oklch(0.90 0.01 80)              oklch(0.93 0.015 55)
--primary                   oklch(0.70 0.12 45)              oklch(0.70 0.14 45)
--primary-foreground        oklch(0.16 0.01 80)              oklch(0.15 0.015 50)
--secondary                 oklch(0.24 0.01 80)              oklch(0.23 0.02 50)
--secondary-foreground      oklch(0.85 0.01 80)              oklch(0.86 0.02 55)
--muted                     oklch(0.24 0.01 80)              oklch(0.23 0.02 50)
--muted-foreground          oklch(0.58 0.01 80)              oklch(0.55 0.04 50)
--accent                    oklch(0.28 0.05 45)              oklch(0.30 0.07 45)
--accent-foreground         oklch(0.75 0.08 45)              oklch(0.78 0.10 45)
--destructive               oklch(0.704 0.191 22.216)        oklch(0.704 0.191 22.216)  ← unchanged
--border                    oklch(0.26 0.008 80)             oklch(0.30 0.03 50)
--input                     oklch(0.28 0.01 80)              oklch(0.30 0.03 50)
--ring                      oklch(0.70 0.10 45)              oklch(0.70 0.12 45)
--chart-1                   oklch(0.70 0.12 45)              oklch(0.70 0.14 45)
--chart-2                   oklch(0.60 0.10 45)              oklch(0.60 0.12 45)
--chart-3                   oklch(0.50 0.06 60)              oklch(0.50 0.08 55)
--chart-4                   oklch(0.45 0.03 80)              oklch(0.45 0.05 55)
--chart-5                   oklch(0.35 0.02 80)              oklch(0.35 0.04 55)
```

### Dark Mode — Sidebar

```
Token                           Current                      Proposed
──────────────────────────────  ───────────────────────────  ──────────────────────────────
--sidebar                       oklch(0.19 0.02 50)          oklch(0.17 0.03 50)
--sidebar-foreground            oklch(0.55 0.02 50)          oklch(0.58 0.04 50)
--sidebar-primary               oklch(0.82 0.08 50)          oklch(0.80 0.12 45)
--sidebar-primary-foreground    oklch(0.19 0.02 50)          oklch(0.17 0.03 50)
--sidebar-accent                oklch(0.26 0.035 50)         oklch(0.26 0.05 45)
--sidebar-accent-foreground     oklch(0.82 0.07 50)          oklch(0.85 0.09 45)
--sidebar-border                oklch(0.24 0.015 50)         oklch(0.25 0.03 50)
--sidebar-ring                  oklch(0.45 0.05 50)          oklch(0.48 0.07 45)
```

### Palette Classes

Remove all `.palette-teal`, `.dark.palette-teal`, `.palette-indigo`, `.dark.palette-indigo`, `.palette-violet`, `.dark.palette-violet` blocks. Remove the corresponding palette switching logic from `web/src/lib/theme.ts`.

---

## 2. FormModal Shared Component

### Purpose

Reusable modal wrapper for create/edit forms with high data density (3+ fields). Handles dialog structure, footer buttons, and dirty-cancel confirmation.

### API

```typescript
interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;           // form fields (EditableField instances)
  dirtyCount: number;                  // number of dirty fields
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}
```

### Behavior

- Renders `Dialog` with `DialogHeader` (title + description) and `DialogFooter` (Save + Cancel buttons)
- Save button: primary variant, disabled when `dirtyCount === 0` or `isSaving`, shows spinner when saving
- Cancel button: ghost variant, triggers `ConfirmDialog` if `dirtyCount > 0`, otherwise closes directly
- Close (X) button and overlay click behave identically to Cancel
- Content area scrolls if form exceeds viewport height
- Max width: `sm:max-w-lg` (512px) to accommodate multi-field forms

### File

`web/src/components/shared/FormModal.tsx` + `web/src/components/shared/FormModal.stories.tsx`

Re-export from `web/src/components/shared/index.ts`.

---

## 3. Storybook Additions

### New: FormModal.stories.tsx

| Story | Description |
|---|---|
| `Default` | Modal with 4 EditableFields (name, title, company, description textarea), no dirty state |
| `WithDirtyFields` | 2 fields marked dirty (left border accent), Save button enabled |
| `WithValidationErrors` | Save attempted, 2 fields show inline errors |
| `Saving` | Save button shows spinner + "Saving...", fields disabled |

### New: Button.stories.tsx

Add to `web/src/components/ui/button.stories.tsx` (first UI-level story):

| Story | Description |
|---|---|
| `Variants` | All button variants side by side: primary, outline, secondary, ghost, destructive, link |
| `Sizes` | All sizes: xs, sm, default, lg |
| `WithIcon` | Button with leading Lucide icon |
| `Loading` | Button with spinner (disabled state) |

### Expand: EditableField.stories.tsx

| Story | Description |
|---|---|
| `FormGroup` (new) | 4 fields arranged vertically as they'd appear in a real form — name, headline, summary (textarea), location |

---

## 4. UX Guidelines Update

Add to `web/design/ux-guidelines.md` after the "Always-Editable Fields" section:

### Modal Forms (High Data Density)

> Prefer modals over inline editing when creating or editing entities with **3 or more fields**. Modals provide focused context, prevent accidental navigation, and keep the list/parent view visible behind the overlay.
>
> **When to use modals:**
> - Creating a new entity (experience, education, company)
> - Editing an entity with high field count where inline editing would be disorienting
>
> **When NOT to use modals:**
> - Single-field edits (use inline EditableField)
> - Profile-level fields that are always visible (use page-level always-editable pattern)
>
> **Modal behavior:**
> - Use the `FormModal` shared component
> - Footer: Save (primary, disabled until dirty) + Cancel (ghost)
> - Cancel with dirty fields triggers `ConfirmDialog`: "You have unsaved changes. Discard?"
> - Close (X) and overlay click = Cancel
> - Validation fires on save attempt only
> - Content scrolls if form exceeds viewport

---

## 5. Design System Spec Update

Update `web/design/design-system.md`:

- **Personality**: Replace "Warm & approachable — friendly, slightly playful, inviting. In the space of Notion and Todoist rather than Linear" with "Sharp & vibrant — confident, distinctive amber identity. Crisp like Linear but warm instead of cold. The UI should feel like a precision tool with personality."
- **Token tables**: Replace all values with the proposed tokens above
- **Remove**: All references to palette system (teal, indigo, violet)
- **Add**: Modal component pattern section documenting FormModal usage

---

## Files Modified

| File | Change |
|---|---|
| `web/src/app.css` | Replace all token values, remove palette classes |
| `web/src/lib/theme.ts` | Remove palette switching logic (applyPalette, palette localStorage) |
| `web/design/design-system.md` | Update personality, tokens, remove palettes, add modal pattern |
| `web/design/ux-guidelines.md` | Add "Modal Forms (High Data Density)" section |
| `web/src/components/shared/FormModal.tsx` | New reusable component |
| `web/src/components/shared/FormModal.stories.tsx` | New stories |
| `web/src/components/shared/index.ts` | Re-export FormModal |
| `web/src/components/shared/EditableField.stories.tsx` | Add FormGroup story |
| `web/src/components/ui/button.stories.tsx` | New — button variant/size stories |

---

## Verification

1. `bun run --cwd web dev` — visually confirm light mode: borders visible, tags richly amber, metadata warm
2. Toggle dark mode — confirm same amber identity carries through
3. `bun run --cwd web storybook` — verify all new stories render correctly
4. Check WCAG contrast on key pairings:
   - foreground on background: `oklch(0.16)` on `oklch(0.97)` — ~0.81 lightness gap (excellent)
   - muted-foreground on card: `oklch(0.45)` on `oklch(0.995)` — ~0.545 gap (good)
   - border on background: `oklch(0.85)` on `oklch(0.97)` — ~0.12 gap (visible)
   - accent-foreground on accent: `oklch(0.36)` on `oklch(0.90)` — ~0.54 gap (good)
   - sidebar-foreground on sidebar: `oklch(0.60)` on `oklch(0.20)` — ~0.40 gap (good)
5. `bun run typecheck && bun run check` — no regressions
6. Confirm palette classes and theme.ts palette logic are fully removed
