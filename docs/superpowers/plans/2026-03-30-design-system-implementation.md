# Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the warm amber design system (color tokens, typography, radius, dark mode toggle) to the existing web scaffold.

**Architecture:** Replace the neutral shadcn/ui CSS custom properties in `web/src/app.css` with the warm amber OKLch palette from the design spec. Add a `ThemeToggle` component in the sidebar footer. All work is in `web/` — no backend changes.

**Tech Stack:** Tailwind CSS 4 (`@theme inline`), OKLch colors, React 19, lucide-react icons, shadcn/ui `SidebarFooter`

**Spec:** `docs/superpowers/specs/2026-03-30-web-frontend-design-system.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `web/src/app.css` | Modify | Replace `:root` and `.dark` token values, update `--radius` |
| `web/src/lib/theme.ts` | Create | Theme state management: read/write `localStorage`, toggle `.dark` class |
| `web/src/components/layout/theme-toggle.tsx` | Create | `ThemeToggle` button component (sun/moon icon) |
| `web/src/components/layout/sidebar.tsx` | Modify | Import `SidebarFooter`, add `ThemeToggle` at bottom |
| `web/src/routes/__root.tsx` | Modify | Initialize theme from `localStorage` on mount |

---

### Task 1: Replace CSS color tokens (light mode)

**Files:**
- Modify: `web/src/app.css:51-84` (`:root` block)

- [ ] **Step 1: Replace the `:root` block**

Replace the entire `:root { ... }` block (lines 51–84) with:

```css
:root {
  --background: oklch(0.975 0.008 80);
  --foreground: oklch(0.22 0.02 80);
  --card: oklch(1 0.005 80);
  --card-foreground: oklch(0.22 0.02 80);
  --popover: oklch(1 0.005 80);
  --popover-foreground: oklch(0.22 0.02 80);
  --primary: oklch(0.60 0.16 45);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.015 80);
  --secondary-foreground: oklch(0.35 0.02 80);
  --muted: oklch(0.94 0.01 80);
  --muted-foreground: oklch(0.55 0.015 80);
  --accent: oklch(0.94 0.03 45);
  --accent-foreground: oklch(0.45 0.10 45);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.93 0.008 80);
  --input: oklch(0.93 0.008 80);
  --ring: oklch(0.65 0.12 45);
  --chart-1: oklch(0.60 0.16 45);
  --chart-2: oklch(0.70 0.12 45);
  --chart-3: oklch(0.55 0.08 60);
  --chart-4: oklch(0.65 0.04 80);
  --chart-5: oklch(0.80 0.02 80);
  --radius: 0.75rem;
  --sidebar: oklch(0.22 0.025 50);
  --sidebar-foreground: oklch(0.62 0.02 50);
  --sidebar-primary: oklch(0.88 0.07 50);
  --sidebar-primary-foreground: oklch(0.22 0.025 50);
  --sidebar-accent: oklch(0.30 0.04 50);
  --sidebar-accent-foreground: oklch(0.88 0.06 50);
  --sidebar-border: oklch(0.30 0.02 50);
  --sidebar-ring: oklch(0.50 0.06 50);
}
```

- [ ] **Step 2: Verify the dev server renders warm colors**

Run: `cd web && bun run dev`

Open `http://localhost:5173` in a browser. Confirm:
- Page background is warm off-white (not pure white)
- Sidebar is dark warm brown with amber-tinted logo/active item
- Borders have a warm hue

- [ ] **Step 3: Commit**

```bash
git add web/src/app.css
git commit -m "style: apply warm amber light mode tokens"
```

---

### Task 2: Replace CSS color tokens (dark mode)

**Files:**
- Modify: `web/src/app.css:86-118` (`.dark` block)

- [ ] **Step 1: Replace the `.dark` block**

Replace the entire `.dark { ... }` block (lines 86–118) with:

```css
.dark {
  --background: oklch(0.16 0.01 80);
  --foreground: oklch(0.92 0.01 80);
  --card: oklch(0.20 0.01 80);
  --card-foreground: oklch(0.90 0.01 80);
  --popover: oklch(0.20 0.01 80);
  --popover-foreground: oklch(0.90 0.01 80);
  --primary: oklch(0.70 0.12 45);
  --primary-foreground: oklch(0.16 0.01 80);
  --secondary: oklch(0.24 0.01 80);
  --secondary-foreground: oklch(0.85 0.01 80);
  --muted: oklch(0.24 0.01 80);
  --muted-foreground: oklch(0.58 0.01 80);
  --accent: oklch(0.28 0.05 45);
  --accent-foreground: oklch(0.75 0.08 45);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(0.26 0.008 80);
  --input: oklch(0.28 0.01 80);
  --ring: oklch(0.70 0.10 45);
  --chart-1: oklch(0.70 0.12 45);
  --chart-2: oklch(0.60 0.10 45);
  --chart-3: oklch(0.50 0.06 60);
  --chart-4: oklch(0.45 0.03 80);
  --chart-5: oklch(0.35 0.02 80);
  --sidebar: oklch(0.19 0.02 50);
  --sidebar-foreground: oklch(0.55 0.02 50);
  --sidebar-primary: oklch(0.82 0.08 50);
  --sidebar-primary-foreground: oklch(0.19 0.02 50);
  --sidebar-accent: oklch(0.26 0.035 50);
  --sidebar-accent-foreground: oklch(0.82 0.07 50);
  --sidebar-border: oklch(0.24 0.015 50);
  --sidebar-ring: oklch(0.45 0.05 50);
}
```

- [ ] **Step 2: Verify dark mode manually**

Open browser devtools, add class `dark` to `<html>` element. Confirm:
- Background becomes deep warm gray (not pure black)
- Cards are a lighter surface than background
- Sidebar adjusts slightly but stays dark
- Amber accents brighten for readability

- [ ] **Step 3: Commit**

```bash
git add web/src/app.css
git commit -m "style: apply warm amber dark mode tokens"
```

---

### Task 3: Create theme state manager

**Files:**
- Create: `web/src/lib/theme.ts`

- [ ] **Step 1: Create `web/src/lib/theme.ts`**

```typescript
const STORAGE_KEY = 'tailoredin-theme';

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/theme.ts
git commit -m "feat: add theme state manager (localStorage + system preference)"
```

---

### Task 4: Initialize theme on app mount

**Files:**
- Modify: `web/src/routes/__root.tsx`

- [ ] **Step 1: Add theme initialization to `RootLayout`**

Add the import at the top of the file:

```typescript
import { useEffect } from 'react';
import { applyTheme, getEffectiveTheme } from '@/lib/theme.js';
```

Add a `useEffect` inside `RootLayout`, before the return statement:

```typescript
useEffect(() => {
  applyTheme(getEffectiveTheme());
}, []);
```

The full `RootLayout` function becomes:

```typescript
function RootLayout() {
  useEffect(() => {
    applyTheme(getEffectiveTheme());
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Verify theme initializes from system preference**

Run the dev server. In browser devtools, check that:
- If system is light mode: `<html>` has no `dark` class
- If system is dark mode: `<html>` has `dark` class

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/__root.tsx
git commit -m "feat: initialize theme from localStorage/system preference on mount"
```

---

### Task 5: Create ThemeToggle component

**Files:**
- Create: `web/src/components/layout/theme-toggle.tsx`

- [ ] **Step 1: Create `web/src/components/layout/theme-toggle.tsx`**

```tsx
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { SidebarMenuButton } from '@/components/ui/sidebar.js';
import { toggleTheme, type Theme } from '@/lib/theme.js';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  function handleToggle() {
    const next = toggleTheme();
    setTheme(next);
  }

  return (
    <SidebarMenuButton onClick={handleToggle}>
      {theme === 'dark' ? <Moon /> : <Sun />}
      <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
    </SidebarMenuButton>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/layout/theme-toggle.tsx
git commit -m "feat: add ThemeToggle sidebar button component"
```

---

### Task 6: Add ThemeToggle to sidebar footer

**Files:**
- Modify: `web/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Update sidebar imports**

Add to the imports from `@/components/ui/sidebar`:

```typescript
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
```

Add the ThemeToggle import:

```typescript
import { ThemeToggle } from '@/components/layout/theme-toggle.js';
```

- [ ] **Step 2: Add SidebarFooter with ThemeToggle to AppSidebar**

Update the `AppSidebar` function to include a footer:

```tsx
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Sparkles className="h-5 w-5" />
          <span className="text-lg font-semibold">TailoredIn</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Discovery" items={jobsNav} />
        <NavGroup label="Resume" items={resumeNav} />
        <NavGroup label="Templates" items={archetypeNav} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 3: Verify theme toggle works end-to-end**

Run the dev server. Confirm:
- Theme toggle button appears at the bottom of the sidebar
- Shows sun icon + "Light mode" in light mode
- Clicking switches to dark mode (moon icon + "Dark mode")
- Page background, cards, sidebar all update
- Refreshing the page preserves the chosen theme

- [ ] **Step 4: Commit**

```bash
git add web/src/components/layout/sidebar.tsx
git commit -m "feat: add theme toggle to sidebar footer"
```

---

### Task 7: Typecheck and final verification

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `bun run --cwd web typecheck`

Expected: no errors. If there are errors, fix them before proceeding.

- [ ] **Step 2: Run biome check**

Run: `bun run check`

Expected: no lint/format errors. If there are errors, fix with `bun run check:fix`.

- [ ] **Step 3: Visual smoke test — light mode**

Open `http://localhost:5173` and verify:
- Warm off-white background (not pure white)
- Dark warm sidebar with amber accents
- Rounded cards (14px radius via `--radius: 0.75rem`)
- Amber focus rings when tabbing through elements
- All shadcn components (buttons, inputs, dialogs) inherit warm tokens

- [ ] **Step 4: Visual smoke test — dark mode**

Toggle to dark mode and verify:
- Deep warm gray background (not pure black)
- Cards are lighter surface than background
- Sidebar adjusts subtly
- Amber accents brighten for readability
- Text is legible on all surfaces

- [ ] **Step 5: Commit any fixes**

If any fixes were needed:

```bash
git add -A
git commit -m "fix: address typecheck and lint issues from design system"
```
