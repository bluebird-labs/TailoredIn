# High-Contrast Amber Design System Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the washed-out neutral tokens with a high-contrast amber identity across light mode, dark mode, and sidebar — plus add a reusable FormModal component, expanded Storybook coverage, and UX guideline updates.

**Architecture:** Token-only changes to `app.css` (no component CSS changes needed since everything uses CSS custom properties). New `FormModal` shared component wraps `Dialog` + `ConfirmDialog` for dirty-cancel. Palette system removed from `theme.ts`. Docs updated to reflect the new sharp/vibrant personality.

**Tech Stack:** CSS custom properties (OKLch), React 19, Storybook 10, shadcn/ui Dialog primitives

---

### Task 1: Replace Light Mode Content Tokens

**Files:**
- Modify: `web/src/app.css:51-84` (`:root` block)

- [ ] **Step 1: Replace `:root` token values**

Replace the entire `:root` block in `web/src/app.css` (lines 51-84) with:

```css
:root {
  --background: oklch(0.97 0.012 55);
  --foreground: oklch(0.16 0.03 50);
  --card: oklch(0.995 0.008 55);
  --card-foreground: oklch(0.16 0.03 50);
  --popover: oklch(0.995 0.008 55);
  --popover-foreground: oklch(0.16 0.03 50);
  --primary: oklch(0.58 0.17 45);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.93 0.025 55);
  --secondary-foreground: oklch(0.30 0.04 50);
  --muted: oklch(0.92 0.02 55);
  --muted-foreground: oklch(0.45 0.05 50);
  --accent: oklch(0.90 0.06 45);
  --accent-foreground: oklch(0.36 0.10 45);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.85 0.035 50);
  --input: oklch(0.85 0.035 50);
  --ring: oklch(0.60 0.15 45);
  --chart-1: oklch(0.58 0.17 45);
  --chart-2: oklch(0.68 0.14 45);
  --chart-3: oklch(0.52 0.10 55);
  --chart-4: oklch(0.62 0.06 55);
  --chart-5: oklch(0.78 0.04 55);
  --radius: 0.75rem;
  --sidebar: oklch(0.20 0.035 50);
  --sidebar-foreground: oklch(0.60 0.04 50);
  --sidebar-primary: oklch(0.82 0.12 45);
  --sidebar-primary-foreground: oklch(0.20 0.035 50);
  --sidebar-accent: oklch(0.30 0.06 45);
  --sidebar-accent-foreground: oklch(0.90 0.08 45);
  --sidebar-border: oklch(0.30 0.04 50);
  --sidebar-ring: oklch(0.50 0.08 45);
}
```

- [ ] **Step 2: Verify light mode renders**

Run: `bun run --cwd web dev`

Open `http://localhost:5173` in a browser. Confirm:
- Borders are clearly visible (warm amber tint, not invisible gray)
- Muted text is readable with amber warmth
- Sidebar logo is golden, active item text is bright amber
- Tags/badges are richly tinted amber

---

### Task 2: Replace Dark Mode Tokens

**Files:**
- Modify: `web/src/app.css:86-118` (`.dark` block)

- [ ] **Step 1: Replace `.dark` token values**

Replace the entire `.dark` block in `web/src/app.css` (lines 86-118) with:

```css
.dark {
  --background: oklch(0.15 0.015 50);
  --foreground: oklch(0.93 0.015 55);
  --card: oklch(0.20 0.02 50);
  --card-foreground: oklch(0.93 0.015 55);
  --popover: oklch(0.20 0.02 50);
  --popover-foreground: oklch(0.93 0.015 55);
  --primary: oklch(0.70 0.14 45);
  --primary-foreground: oklch(0.15 0.015 50);
  --secondary: oklch(0.23 0.02 50);
  --secondary-foreground: oklch(0.86 0.02 55);
  --muted: oklch(0.23 0.02 50);
  --muted-foreground: oklch(0.55 0.04 50);
  --accent: oklch(0.30 0.07 45);
  --accent-foreground: oklch(0.78 0.10 45);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(0.30 0.03 50);
  --input: oklch(0.30 0.03 50);
  --ring: oklch(0.70 0.12 45);
  --chart-1: oklch(0.70 0.14 45);
  --chart-2: oklch(0.60 0.12 45);
  --chart-3: oklch(0.50 0.08 55);
  --chart-4: oklch(0.45 0.05 55);
  --chart-5: oklch(0.35 0.04 55);
  --sidebar: oklch(0.17 0.03 50);
  --sidebar-foreground: oklch(0.58 0.04 50);
  --sidebar-primary: oklch(0.80 0.12 45);
  --sidebar-primary-foreground: oklch(0.17 0.03 50);
  --sidebar-accent: oklch(0.26 0.05 45);
  --sidebar-accent-foreground: oklch(0.85 0.09 45);
  --sidebar-border: oklch(0.25 0.03 50);
  --sidebar-ring: oklch(0.48 0.07 45);
}
```

- [ ] **Step 2: Verify dark mode renders**

Toggle dark mode in the app. Confirm:
- Background is deep warm (not gray)
- Borders visible against dark cards
- Tags carry amber identity
- Sidebar text is warmer, logo is golden

---

### Task 3: Remove Palette System

**Files:**
- Modify: `web/src/app.css:120-232` (remove all `.palette-*` blocks)
- Modify: `web/src/lib/theme.ts`

- [ ] **Step 1: Remove palette CSS classes**

Delete everything from line 120 (the `/* ── Teal / Emerald (hue ~170) ── */` comment) through line 232 (end of `.dark.palette-violet` block) in `web/src/app.css`.

- [ ] **Step 2: Simplify theme.ts**

Replace the entire contents of `web/src/lib/theme.ts` with:

```typescript
const THEME_KEY = 'tailoredin-theme';

type Theme = 'light' | 'dark';

// ── Theme (light / dark) ──

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}
```

- [ ] **Step 3: Remove palette references from consumers**

Search for any imports of `applyPalette`, `getStoredPalette`, or `Palette` type from `theme.ts` and remove them:

Run: `cd /Users/sylvainestevez/Documents/Code\ Projects/TailoredIn && grep -rn 'applyPalette\|getStoredPalette\|PALETTE_KEY\|palette-teal\|palette-indigo\|palette-violet' web/src/`

Remove any found references. If a component imports `applyPalette` or `getStoredPalette`, delete those imports and any code that calls them (e.g., palette picker UI).

- [ ] **Step 4: Verify no regressions**

Run: `bun run typecheck && bun run check`

Expected: No type errors, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/app.css web/src/lib/theme.ts
git commit -m "feat: high-contrast amber tokens, remove palette system

Replace all design tokens with high-contrast amber identity.
Boost chroma on borders, muted text, sidebar, tags.
Shift neutral hue from 80 (gray) to 50-55 (warm amber).
Remove teal/indigo/violet palette classes and theme.ts palette logic."
```

---

### Task 4: Create FormModal Component

**Files:**
- Create: `web/src/components/shared/FormModal.tsx`
- Modify: `web/src/components/shared/index.ts`

- [ ] **Step 1: Create FormModal.tsx**

Create `web/src/components/shared/FormModal.tsx`:

```tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface FormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly dirtyCount: number;
  readonly isSaving: boolean;
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
}

function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  dirtyCount,
  isSaving,
  onSave,
  onDiscard
}: FormModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleClose() {
    if (dirtyCount > 0) {
      setConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  }

  function handleConfirmDiscard() {
    setConfirmOpen(false);
    onDiscard();
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={next => {
          if (!next) {
            handleClose();
          }
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto">{children}</div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={dirtyCount === 0 || isSaving}>
              {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'} that will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type { FormModalProps };
export { FormModal };
```

- [ ] **Step 2: Re-export from index.ts**

Add to the end of `web/src/components/shared/index.ts`:

```typescript
export type { FormModalProps } from './FormModal.js';
export { FormModal } from './FormModal.js';
```

- [ ] **Step 3: Verify it compiles**

Run: `bun run typecheck`

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/FormModal.tsx web/src/components/shared/index.ts
git commit -m "feat: add FormModal shared component

Reusable modal wrapper for create/edit forms with high data density.
Handles dialog structure, footer buttons, and dirty-cancel confirmation."
```

---

### Task 5: Add FormModal Stories

**Files:**
- Create: `web/src/components/shared/FormModal.stories.tsx`

- [ ] **Step 1: Create FormModal.stories.tsx**

Create `web/src/components/shared/FormModal.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EditableField } from './EditableField';
import { FormModal } from './FormModal';

const meta = {
  component: FormModal,
  args: {
    open: true,
    onOpenChange: () => {},
    title: 'Add Experience',
    description: 'Add a new work experience to your resume.',
    dirtyCount: 0,
    isSaving: false,
    onSave: () => {},
    onDiscard: () => {}
  }
} satisfies Meta<typeof FormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const formFields = (overrides?: { dirty?: boolean[]; errors?: (string | undefined)[] }) => (
  <>
    <EditableField
      type="text"
      label="Job title"
      value="Senior Frontend Engineer"
      onChange={() => {}}
      isDirty={overrides?.dirty?.[0]}
      error={overrides?.errors?.[0]}
      required
    />
    <EditableField
      type="text"
      label="Company"
      value="Acme Corp"
      onChange={() => {}}
      isDirty={overrides?.dirty?.[1]}
      error={overrides?.errors?.[1]}
      required
    />
    <EditableField
      type="select"
      label="Employment type"
      value="full-time"
      onChange={() => {}}
      options={[
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' }
      ]}
    />
    <EditableField
      type="textarea"
      label="Description"
      value="Led the frontend platform migration from legacy jQuery to React 19..."
      onChange={() => {}}
      isDirty={overrides?.dirty?.[3]}
      error={overrides?.errors?.[3]}
      placeholder="Describe your role and key accomplishments"
    />
  </>
);

export const Default: Story = {
  args: {
    children: formFields()
  }
};

export const WithDirtyFields: Story = {
  args: {
    dirtyCount: 2,
    children: formFields({ dirty: [true, false, false, true] })
  }
};

export const WithValidationErrors: Story = {
  args: {
    dirtyCount: 0,
    children: formFields({
      errors: ['Job title is required', undefined, undefined, 'Description must be at least 20 characters']
    })
  }
};

export const Saving: Story = {
  args: {
    dirtyCount: 3,
    isSaving: true,
    children: formFields({ dirty: [true, true, false, true] })
  }
};
```

- [ ] **Step 2: Verify stories render in Storybook**

Run: `bun run --cwd web storybook`

Open `http://localhost:6006`. Navigate to FormModal stories. Confirm all 4 variants render:
- Default: clean form, Save button disabled
- WithDirtyFields: two fields with left border accent, Save enabled
- WithValidationErrors: error messages below fields
- Saving: spinner on Save button, fields visible

- [ ] **Step 3: Commit**

```bash
git add web/src/components/shared/FormModal.stories.tsx
git commit -m "feat: add FormModal Storybook stories

Four variants: default, dirty fields, validation errors, saving state."
```

---

### Task 6: Add Button Stories

**Files:**
- Create: `web/src/components/ui/button.stories.tsx`

- [ ] **Step 1: Create button.stories.tsx**

Create `web/src/components/ui/button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loader2, Plus, Download } from 'lucide-react';

import { Button } from './button';

const meta = {
  component: Button
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  )
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus data-icon="inline-start" />
        Add experience
      </Button>
      <Button variant="outline">
        <Download data-icon="inline-start" />
        Export
      </Button>
    </div>
  )
};

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <Loader2 className="animate-spin" data-icon="inline-start" />
      Saving...
    </Button>
  )
};
```

- [ ] **Step 2: Verify in Storybook**

Run Storybook (if not running): `bun run --cwd web storybook`

Navigate to Button stories. Confirm all 4 render correctly with the new amber tokens.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ui/button.stories.tsx
git commit -m "feat: add Button Storybook stories

Variants, sizes, with-icon, and loading state."
```

---

### Task 7: Expand EditableField Stories

**Files:**
- Modify: `web/src/components/shared/EditableField.stories.tsx`

- [ ] **Step 1: Add FormGroup story**

Append the following story to the end of `web/src/components/shared/EditableField.stories.tsx` (before the file ends):

```tsx
export const FormGroup: Story = {
  render: () => (
    <div className="max-w-lg space-y-4">
      <EditableField type="text" label="Full name" value="Sylvain Estevez" onChange={() => {}} required />
      <EditableField
        type="text"
        label="Headline"
        value="Full Stack Engineer"
        onChange={() => {}}
        isDirty
      />
      <EditableField
        type="textarea"
        label="Summary"
        value="Passionate engineer with 8 years of experience building scalable web applications..."
        onChange={() => {}}
        placeholder="Write a brief professional summary"
      />
      <EditableField type="text" label="Location" value="Paris, France" onChange={() => {}} />
    </div>
  )
};
```

- [ ] **Step 2: Verify in Storybook**

Navigate to EditableField > FormGroup. Confirm 4 fields render vertically with proper spacing, one dirty field shows left border.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/shared/EditableField.stories.tsx
git commit -m "feat: add EditableField FormGroup story

Shows multiple fields arranged as a realistic form."
```

---

### Task 8: Update UX Guidelines

**Files:**
- Modify: `web/design/ux-guidelines.md`

- [ ] **Step 1: Add Modal Forms section**

Insert the following after the `## 1. Editing & Forms` section's last subsection (after the Validation subsection, before `## 2. Loading, Empty & Error States`). Add it at line 40 (after the validation section ends):

```markdown

### Modal Forms (High Data Density)

Prefer modals over inline editing when creating or editing entities with **3 or more fields**. Modals provide focused context, prevent accidental navigation, and keep the list/parent view visible behind the overlay.

**When to use modals:**
- Creating a new entity (experience, education, company)
- Editing an entity with high field count where inline editing would be disorienting

**When NOT to use modals:**
- Single-field edits (use inline EditableField)
- Profile-level fields that are always visible (use page-level always-editable pattern)

**Modal behavior:**
- Use the `FormModal` shared component
- Footer: Save (primary, disabled until dirty) + Cancel (ghost)
- Cancel with dirty fields triggers `ConfirmDialog`: "You have unsaved changes. Discard?"
- Close (X) and overlay click behave identically to Cancel
- Validation fires on save attempt only — same rules as inline forms
- Content scrolls if form exceeds viewport height (`max-h-[60vh]`)
```

- [ ] **Step 2: Commit**

```bash
git add web/design/ux-guidelines.md
git commit -m "docs: add modal forms UX guidelines

Prefer modals for create/edit with 3+ fields. Document FormModal behavior."
```

---

### Task 9: Update Design System Spec

**Files:**
- Modify: `web/design/design-system.md`

- [ ] **Step 1: Update personality description**

Replace the Design Direction section (lines 7-11) from:

```markdown
**Personality:** Warm & approachable — friendly, slightly playful, inviting. In the space of Notion and Todoist rather than Linear or Vercel. Rounded corners, softer colors, subtle personality touches.

**Why this matters:** This is a personal tool used daily during a job search — a process that's inherently stressful. The UI should feel like a calm, organized workspace, not a corporate dashboard.
```

To:

```markdown
**Personality:** Sharp & vibrant — confident, distinctive amber identity. Crisp like Linear but warm instead of cold. Rounded corners and rich amber tones create a precision tool with personality.

**Why this matters:** This is a personal tool used daily during a job search — a process that's inherently stressful. The UI should feel like a focused, high-quality workspace that you enjoy opening, not a bland corporate dashboard.
```

- [ ] **Step 2: Update all token tables**

Replace the Light Mode token table (lines 17-46) with the new values from Task 1. Replace the Dark Mode token table (lines 50-77) with the new values from Task 2. Replace the Chart Colors table (lines 81-89) with:

```markdown
| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `oklch(0.58 0.17 45)` | `oklch(0.70 0.14 45)` |
| `--chart-2` | `oklch(0.68 0.14 45)` | `oklch(0.60 0.12 45)` |
| `--chart-3` | `oklch(0.52 0.10 55)` | `oklch(0.50 0.08 55)` |
| `--chart-4` | `oklch(0.62 0.06 55)` | `oklch(0.45 0.05 55)` |
| `--chart-5` | `oklch(0.78 0.04 55)` | `oklch(0.35 0.04 55)` |
```

- [ ] **Step 3: Remove palette references**

Delete the paragraph in the Context section that mentions "shadcn/ui defaults" since this is now outdated. Remove any mentions of teal, indigo, or violet palettes if present.

- [ ] **Step 4: Add Modal component pattern**

Add the following section after the existing "Form Inputs" component pattern:

```markdown
### Modal Forms

- Use `FormModal` shared component for create/edit with 3+ fields
- Max width: `sm:max-w-lg` (512px)
- Content area: `max-h-[60vh]` with overflow scroll
- Footer: Save (primary) + Cancel (ghost), same styling as SaveBar
- Dirty-cancel: triggers ConfirmDialog with discard warning
```

- [ ] **Step 5: Commit**

```bash
git add web/design/design-system.md
git commit -m "docs: update design system spec for high-contrast amber

Update personality to sharp & vibrant. Replace all token values.
Remove palette references. Add modal form pattern."
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run full quality checks**

Run: `bun run typecheck && bun run check`

Expected: All pass.

- [ ] **Step 2: Run Storybook build**

Run: `bun run --cwd web storybook:build`

Expected: Build succeeds with no errors.

- [ ] **Step 3: Visual verification**

Run: `bun run --cwd web dev`

Check in browser:
1. Light mode: borders visible, tags amber, metadata warm, sidebar golden
2. Dark mode: same amber identity, borders visible, tags punchy
3. No palette-related UI remains (no palette picker, no palette classes in DOM)

Run: `bun run --cwd web storybook`

Check all stories:
1. FormModal: all 4 variants
2. Button: variants, sizes, with-icon, loading
3. EditableField: FormGroup shows realistic form
4. Existing stories (SaveBar, ConfirmDialog, etc.) still render correctly with new tokens

- [ ] **Step 4: Commit any remaining changes and final commit**

```bash
git status
# If any unstaged files remain, add and commit
git add -A
git commit -m "chore: final verification pass"
```
