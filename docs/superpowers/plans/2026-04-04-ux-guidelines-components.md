# UX Guidelines & Component Catalog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `web/design/` directory consolidating all UI/UX documentation, implement shared UX components (EditableField, SaveBar, ConfirmDialog, EmptyState, FieldError, LoadingSkeleton, useDirtyTracking, useNavGuard), and set up Storybook as a living component reference.

**Architecture:** Shared components live in `web/src/components/shared/`. Hooks live in `web/src/hooks/`. Components wrap existing shadcn/ui primitives (Input, Textarea, Select, AlertDialog, Skeleton, Button, Label) and add behavioral UX logic (dirty tracking, validation display, navigation guards). Storybook provides the visual catalog.

**Tech Stack:** React 19, Storybook 9 (`@storybook/react-vite`), TanStack Router `useBlocker`, shadcn/ui + @base-ui/react, Tailwind CSS 4, lucide-react

---

### Task 1: Create `web/design/` and move design system doc

**Files:**
- Create: `web/design/ux-guidelines.md`
- Move: `docs/superpowers/specs/2026-03-30-web-frontend-design-system.md` → `web/design/design-system.md`
- Modify: `web/CLAUDE.md`

- [ ] **Step 1: Create `web/design/` directory and move design system spec**

```bash
mkdir -p web/design
git mv docs/superpowers/specs/2026-03-30-web-frontend-design-system.md web/design/design-system.md
```

- [ ] **Step 2: Create `web/design/ux-guidelines.md`**

Write the full UX guidelines content from the spec (see `.claude/plans/pure-brewing-book.md` sections 1–4: Editing & Forms, Loading/Empty/Error States, Feedback & Notifications, Navigation & Data Safety). Copy the spec content verbatim — it is the source of truth.

- [ ] **Step 3: Update `web/CLAUDE.md` design system reference**

Replace the existing `## Design System` section:

```markdown
## Design System & UX Guidelines

All UI must follow the design docs in `web/design/`:
- **`design-system.md`** — color tokens, typography, layout, component styling
- **`ux-guidelines.md`** — behavioral UX patterns: forms, loading states, feedback, navigation guards

Key visual rules:
- **No bold (700) or semibold (600)** — max weight is `font-medium` (500)
- **No hardcoded colors** — use design tokens (`primary`, `accent`, `muted`, etc.)
- **No shadows on cards/inputs** — use borders only
- **Always-editable fields** — no edit mode toggles or pencil icons
- **Aggregate-scoped save** — sticky SaveBar appears when fields are dirty
- **Typography scale**: h1=22px/medium, h2=18px/medium, h3=15px/medium, body=14px/regular
```

Also update the inline editing bullet under this section to remove the old pencil-icon pattern reference.

- [ ] **Step 4: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS (docs-only changes, no code affected)

- [ ] **Step 5: Commit**

```bash
git add web/design/ web/CLAUDE.md docs/superpowers/specs/
git commit -m "docs: create web/design/, move design system, add UX guidelines"
```

---

### Task 2: Install and configure Storybook

**Files:**
- Modify: `web/package.json` (via install)
- Create: `web/.storybook/main.ts`
- Create: `web/.storybook/preview.ts`

- [ ] **Step 1: Install Storybook dependencies**

```bash
cd web && bun add -d @storybook/react-vite storybook
```

- [ ] **Step 2: Create `web/.storybook/main.ts`**

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
};

export default config;
```

- [ ] **Step 3: Create `web/.storybook/preview.ts`**

```typescript
import type { Preview } from '@storybook/react-vite';

import '../src/app.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

- [ ] **Step 4: Add storybook scripts to `web/package.json`**

Add to `"scripts"`:

```json
"storybook": "storybook dev -p 6006",
"storybook:build": "storybook build"
```

- [ ] **Step 5: Add Storybook output to `.gitignore`**

Append to root `.gitignore`:

```
storybook-static
```

- [ ] **Step 6: Verify Storybook launches**

```bash
cd web && bun run storybook
```

Expected: Storybook opens at `http://localhost:6006` with no stories yet. Ctrl+C to stop.

- [ ] **Step 7: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add web/.storybook/ web/package.json .gitignore
git commit -m "chore: set up Storybook 9 with React Vite"
```

---

### Task 3: Implement `FieldError` component

**Files:**
- Create: `web/src/components/shared/FieldError.tsx`
- Create: `web/src/components/shared/FieldError.stories.tsx`

- [ ] **Step 1: Create `web/src/components/shared/FieldError.tsx`**

```tsx
import { cn } from '@/lib/utils';

interface FieldErrorProps {
  readonly message?: string;
  readonly className?: string;
}

function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p data-slot="field-error" className={cn('text-destructive text-xs mt-1', className)}>
      {message}
    </p>
  );
}

export { FieldError };
export type { FieldErrorProps };
```

- [ ] **Step 2: Create `web/src/components/shared/FieldError.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldError } from './FieldError';

const meta = {
  component: FieldError,
} satisfies Meta<typeof FieldError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMessage: Story = {
  args: {
    message: 'This field is required',
  },
};

export const Empty: Story = {
  args: {
    message: undefined,
  },
};
```

- [ ] **Step 3: Verify in Storybook**

```bash
cd web && bun run storybook
```

Expected: FieldError stories render — "WithMessage" shows red error text, "Empty" shows nothing.

- [ ] **Step 4: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/shared/FieldError.tsx web/src/components/shared/FieldError.stories.tsx
git commit -m "feat(web): add FieldError component with Storybook stories"
```

---

### Task 4: Implement `EmptyState` component

**Files:**
- Create: `web/src/components/shared/EmptyState.tsx`
- Create: `web/src/components/shared/EmptyState.stories.tsx`

- [ ] **Step 1: Create `web/src/components/shared/EmptyState.tsx`**

```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly className?: string;
}

function EmptyState({ message, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div data-slot="empty-state" className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction && (
        <Button variant="default" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
```

- [ ] **Step 2: Create `web/src/components/shared/EmptyState.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmptyState } from './EmptyState';

const meta = {
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  args: {
    message: 'No experiences yet',
    actionLabel: 'Add experience',
    onAction: () => {},
  },
};

export const WithoutAction: Story = {
  args: {
    message: 'No results found',
  },
};
```

- [ ] **Step 3: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/EmptyState.tsx web/src/components/shared/EmptyState.stories.tsx
git commit -m "feat(web): add EmptyState component with Storybook stories"
```

---

### Task 5: Implement `LoadingSkeleton` component

**Files:**
- Create: `web/src/components/shared/LoadingSkeleton.tsx`
- Create: `web/src/components/shared/LoadingSkeleton.stories.tsx`

- [ ] **Step 1: Create `web/src/components/shared/LoadingSkeleton.tsx`**

```tsx
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type SkeletonVariant = 'card' | 'list' | 'form' | 'detail';

interface LoadingSkeletonProps {
  readonly variant: SkeletonVariant;
  readonly count?: number;
  readonly className?: string;
}

function CardSkeleton() {
  return (
    <div className="rounded-[14px] border border-border p-5 space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

function ListSkeleton({ count }: { readonly count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

const variants: Record<SkeletonVariant, React.FC<{ count?: number }>> = {
  card: CardSkeleton,
  list: ({ count = 3 }) => <ListSkeleton count={count} />,
  form: FormSkeleton,
  detail: DetailSkeleton,
};

function LoadingSkeleton({ variant, count, className }: LoadingSkeletonProps) {
  const Variant = variants[variant];
  return (
    <div data-slot="loading-skeleton" className={cn('animate-in fade-in duration-300', className)}>
      <Variant count={count} />
    </div>
  );
}

export { LoadingSkeleton };
export type { LoadingSkeletonProps, SkeletonVariant };
```

- [ ] **Step 2: Create `web/src/components/shared/LoadingSkeleton.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSkeleton } from './LoadingSkeleton';

const meta = {
  component: LoadingSkeleton,
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  args: { variant: 'card' },
};

export const List: Story = {
  args: { variant: 'list', count: 5 },
};

export const Form: Story = {
  args: { variant: 'form' },
};

export const Detail: Story = {
  args: { variant: 'detail' },
};
```

- [ ] **Step 3: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/LoadingSkeleton.tsx web/src/components/shared/LoadingSkeleton.stories.tsx
git commit -m "feat(web): add LoadingSkeleton component with Storybook stories"
```

---

### Task 6: Implement `ConfirmDialog` component

**Files:**
- Create: `web/src/components/shared/ConfirmDialog.tsx`
- Create: `web/src/components/shared/ConfirmDialog.stories.tsx`

- [ ] **Step 1: Create `web/src/components/shared/ConfirmDialog.tsx`**

```tsx
import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';

interface ConfirmDialogProps {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly confirmVariant?: 'destructive' | 'default';
  readonly onConfirm: () => void | Promise<void>;
  readonly onCancel?: () => void;
  readonly trigger: ReactNode;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
  trigger,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: confirmVariant })} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
```

- [ ] **Step 2: Create `web/src/components/shared/ConfirmDialog.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/button';

import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  component: ConfirmDialog,
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteConfirmation: Story = {
  args: {
    title: 'Delete experience?',
    description: 'This action cannot be undone. This will permanently delete this experience and all its accomplishments.',
    confirmLabel: 'Delete',
    confirmVariant: 'destructive',
    onConfirm: () => {},
    trigger: <Button variant="destructive">Delete</Button>,
  },
};

export const DiscardChanges: Story = {
  args: {
    title: 'Discard unsaved changes?',
    description: 'You have unsaved changes that will be lost.',
    confirmLabel: 'Discard',
    confirmVariant: 'destructive',
    onConfirm: () => {},
    trigger: <Button variant="ghost">Leave page</Button>,
  },
};
```

- [ ] **Step 3: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/ConfirmDialog.tsx web/src/components/shared/ConfirmDialog.stories.tsx
git commit -m "feat(web): add ConfirmDialog component with Storybook stories"
```

---

### Task 7: Implement `useDirtyTracking` hook

**Files:**
- Create: `web/src/hooks/use-dirty-tracking.ts`
- Create: `web/src/hooks/test/use-dirty-tracking.test.ts`

- [ ] **Step 1: Write failing tests for `useDirtyTracking`**

Create `web/src/hooks/test/use-dirty-tracking.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useDirtyTracking } from '../use-dirty-tracking.js';

describe('useDirtyTracking', () => {
  test('starts clean with saved state as current', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.current).toEqual(saved);
  });

  test('detects dirty state when a field changes', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(1);
    expect(result.current.current.name).toBe('Bob');
  });

  test('returns clean when field reverts to saved value', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setField('name', 'Alice');
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  test('reset restores current to saved state', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
      result.current.setField('title', 'Manager');
    });
    expect(result.current.dirtyCount).toBe(2);

    act(() => {
      result.current.reset();
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.current).toEqual(saved);
  });

  test('getChanges returns only modified fields', () => {
    const saved = { name: 'Alice', title: 'Engineer', location: 'NYC' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
      result.current.setField('location', 'SF');
    });

    expect(result.current.getChanges()).toEqual({ name: 'Bob', location: 'SF' });
  });

  test('isDirtyField checks individual field dirty state', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
    });

    expect(result.current.isDirtyField('name')).toBe(true);
    expect(result.current.isDirtyField('title')).toBe(false);
  });

  test('updates saved baseline when savedState prop changes', () => {
    const initial = { name: 'Alice', title: 'Engineer' };
    const { result, rerender } = renderHook(({ saved }) => useDirtyTracking(saved), {
      initialProps: { saved: initial },
    });

    act(() => {
      result.current.setField('name', 'Bob');
    });
    expect(result.current.isDirty).toBe(true);

    // Simulate server returning updated data after save
    rerender({ saved: { name: 'Bob', title: 'Engineer' } });
    expect(result.current.isDirty).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web && bun test src/hooks/test/use-dirty-tracking.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Install @testing-library/react if not present**

```bash
cd web && bun add -d @testing-library/react
```

- [ ] **Step 4: Implement `web/src/hooks/use-dirty-tracking.ts`**

```typescript
import { useCallback, useMemo, useRef, useState } from 'react';

type DirtyTracking<T extends Record<string, unknown>> = {
  current: T;
  isDirty: boolean;
  dirtyCount: number;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  isDirtyField: (key: keyof T) => boolean;
  reset: () => void;
  getChanges: () => Partial<T>;
};

function useDirtyTracking<T extends Record<string, unknown>>(savedState: T): DirtyTracking<T> {
  const [current, setCurrent] = useState<T>(savedState);
  const savedRef = useRef(savedState);

  // Update baseline when savedState changes (e.g., after successful save)
  if (savedRef.current !== savedState) {
    savedRef.current = savedState;
    setCurrent(savedState);
  }

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setCurrent(prev => ({ ...prev, [key]: value }));
  }, []);

  const isDirtyField = useCallback(
    (key: keyof T): boolean => current[key] !== savedRef.current[key],
    [current]
  );

  const reset = useCallback(() => {
    setCurrent(savedRef.current);
  }, []);

  const getChanges = useCallback((): Partial<T> => {
    const changes: Partial<T> = {};
    for (const key of Object.keys(savedRef.current) as Array<keyof T>) {
      if (current[key] !== savedRef.current[key]) {
        changes[key] = current[key];
      }
    }
    return changes;
  }, [current]);

  const dirtyFields = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(savedRef.current) as Array<keyof T>) {
      if (current[key] !== savedRef.current[key]) count++;
    }
    return count;
  }, [current]);

  return {
    current,
    isDirty: dirtyFields > 0,
    dirtyCount: dirtyFields,
    setField,
    isDirtyField,
    reset,
    getChanges,
  };
}

export { useDirtyTracking };
export type { DirtyTracking };
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd web && bun test src/hooks/test/use-dirty-tracking.test.ts
```

Expected: All 7 tests PASS

- [ ] **Step 6: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add web/src/hooks/use-dirty-tracking.ts web/src/hooks/test/use-dirty-tracking.test.ts
git commit -m "feat(web): add useDirtyTracking hook with tests"
```

---

### Task 8: Implement `EditableField` component

**Files:**
- Create: `web/src/components/shared/EditableField.tsx`
- Create: `web/src/components/shared/EditableField.stories.tsx`

- [ ] **Step 1: Create `web/src/components/shared/EditableField.tsx`**

```tsx
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldError } from './FieldError';

type FieldType = 'text' | 'textarea' | 'select';

interface EditableFieldBaseProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly isDirty?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
}

interface TextFieldProps extends EditableFieldBaseProps {
  readonly type: 'text';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

interface TextareaFieldProps extends EditableFieldBaseProps {
  readonly type: 'textarea';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly rows?: number;
}

interface SelectFieldProps extends EditableFieldBaseProps {
  readonly type: 'select';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
}

type EditableFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps;

function EditableField(props: EditableFieldProps) {
  const { label, required, error, isDirty, disabled, className, type } = props;

  const fieldId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      data-slot="editable-field"
      className={cn('space-y-1.5', isDirty && 'border-l-2 border-primary/30 pl-3', className)}
    >
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {type === 'text' && (
        <Input
          id={fieldId}
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}

      {type === 'textarea' && (
        <Textarea
          id={fieldId}
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows ?? 3}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}

      {type === 'select' && (
        <Select value={props.value} onValueChange={props.onChange} disabled={disabled}>
          <SelectTrigger id={fieldId} aria-invalid={!!error || undefined}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <FieldError message={error} />
    </div>
  );
}

export { EditableField };
export type { EditableFieldProps, FieldType };
```

- [ ] **Step 2: Create `web/src/components/shared/EditableField.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EditableField } from './EditableField';

const meta = {
  component: EditableField,
} satisfies Meta<typeof EditableField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    type: 'text',
    label: 'Full name',
    value: 'Alice Johnson',
    onChange: () => {},
  },
};

export const TextDirty: Story = {
  args: {
    type: 'text',
    label: 'Full name',
    value: 'Bob Smith',
    onChange: () => {},
    isDirty: true,
  },
};

export const TextWithError: Story = {
  args: {
    type: 'text',
    label: 'Email',
    value: '',
    onChange: () => {},
    required: true,
    error: 'Email is required',
  },
};

export const TextareaField: Story = {
  args: {
    type: 'textarea',
    label: 'About',
    value: 'A brief description...',
    onChange: () => {},
    placeholder: 'Tell us about yourself',
  },
};

export const SelectField: Story = {
  args: {
    type: 'select',
    label: 'Employment type',
    value: 'full-time',
    onChange: () => {},
    options: [
      { label: 'Full-time', value: 'full-time' },
      { label: 'Part-time', value: 'part-time' },
      { label: 'Contract', value: 'contract' },
    ],
  },
};

export const Disabled: Story = {
  args: {
    type: 'text',
    label: 'Read-only field',
    value: 'Cannot edit',
    onChange: () => {},
    disabled: true,
  },
};
```

- [ ] **Step 3: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/EditableField.tsx web/src/components/shared/EditableField.stories.tsx
git commit -m "feat(web): add EditableField component with Storybook stories"
```

---

### Task 9: Implement `SaveBar` component

**Files:**
- Create: `web/src/components/shared/SaveBar.tsx`
- Create: `web/src/components/shared/SaveBar.stories.tsx`

- [ ] **Step 1: Create `web/src/components/shared/SaveBar.tsx`**

```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SaveBarProps {
  readonly dirtyCount: number;
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
  readonly isSaving?: boolean;
  readonly className?: string;
}

function SaveBar({ dirtyCount, onSave, onDiscard, isSaving = false, className }: SaveBarProps) {
  if (dirtyCount === 0) return null;

  return (
    <div
      data-slot="save-bar"
      className={cn(
        'sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border bg-card px-5 py-3 animate-in slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving}>
          Discard
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export { SaveBar };
export type { SaveBarProps };
```

- [ ] **Step 2: Create `web/src/components/shared/SaveBar.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SaveBar } from './SaveBar';

const meta = {
  component: SaveBar,
  decorators: [
    Story => (
      <div className="relative min-h-[200px] border border-border rounded-lg">
        <div className="p-5 text-sm text-muted-foreground">Aggregate content area</div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SaveBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleChange: Story = {
  args: {
    dirtyCount: 1,
    onSave: () => {},
    onDiscard: () => {},
  },
};

export const MultipleChanges: Story = {
  args: {
    dirtyCount: 5,
    onSave: () => {},
    onDiscard: () => {},
  },
};

export const Saving: Story = {
  args: {
    dirtyCount: 3,
    onSave: () => {},
    onDiscard: () => {},
    isSaving: true,
  },
};
```

- [ ] **Step 3: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/SaveBar.tsx web/src/components/shared/SaveBar.stories.tsx
git commit -m "feat(web): add SaveBar component with Storybook stories"
```

---

### Task 10: Implement `useNavGuard` hook

**Files:**
- Create: `web/src/hooks/use-nav-guard.ts`
- Create: `web/src/hooks/test/use-nav-guard.test.ts`

- [ ] **Step 1: Write tests for `useNavGuard`**

Create `web/src/hooks/test/use-nav-guard.test.ts`:

```typescript
import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useNavGuard } from '../use-nav-guard.js';

// Mock TanStack Router's useBlocker
const mockUseBlocker = mock(() => {});
mock.module('@tanstack/react-router', () => ({
  useBlocker: mockUseBlocker,
}));

describe('useNavGuard', () => {
  test('calls useBlocker with shouldBlockFn that returns isDirty value', () => {
    renderHook(() => useNavGuard({ isDirty: true }));

    expect(mockUseBlocker).toHaveBeenCalledWith(
      expect.objectContaining({
        enableBeforeUnload: expect.any(Function),
        disabled: false,
      })
    );
  });

  test('disables blocker when not dirty', () => {
    renderHook(() => useNavGuard({ isDirty: false }));

    expect(mockUseBlocker).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
      })
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web && bun test src/hooks/test/use-nav-guard.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement `web/src/hooks/use-nav-guard.ts`**

```typescript
import { useBlocker } from '@tanstack/react-router';

interface NavGuardOptions {
  readonly isDirty: boolean;
  readonly message?: string;
}

function useNavGuard({ isDirty, message = 'You have unsaved changes. Leave without saving?' }: NavGuardOptions): void {
  useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: () => isDirty,
    disabled: !isDirty,
    withResolver: false,
  });
}

export { useNavGuard };
export type { NavGuardOptions };
```

Note: `useBlocker` with `withResolver: false` will show the browser's native confirmation dialog. For a custom dialog, the consuming page can use `withResolver: true` and render a `ConfirmDialog` — but the hook keeps the simple default.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && bun test src/hooks/test/use-nav-guard.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Run typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/hooks/use-nav-guard.ts web/src/hooks/test/use-nav-guard.test.ts
git commit -m "feat(web): add useNavGuard hook with tests"
```

---

### Task 11: Barrel export and final verification

**Files:**
- Create: `web/src/components/shared/index.ts`
- Modify: verify all checks pass

- [ ] **Step 1: Create barrel export `web/src/components/shared/index.ts`**

```typescript
export { ConfirmDialog } from './ConfirmDialog.js';
export type { ConfirmDialogProps } from './ConfirmDialog.js';

export { EditableField } from './EditableField.js';
export type { EditableFieldProps, FieldType } from './EditableField.js';

export { EmptyState } from './EmptyState.js';
export type { EmptyStateProps } from './EmptyState.js';

export { FieldError } from './FieldError.js';
export type { FieldErrorProps } from './FieldError.js';

export { LoadingSkeleton } from './LoadingSkeleton.js';
export type { LoadingSkeletonProps, SkeletonVariant } from './LoadingSkeleton.js';

export { SaveBar } from './SaveBar.js';
export type { SaveBarProps } from './SaveBar.js';
```

- [ ] **Step 2: Run full verification**

```bash
bun run typecheck
bun run check
bun run knip
cd web && bun test
```

Expected: All PASS

- [ ] **Step 3: Verify Storybook renders all stories**

```bash
cd web && bun run storybook
```

Expected: All component stories render correctly at `http://localhost:6006`. Verify:
- FieldError: red text appears/disappears
- EmptyState: centered message with/without button
- LoadingSkeleton: all 4 variants animate
- ConfirmDialog: dialog opens on trigger click
- EditableField: all type variants render, dirty state shows left border, error state shows red border + message
- SaveBar: sticky at bottom, spinner on saving state

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/index.ts
git commit -m "feat(web): add barrel export for shared components"
```

---

## Verification Checklist

1. `bun run typecheck` — no type errors across all packages
2. `bun run check` — Biome lint + format passes
3. `bun run knip` — no dead exports or unused dependencies
4. `cd web && bun test` — all hook tests pass
5. `cd web && bun run storybook` — all stories render correctly
6. `web/design/design-system.md` exists (moved from docs/)
7. `web/design/ux-guidelines.md` exists with full behavioral spec
8. `web/CLAUDE.md` references `web/design/` for UI/UX guidance
