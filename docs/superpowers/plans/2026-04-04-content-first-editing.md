# Content-First Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all editable UI from "always-editable form fields" to a "content-first click-to-edit" pattern where data renders as plain text by default, with hover affordance and inline edit mode.

**Architecture:** A shared `EditableSection` compound component wraps Display/Editor slots, orchestrated by an `EditableSectionProvider` context that enforces one-section-at-a-time editing. Existing hooks (`useDirtyTracking`, `useNavGuard`) and components (`EditableField`, `SaveBar`) are reused inside the Editor slot.

**Tech Stack:** React 19, TanStack Router/Query, Tailwind CSS 4, shadcn/ui, Storybook 10, bun:test

**Spec:** `docs/superpowers/specs/2026-04-04-content-first-editing-design.md`

---

## File Structure

```
New files:
web/src/components/shared/EditableSectionContext.tsx    ← context + provider + hook
web/src/components/shared/EditableSection.tsx           ← compound component wrapper
web/src/components/shared/EditableSection.stories.tsx   ← all states + variants
web/src/components/resume/profile/ProfileDisplay.tsx    ← profile content display
web/src/components/resume/profile/ProfileDisplay.stories.tsx
web/src/components/resume/headlines/HeadlineCardContent.tsx
web/src/components/resume/headlines/HeadlineCardContent.stories.tsx
web/src/components/resume/education/EducationCardContent.tsx
web/src/components/resume/education/EducationCardContent.stories.tsx
web/src/components/resume/experience/ExperienceCardContent.tsx
web/src/components/resume/experience/ExperienceCardContent.stories.tsx
web/src/components/companies/CompanyCardContent.stories.tsx

Tests:
web/src/components/shared/test/EditableSectionContext.test.tsx
web/src/components/shared/test/EditableSection.test.tsx
web/src/components/resume/profile/test/ProfileDisplay.test.tsx
web/src/components/resume/headlines/test/HeadlineCardContent.test.tsx
web/src/components/resume/education/test/EducationCardContent.test.tsx

Modified files:
web/src/components/shared/SaveBar.tsx                  ← add variant="inline"
web/src/routes/profile/index.tsx                       ← refactor to EditableSection
web/src/routes/headlines/index.tsx                      ← remove aggregate dirty registry
web/src/components/resume/headlines/HeadlineList.tsx    ← content-first cards
web/src/routes/education/index.tsx                      ← remove aggregate dirty registry
web/src/components/resume/education/EducationList.tsx   ← content-first cards
web/src/components/resume/experience/ExperienceCard.tsx ← hover treatment update
web/src/components/companies/CompanyCard.tsx            ← hover treatment update
web/design/design-system.md                            ← new content-first rules
web/design/ux-guidelines.md                            ← rewrite Section 1
web/CLAUDE.md                                          ← update key visual rules
```

---

## Task 1: EditableSectionContext — Mutual Exclusion Provider

**Files:**
- Create: `web/src/components/shared/EditableSectionContext.tsx`
- Test: `web/src/components/shared/test/EditableSectionContext.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/shared/test/EditableSectionContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import type { ReactNode } from 'react';
import { EditableSectionProvider, useEditableSection } from '../EditableSectionContext.js';

function wrapper({ children }: { children: ReactNode }) {
  return <EditableSectionProvider>{children}</EditableSectionProvider>;
}

describe('useEditableSection', () => {
  test('starts with no section editing', () => {
    const { result } = renderHook(() => useEditableSection('section-a'), { wrapper });
    expect(result.current.isEditing).toBe(false);
  });

  test('requestEdit activates the section', () => {
    const { result } = renderHook(() => useEditableSection('section-a'), { wrapper });
    act(() => {
      result.current.requestEdit();
    });
    expect(result.current.isEditing).toBe(true);
  });

  test('release deactivates the section', () => {
    const { result } = renderHook(() => useEditableSection('section-a'), { wrapper });
    act(() => {
      result.current.requestEdit();
    });
    act(() => {
      result.current.release();
    });
    expect(result.current.isEditing).toBe(false);
  });

  test('only one section can be active at a time', () => {
    const { result } = renderHook(
      () => ({
        a: useEditableSection('section-a'),
        b: useEditableSection('section-b')
      }),
      { wrapper }
    );

    act(() => {
      result.current.a.requestEdit();
    });
    expect(result.current.a.isEditing).toBe(true);

    // B cannot take over while A is active
    const took = act(() => result.current.b.requestEdit());
    expect(result.current.b.isEditing).toBe(false);
    expect(result.current.a.isEditing).toBe(true);
  });

  test('second section can activate after first releases', () => {
    const { result } = renderHook(
      () => ({
        a: useEditableSection('section-a'),
        b: useEditableSection('section-b')
      }),
      { wrapper }
    );

    act(() => {
      result.current.a.requestEdit();
    });
    act(() => {
      result.current.a.release();
    });
    act(() => {
      result.current.b.requestEdit();
    });
    expect(result.current.b.isEditing).toBe(true);
    expect(result.current.a.isEditing).toBe(false);
  });

  test('forceRelease allows taking over from another section', () => {
    const { result } = renderHook(
      () => ({
        a: useEditableSection('section-a'),
        b: useEditableSection('section-b')
      }),
      { wrapper }
    );

    act(() => {
      result.current.a.requestEdit();
    });
    act(() => {
      result.current.b.forceEdit();
    });
    expect(result.current.b.isEditing).toBe(true);
    expect(result.current.a.isEditing).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test web/src/components/shared/test/EditableSectionContext.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement EditableSectionContext**

```tsx
// web/src/components/shared/EditableSectionContext.tsx
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

interface EditableSectionStore {
  subscribe: (listener: () => void) => () => void;
  getActiveId: () => string | null;
  requestEdit: (id: string) => boolean;
  forceEdit: (id: string) => void;
  release: (id: string) => void;
}

function createEditableSectionStore(): EditableSectionStore {
  let activeId: string | null = null;
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getActiveId: () => activeId,
    requestEdit: (id) => {
      if (activeId !== null && activeId !== id) return false;
      if (activeId === id) return true;
      activeId = id;
      notify();
      return true;
    },
    forceEdit: (id) => {
      activeId = id;
      notify();
    },
    release: (id) => {
      if (activeId !== id) return;
      activeId = null;
      notify();
    }
  };
}

const EditableSectionContext = createContext<EditableSectionStore | null>(null);

interface EditableSectionProviderProps {
  readonly children: ReactNode;
}

function EditableSectionProvider({ children }: EditableSectionProviderProps) {
  const store = useMemo(() => createEditableSectionStore(), []);
  return <EditableSectionContext value={store}>{children}</EditableSectionContext>;
}

interface EditableSectionHook {
  isEditing: boolean;
  isBlocked: boolean;
  requestEdit: () => boolean;
  forceEdit: () => void;
  release: () => void;
}

function useEditableSection(sectionId: string): EditableSectionHook {
  const store = useContext(EditableSectionContext);
  if (!store) throw new Error('useEditableSection must be used within EditableSectionProvider');

  const activeId = useSyncExternalStore(store.subscribe, store.getActiveId);

  const requestEdit = useCallback(() => store.requestEdit(sectionId), [store, sectionId]);
  const forceEdit = useCallback(() => store.forceEdit(sectionId), [store, sectionId]);
  const release = useCallback(() => store.release(sectionId), [store, sectionId]);

  return {
    isEditing: activeId === sectionId,
    isBlocked: activeId !== null && activeId !== sectionId,
    requestEdit,
    forceEdit,
    release
  };
}

export { EditableSectionProvider, useEditableSection };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test web/src/components/shared/test/EditableSectionContext.test.tsx`
Expected: All 6 tests PASS

- [ ] **Step 5: Lint check**

Run: `bun run check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/components/shared/EditableSectionContext.tsx web/src/components/shared/test/EditableSectionContext.test.tsx
git commit -m "feat: add EditableSectionContext for mutual exclusion editing"
```

---

## Task 2: SaveBar Inline Variant

**Files:**
- Modify: `web/src/components/shared/SaveBar.tsx`
- Modify: `web/src/components/shared/SaveBar.stories.tsx`

- [ ] **Step 1: Add variant prop to SaveBar**

In `web/src/components/shared/SaveBar.tsx`, add `variant` to the props:

```tsx
interface SaveBarProps {
  readonly dirtyCount: number;
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
  readonly isSaving?: boolean;
  readonly variant?: 'sticky' | 'inline';
  readonly className?: string;
}

function SaveBar({ dirtyCount, onSave, onDiscard, isSaving = false, variant = 'sticky', className }: SaveBarProps) {
  if (dirtyCount === 0 && variant === 'sticky') return null;

  const isInline = variant === 'inline';

  return (
    <div
      data-slot="save-bar"
      className={cn(
        'flex items-center justify-end gap-2',
        isInline
          ? 'pt-3 mt-3 border-t border-border'
          : 'sticky bottom-0 z-10 justify-between gap-4 border-t border-border bg-card px-5 py-3 animate-in slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {!isInline && (
        <p className="text-sm text-muted-foreground">
          {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
        </p>
      )}
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
```

- [ ] **Step 2: Add Inline story**

Add to `web/src/components/shared/SaveBar.stories.tsx`:

```tsx
export const Inline: Story = {
  args: {
    dirtyCount: 2,
    variant: 'inline',
    onSave: () => {},
    onDiscard: () => {}
  }
};

export const InlineSaving: Story = {
  args: {
    dirtyCount: 1,
    variant: 'inline',
    onSave: () => {},
    onDiscard: () => {},
    isSaving: true
  }
};
```

- [ ] **Step 3: Run existing tests + lint**

Run: `bun test web/src/components/shared/ && bun run check`
Expected: PASS (existing behavior unchanged, default variant is 'sticky')

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/SaveBar.tsx web/src/components/shared/SaveBar.stories.tsx
git commit -m "feat: add inline variant to SaveBar for content-first sections"
```

---

## Task 3: EditableSection Compound Component

**Files:**
- Create: `web/src/components/shared/EditableSection.tsx`
- Create: `web/src/components/shared/EditableSection.stories.tsx`
- Test: `web/src/components/shared/test/EditableSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/shared/test/EditableSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, mock } from 'bun:test';
import { EditableSection } from '../EditableSection.js';
import { EditableSectionProvider } from '../EditableSectionContext.js';

function renderWithProvider(ui: React.ReactElement) {
  return render(<EditableSectionProvider>{ui}</EditableSectionProvider>);
}

describe('EditableSection', () => {
  test('renders display slot by default', () => {
    renderWithProvider(
      <EditableSection sectionId="test" onSave={() => {}} onDiscard={() => {}} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <p>Display content</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor content</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    expect(screen.getByText('Display content')).toBeTruthy();
    expect(screen.queryByText('Editor content')).toBeNull();
  });

  test('switches to editor on click', () => {
    renderWithProvider(
      <EditableSection sectionId="test" onSave={() => {}} onDiscard={() => {}} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <p>Display content</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor content</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    fireEvent.click(screen.getByText('Display content'));
    expect(screen.getByText('Editor content')).toBeTruthy();
    expect(screen.queryByText('Display content')).toBeNull();
  });

  test('shows Save and Discard buttons in edit mode', () => {
    renderWithProvider(
      <EditableSection sectionId="test" onSave={() => {}} onDiscard={() => {}} isDirty={true} isSaving={false}>
        <EditableSection.Display>
          <p>Display content</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor content</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    fireEvent.click(screen.getByText('Display content'));
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Discard')).toBeTruthy();
  });

  test('calls onSave when Save is clicked', () => {
    const onSave = mock(() => {});
    renderWithProvider(
      <EditableSection sectionId="test" onSave={onSave} onDiscard={() => {}} isDirty={true} isSaving={false}>
        <EditableSection.Display>
          <p>Display</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    fireEvent.click(screen.getByText('Display'));
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('calls onDiscard and returns to display when Discard is clicked (clean)', () => {
    const onDiscard = mock(() => {});
    renderWithProvider(
      <EditableSection sectionId="test" onSave={() => {}} onDiscard={onDiscard} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <p>Display</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    fireEvent.click(screen.getByText('Display'));
    fireEvent.click(screen.getByText('Discard'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Display')).toBeTruthy();
  });

  test('applies hover class on display wrapper', () => {
    renderWithProvider(
      <EditableSection sectionId="test" onSave={() => {}} onDiscard={() => {}} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <p>Display</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    const wrapper = screen.getByTestId('editable-section-test');
    expect(wrapper.className).toContain('hover:bg-accent/40');
  });

  test('Escape key triggers discard when clean', () => {
    const onDiscard = mock(() => {});
    renderWithProvider(
      <EditableSection sectionId="test" onSave={() => {}} onDiscard={onDiscard} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <p>Display</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <p>Editor</p>
        </EditableSection.Editor>
      </EditableSection>
    );

    fireEvent.click(screen.getByText('Display'));
    fireEvent.keyDown(screen.getByTestId('editable-section-test'), { key: 'Escape' });
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test web/src/components/shared/test/EditableSection.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement EditableSection**

```tsx
// web/src/components/shared/EditableSection.tsx
import { type ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useEditableSection } from './EditableSectionContext.js';
import { SaveBar } from './SaveBar.js';

interface EditableSectionProps {
  readonly sectionId: string;
  readonly variant?: 'section' | 'card';
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

function EditableSectionRoot({
  sectionId,
  variant = 'section',
  onSave,
  onDiscard,
  isDirty,
  isSaving,
  className,
  children
}: EditableSectionProps) {
  const { isEditing, requestEdit, release } = useEditableSection(sectionId);

  // Extract Display and Editor children from compound component slots
  let displayContent: ReactNode = null;
  let editorContent: ReactNode = null;

  const childArray = Array.isArray(children) ? children : [children];
  for (const child of childArray) {
    if (child && typeof child === 'object' && 'type' in child) {
      if (child.type === EditableSectionDisplay) {
        displayContent = child.props.children;
      } else if (child.type === EditableSectionEditor) {
        editorContent = child.props.children;
      }
    }
  }

  const handleClick = useCallback(() => {
    if (!isEditing) requestEdit();
  }, [isEditing, requestEdit]);

  const handleDiscard = useCallback(() => {
    onDiscard();
    release();
  }, [onDiscard, release]);

  const handleSave = useCallback(async () => {
    await onSave();
    // Caller is responsible for calling release after save succeeds
    // via the mutation's onSuccess. We release optimistically here.
    release();
  }, [onSave, release]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        if (!isDirty) {
          onDiscard();
          release();
        }
        // If dirty, the user must explicitly save or discard via buttons
        // (confirm dialog could be added here in the future)
      }
    },
    [isEditing, isDirty, onDiscard, release]
  );

  const isCard = variant === 'card';

  return (
    <div
      data-testid={`editable-section-${sectionId}`}
      data-slot="editable-section"
      className={cn(
        'transition-colors duration-200',
        isCard && 'border rounded-[14px] p-5',
        isEditing
          ? cn('border-primary/50', isCard ? '' : 'border rounded-[14px] p-5')
          : 'cursor-pointer hover:bg-accent/40',
        className
      )}
      onClick={!isEditing ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      // biome-ignore lint/a11y/useSemanticElements: editable section acts as interactive region
      role={!isEditing ? 'button' : undefined}
      tabIndex={!isEditing ? 0 : undefined}
    >
      {isEditing ? (
        <>
          {editorContent}
          <SaveBar variant="inline" dirtyCount={isDirty ? 1 : 0} onSave={handleSave} onDiscard={handleDiscard} isSaving={isSaving} />
        </>
      ) : (
        displayContent
      )}
    </div>
  );
}

function EditableSectionDisplay({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}

function EditableSectionEditor({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}

const EditableSection = Object.assign(EditableSectionRoot, {
  Display: EditableSectionDisplay,
  Editor: EditableSectionEditor
});

export type { EditableSectionProps };
export { EditableSection };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test web/src/components/shared/test/EditableSection.test.tsx`
Expected: All 7 tests PASS

- [ ] **Step 5: Write Storybook stories**

```tsx
// web/src/components/shared/EditableSection.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditableField } from './EditableField.js';
import { EditableSection } from './EditableSection.js';
import { EditableSectionProvider } from './EditableSectionContext.js';

const meta = {
  component: EditableSection,
  decorators: [
    Story => (
      <EditableSectionProvider>
        <div className="max-w-xl">
          <Story />
        </div>
      </EditableSectionProvider>
    )
  ],
  args: {
    sectionId: 'demo',
    isDirty: false,
    isSaving: false,
    onSave: () => {},
    onDiscard: () => {}
  }
} satisfies Meta<typeof EditableSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const displayContent = (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">First Name</p>
        <p className="text-sm">Sylvain</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last Name</p>
        <p className="text-sm">Estevez</p>
      </div>
    </div>
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</p>
      <p className="text-sm">sylvain@example.com</p>
    </div>
  </div>
);

const editorContent = (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <EditableField type="text" label="First Name" value="Sylvain" onChange={() => {}} required />
      <EditableField type="text" label="Last Name" value="Estevez" onChange={() => {}} required />
    </div>
    <EditableField type="text" label="Email" value="sylvain@example.com" onChange={() => {}} required />
  </div>
);

export const SectionVariant: Story = {
  args: {
    variant: 'section',
    children: (
      <>
        <EditableSection.Display>{displayContent}</EditableSection.Display>
        <EditableSection.Editor>{editorContent}</EditableSection.Editor>
      </>
    )
  }
};

export const CardVariant: Story = {
  args: {
    variant: 'card',
    children: (
      <>
        <EditableSection.Display>{displayContent}</EditableSection.Display>
        <EditableSection.Editor>{editorContent}</EditableSection.Editor>
      </>
    )
  }
};

export const EditingWithDirty: Story = {
  args: {
    variant: 'section',
    isDirty: true,
    children: (
      <>
        <EditableSection.Display>{displayContent}</EditableSection.Display>
        <EditableSection.Editor>{editorContent}</EditableSection.Editor>
      </>
    )
  }
};

export const MutualExclusion: Story = {
  render: () => (
    <EditableSectionProvider>
      <div className="space-y-4 max-w-xl">
        <p className="text-sm text-muted-foreground">Click a section to edit. Only one can be active at a time.</p>
        <EditableSection sectionId="section-a" onSave={() => {}} onDiscard={() => {}} isDirty={false} isSaving={false} variant="card">
          <EditableSection.Display>
            <p className="font-medium">Section A</p>
            <p className="text-sm text-muted-foreground">Click to edit this section</p>
          </EditableSection.Display>
          <EditableSection.Editor>
            <EditableField type="text" label="Field A" value="Editing A" onChange={() => {}} />
          </EditableSection.Editor>
        </EditableSection>
        <EditableSection sectionId="section-b" onSave={() => {}} onDiscard={() => {}} isDirty={false} isSaving={false} variant="card">
          <EditableSection.Display>
            <p className="font-medium">Section B</p>
            <p className="text-sm text-muted-foreground">Click to edit this section</p>
          </EditableSection.Display>
          <EditableSection.Editor>
            <EditableField type="text" label="Field B" value="Editing B" onChange={() => {}} />
          </EditableSection.Editor>
        </EditableSection>
      </div>
    </EditableSectionProvider>
  )
};
```

- [ ] **Step 6: Run lint + all tests**

Run: `bun run check && bun test web/src/components/shared/`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add web/src/components/shared/EditableSection.tsx web/src/components/shared/EditableSection.stories.tsx web/src/components/shared/test/EditableSection.test.tsx
git commit -m "feat: add EditableSection compound component with display/editor slots"
```

---

## Task 4: ProfileDisplay — Content Display Component

**Files:**
- Create: `web/src/components/resume/profile/ProfileDisplay.tsx`
- Create: `web/src/components/resume/profile/ProfileDisplay.stories.tsx`
- Test: `web/src/components/resume/profile/test/ProfileDisplay.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/resume/profile/test/ProfileDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { ProfileDisplay } from '../ProfileDisplay.js';

const fullProfile = {
  firstName: 'Sylvain',
  lastName: 'Estevez',
  email: 'sylvain@example.com',
  phone: '(555) 123-4567',
  location: 'San Francisco, CA',
  about: 'Full-stack engineer with 8+ years of experience.',
  linkedinUrl: 'https://linkedin.com/in/sylvain',
  githubUrl: 'https://github.com/sylvain',
  websiteUrl: 'https://sylvain.dev'
};

describe('ProfileDisplay', () => {
  test('renders all profile fields as text', () => {
    render(<ProfileDisplay profile={fullProfile} />);

    expect(screen.getByText('Sylvain')).toBeTruthy();
    expect(screen.getByText('Estevez')).toBeTruthy();
    expect(screen.getByText('sylvain@example.com')).toBeTruthy();
    expect(screen.getByText('(555) 123-4567')).toBeTruthy();
    expect(screen.getByText('San Francisco, CA')).toBeTruthy();
    expect(screen.getByText('Full-stack engineer with 8+ years of experience.')).toBeTruthy();
  });

  test('renders links as anchor tags', () => {
    render(<ProfileDisplay profile={fullProfile} />);

    const linkedinLink = screen.getByText('linkedin.com/in/sylvain');
    expect(linkedinLink.tagName).toBe('A');
    expect(linkedinLink.getAttribute('href')).toBe('https://linkedin.com/in/sylvain');
  });

  test('shows "Not set" for empty optional fields', () => {
    render(
      <ProfileDisplay
        profile={{
          firstName: 'Sylvain',
          lastName: 'Estevez',
          email: 'sylvain@example.com',
          phone: null,
          location: null,
          about: null,
          linkedinUrl: null,
          githubUrl: null,
          websiteUrl: null
        }}
      />
    );

    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test web/src/components/resume/profile/test/ProfileDisplay.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ProfileDisplay**

```tsx
// web/src/components/resume/profile/ProfileDisplay.tsx
import { cn } from '@/lib/utils';

interface ProfileDisplayProps {
  readonly profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    about: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
  };
  readonly className?: string;
}

function FieldLabel({ children }: { readonly children: string }) {
  return <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">{children}</p>;
}

function FieldValue({ value }: { readonly value: string | null }) {
  if (!value) return <p className="text-sm text-muted-foreground italic">Not set</p>;
  return <p className="text-sm">{value}</p>;
}

function LinkValue({ url, label }: { readonly url: string | null; readonly label: string }) {
  if (!url) return <FieldValue value={null} />;
  // Strip protocol for display
  const displayUrl = url.replace(/^https?:\/\//, '');
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-primary hover:underline"
      onClick={e => e.stopPropagation()}
    >
      {displayUrl}
    </a>
  );
}

function GroupLabel({ children }: { readonly children: string }) {
  return <p className="text-xs uppercase tracking-[0.04em] text-muted-foreground/70 mb-2.5">{children}</p>;
}

function ProfileDisplay({ profile, className }: ProfileDisplayProps) {
  return (
    <div data-slot="profile-display" className={cn('space-y-0', className)}>
      {/* Identity */}
      <div className="pb-4 mb-4 border-b border-border/50">
        <GroupLabel>Identity</GroupLabel>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FieldLabel>First Name</FieldLabel>
            <FieldValue value={profile.firstName} />
          </div>
          <div>
            <FieldLabel>Last Name</FieldLabel>
            <FieldValue value={profile.lastName} />
          </div>
          <div>
            <FieldLabel>Location</FieldLabel>
            <FieldValue value={profile.location} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="pb-4 mb-4 border-b border-border/50">
        <GroupLabel>Contact</GroupLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Email</FieldLabel>
            <FieldValue value={profile.email} />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <FieldValue value={profile.phone} />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="pb-4 mb-4 border-b border-border/50">
        <GroupLabel>About</GroupLabel>
        {profile.about ? (
          <p className="text-sm leading-relaxed">{profile.about}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not set</p>
        )}
      </div>

      {/* Links */}
      <div>
        <GroupLabel>Links</GroupLabel>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FieldLabel>GitHub</FieldLabel>
            <LinkValue url={profile.githubUrl} label="GitHub" />
          </div>
          <div>
            <FieldLabel>LinkedIn</FieldLabel>
            <LinkValue url={profile.linkedinUrl} label="LinkedIn" />
          </div>
          <div>
            <FieldLabel>Website</FieldLabel>
            <LinkValue url={profile.websiteUrl} label="Website" />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ProfileDisplayProps };
export { ProfileDisplay };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test web/src/components/resume/profile/test/ProfileDisplay.test.tsx`
Expected: All 3 tests PASS

- [ ] **Step 5: Write Storybook story**

```tsx
// web/src/components/resume/profile/ProfileDisplay.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileDisplay } from './ProfileDisplay.js';

const meta = {
  component: ProfileDisplay,
  decorators: [Story => <div className="max-w-xl"><Story /></div>]
} satisfies Meta<typeof ProfileDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullProfile: Story = {
  args: {
    profile: {
      firstName: 'Sylvain',
      lastName: 'Estevez',
      email: 'sylvain@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      about: 'Full-stack engineer with 8+ years of experience building high-performance web applications. Passionate about clean architecture, developer experience, and shipping products that users love.',
      linkedinUrl: 'https://linkedin.com/in/sylvain',
      githubUrl: 'https://github.com/sylvain',
      websiteUrl: 'https://sylvain.dev'
    }
  }
};

export const MinimalProfile: Story = {
  args: {
    profile: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: null,
      location: null,
      about: null,
      linkedinUrl: null,
      githubUrl: null,
      websiteUrl: null
    }
  }
};
```

- [ ] **Step 6: Lint + commit**

Run: `bun run check`

```bash
git add web/src/components/resume/profile/
git commit -m "feat: add ProfileDisplay content component for content-first view"
```

---

## Task 5: HeadlineCardContent Display Component

**Files:**
- Create: `web/src/components/resume/headlines/HeadlineCardContent.tsx`
- Create: `web/src/components/resume/headlines/HeadlineCardContent.stories.tsx`
- Test: `web/src/components/resume/headlines/test/HeadlineCardContent.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/resume/headlines/test/HeadlineCardContent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { HeadlineCardContent } from '../HeadlineCardContent.js';

describe('HeadlineCardContent', () => {
  test('renders label and summary', () => {
    render(<HeadlineCardContent headline={{ id: '1', label: 'Staff Engineer', summaryText: 'Led platform migration to microservices.' }} />);

    expect(screen.getByText('Staff Engineer')).toBeTruthy();
    expect(screen.getByText('Led platform migration to microservices.')).toBeTruthy();
  });

  test('handles empty summary', () => {
    render(<HeadlineCardContent headline={{ id: '2', label: 'Senior Dev', summaryText: '' }} />);

    expect(screen.getByText('Senior Dev')).toBeTruthy();
    // Empty summary should not render a paragraph
    expect(screen.queryByText('Not set')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test web/src/components/resume/headlines/test/HeadlineCardContent.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement HeadlineCardContent**

```tsx
// web/src/components/resume/headlines/HeadlineCardContent.tsx

interface HeadlineCardContentProps {
  readonly headline: {
    id: string;
    label: string;
    summaryText: string;
  };
}

function HeadlineCardContent({ headline }: HeadlineCardContentProps) {
  return (
    <div data-slot="headline-card-content">
      <p className="font-medium text-[15px] tracking-[-0.01em]">{headline.label}</p>
      {headline.summaryText && (
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{headline.summaryText}</p>
      )}
    </div>
  );
}

export type { HeadlineCardContentProps };
export { HeadlineCardContent };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test web/src/components/resume/headlines/test/HeadlineCardContent.test.tsx`
Expected: PASS

- [ ] **Step 5: Write story + commit**

```tsx
// web/src/components/resume/headlines/HeadlineCardContent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeadlineCardContent } from './HeadlineCardContent.js';

const meta = {
  component: HeadlineCardContent,
  decorators: [Story => <div className="max-w-md border rounded-[14px] p-5"><Story /></div>]
} satisfies Meta<typeof HeadlineCardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSummary: Story = {
  args: {
    headline: { id: '1', label: 'Staff Engineer', summaryText: 'Led platform migration to microservices, reducing latency by 40%.' }
  }
};

export const WithoutSummary: Story = {
  args: {
    headline: { id: '2', label: 'Senior Developer', summaryText: '' }
  }
};
```

```bash
git add web/src/components/resume/headlines/HeadlineCardContent.tsx web/src/components/resume/headlines/HeadlineCardContent.stories.tsx web/src/components/resume/headlines/test/
git commit -m "feat: add HeadlineCardContent display component"
```

---

## Task 6: EducationCardContent Display Component

**Files:**
- Create: `web/src/components/resume/education/EducationCardContent.tsx`
- Create: `web/src/components/resume/education/EducationCardContent.stories.tsx`
- Test: `web/src/components/resume/education/test/EducationCardContent.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/resume/education/test/EducationCardContent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'bun:test';
import { EducationCardContent } from '../EducationCardContent.js';

describe('EducationCardContent', () => {
  test('renders all fields', () => {
    render(
      <EducationCardContent
        education={{ id: '1', degreeTitle: 'B.S. Computer Science', institutionName: 'Stanford University', graduationYear: 2018, location: 'Stanford, CA', honors: 'Magna Cum Laude', ordinal: 0 }}
      />
    );

    expect(screen.getByText('B.S. Computer Science')).toBeTruthy();
    expect(screen.getByText(/Stanford University/)).toBeTruthy();
    expect(screen.getByText(/2018/)).toBeTruthy();
    expect(screen.getByText('Magna Cum Laude')).toBeTruthy();
  });

  test('handles missing optional fields', () => {
    render(
      <EducationCardContent
        education={{ id: '2', degreeTitle: 'M.S. Math', institutionName: 'MIT', graduationYear: 2020, location: null, honors: null, ordinal: 0 }}
      />
    );

    expect(screen.getByText('M.S. Math')).toBeTruthy();
    expect(screen.getByText(/MIT/)).toBeTruthy();
    expect(screen.queryByText('Magna Cum Laude')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test web/src/components/resume/education/test/EducationCardContent.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement EducationCardContent**

```tsx
// web/src/components/resume/education/EducationCardContent.tsx
import type { Education } from '@/hooks/use-educations';

interface EducationCardContentProps {
  readonly education: Education;
}

function EducationCardContent({ education }: EducationCardContentProps) {
  return (
    <div data-slot="education-card-content">
      <p className="font-medium text-[15px] tracking-[-0.01em]">{education.degreeTitle}</p>
      <p className="text-sm text-muted-foreground mt-0.5">
        {education.institutionName} &middot; {education.graduationYear}
        {education.location && <span> &middot; {education.location}</span>}
      </p>
      {education.honors && <p className="text-sm text-muted-foreground/80 italic mt-1">{education.honors}</p>}
    </div>
  );
}

export type { EducationCardContentProps };
export { EducationCardContent };
```

- [ ] **Step 4: Run test, write story, commit**

Run: `bun test web/src/components/resume/education/test/EducationCardContent.test.tsx`
Expected: PASS

```tsx
// web/src/components/resume/education/EducationCardContent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EducationCardContent } from './EducationCardContent.js';

const meta = {
  component: EducationCardContent,
  decorators: [Story => <div className="max-w-md border rounded-[14px] p-5"><Story /></div>]
} satisfies Meta<typeof EducationCardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    education: { id: '1', degreeTitle: 'B.S. Computer Science', institutionName: 'Stanford University', graduationYear: 2018, location: 'Stanford, CA', honors: 'Magna Cum Laude', ordinal: 0 }
  }
};

export const Minimal: Story = {
  args: {
    education: { id: '2', degreeTitle: 'M.S. Mathematics', institutionName: 'MIT', graduationYear: 2020, location: null, honors: null, ordinal: 0 }
  }
};
```

```bash
git add web/src/components/resume/education/EducationCardContent.tsx web/src/components/resume/education/EducationCardContent.stories.tsx web/src/components/resume/education/test/
git commit -m "feat: add EducationCardContent display component"
```

---

## Task 7: Refactor Profile Page

**Files:**
- Modify: `web/src/routes/profile/index.tsx`

- [ ] **Step 1: Refactor ProfileForm to use EditableSection**

Replace the always-editable form with `EditableSectionProvider` + `EditableSection` wrapping `ProfileDisplay` and the existing form fields:

```tsx
// web/src/routes/profile/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { ProfileDisplay } from '@/components/resume/profile/ProfileDisplay.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { useNavGuard } from '@/hooks/use-nav-guard.js';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { hasErrors, type ProfileFormState, type ValidationErrors, validateProfile } from '@/lib/validation.js';

export const Route = createFileRoute('/profile/')({
  component: ProfilePage
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="max-w-xl">
          <LoadingSkeleton variant="form" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState message="No profile found." />
      </div>
    );
  }

  return <ProfileForm profile={profile} />;
}

function PageHeader() {
  return (
    <div>
      <h1 className="page-heading">Profile</h1>
      <p className="text-muted-foreground text-sm">Your professional identity.</p>
    </div>
  );
}

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  about: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

function ProfileForm({ profile }: { readonly profile: ProfileData }) {
  const updateProfile = useUpdateProfile();
  const [errors, setErrors] = useState<ValidationErrors<ProfileFormState>>({});

  const savedState = useMemo<ProfileFormState>(
    () => ({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      githubUrl: profile.githubUrl ?? '',
      websiteUrl: profile.websiteUrl ?? '',
      about: profile.about ?? ''
    }),
    [
      profile.firstName, profile.lastName, profile.email, profile.phone,
      profile.location, profile.linkedinUrl, profile.githubUrl,
      profile.websiteUrl, profile.about
    ]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  useNavGuard({ isDirty });

  function handleSave() {
    const validationErrors = validateProfile(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    updateProfile.mutate(
      {
        email: current.email.trim(),
        first_name: current.firstName.trim(),
        last_name: current.lastName.trim(),
        about: current.about.trim() || null,
        phone: current.phone.trim() || null,
        location: current.location.trim() || null,
        linkedin_url: current.linkedinUrl.trim() || null,
        github_url: current.githubUrl.trim() || null,
        website_url: current.websiteUrl.trim() || null
      },
      {
        onSuccess: () => {
          setErrors({});
          toast.success('Changes saved');
        },
        onError: () => toast.error('Failed to save. Please try again.')
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <EditableSectionProvider>
        <div className="max-w-xl">
          <EditableSection
            sectionId="profile"
            onSave={handleSave}
            onDiscard={reset}
            isDirty={isDirty}
            isSaving={updateProfile.isPending}
          >
            <EditableSection.Display>
              <ProfileDisplay profile={profile} />
            </EditableSection.Display>

            <EditableSection.Editor>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    type="text" label="First Name" required
                    value={current.firstName}
                    onChange={v => setField('firstName', v)}
                    isDirty={isDirtyField('firstName')}
                    error={errors.firstName}
                    disabled={updateProfile.isPending}
                  />
                  <EditableField
                    type="text" label="Last Name" required
                    value={current.lastName}
                    onChange={v => setField('lastName', v)}
                    isDirty={isDirtyField('lastName')}
                    error={errors.lastName}
                    disabled={updateProfile.isPending}
                  />
                </div>
                <EditableField
                  type="text" label="Email" required
                  value={current.email}
                  onChange={v => setField('email', v)}
                  isDirty={isDirtyField('email')}
                  error={errors.email}
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text" label="Phone"
                  value={current.phone}
                  onChange={v => setField('phone', v)}
                  isDirty={isDirtyField('phone')}
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text" label="Location"
                  value={current.location}
                  onChange={v => setField('location', v)}
                  isDirty={isDirtyField('location')}
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text" label="LinkedIn"
                  value={current.linkedinUrl}
                  onChange={v => setField('linkedinUrl', v)}
                  isDirty={isDirtyField('linkedinUrl')}
                  placeholder="https://linkedin.com/in/..."
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text" label="GitHub"
                  value={current.githubUrl}
                  onChange={v => setField('githubUrl', v)}
                  isDirty={isDirtyField('githubUrl')}
                  placeholder="https://github.com/..."
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text" label="Website"
                  value={current.websiteUrl}
                  onChange={v => setField('websiteUrl', v)}
                  isDirty={isDirtyField('websiteUrl')}
                  placeholder="https://..."
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="textarea" label="About"
                  value={current.about}
                  onChange={v => setField('about', v)}
                  isDirty={isDirtyField('about')}
                  rows={5}
                  placeholder="A narrative description of your professional identity..."
                  disabled={updateProfile.isPending}
                />
              </div>
            </EditableSection.Editor>
          </EditableSection>
        </div>
      </EditableSectionProvider>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck + lint**

Run: `bun run typecheck && bun run check`
Expected: PASS

- [ ] **Step 3: Visual verification**

Run: `bun dev:up` (or `bun wt:up` in worktree)
Navigate to `/profile`. Verify:
1. Profile displays as content (not form fields)
2. Hover shows warm amber wash
3. Click transforms to editor with all form fields
4. Save works and returns to display
5. Discard works and returns to display
6. Escape closes when clean

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/profile/index.tsx
git commit -m "refactor: profile page to content-first click-to-edit pattern"
```

---

## Task 8: Refactor Headlines Page

**Files:**
- Modify: `web/src/routes/headlines/index.tsx`
- Modify: `web/src/components/resume/headlines/HeadlineList.tsx`

- [ ] **Step 1: Refactor HeadlinesPage route to use EditableSectionProvider**

```tsx
// web/src/routes/headlines/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { HeadlineList } from '@/components/resume/headlines/HeadlineList';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';

export const Route = createFileRoute('/headlines/')({
  component: HeadlinesPage
});

function HeadlinesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Headlines</h1>
        <p className="text-muted-foreground text-sm">Manage your headlines.</p>
      </div>
      <EditableSectionProvider>
        <HeadlineList />
      </EditableSectionProvider>
    </div>
  );
}
```

Note: Removes `useAggregateDirtyRegistry` and `useNavGuard` from the route. Nav guarding will be handled differently — the `EditableSection`'s inline save/discard pattern means the user always explicitly saves or discards before navigating. If we want a nav guard, we can add `useNavGuard` in the `HeadlineList` component later.

- [ ] **Step 2: Refactor HeadlineList to use EditableSection for each card**

Replace the always-editable `HeadlineCard` with `EditableSection` using `HeadlineCardContent` as display and existing form fields as editor. Remove `onDirtyChange` prop entirely.

The full refactored `HeadlineList.tsx` replaces the inline `HeadlineCard` component with an `EditableSection variant="card"` for each headline. The create flow (the `adding` state with inline fields) stays as-is.

Key changes:
- Remove `HeadlineCard` internal component
- Each headline renders as `<EditableSection variant="card" sectionId={headline-${h.id}}>` with `HeadlineCardContent` in the Display slot
- Editor slot contains the existing `EditableField` for label and summary, plus the delete button
- `useDirtyTracking` and validation move inside an inline component or are managed per-headline
- Remove `onDirtyChange` prop from `HeadlineList` and `HeadlineCard`

- [ ] **Step 3: Run typecheck + lint**

Run: `bun run typecheck && bun run check`
Expected: PASS

- [ ] **Step 4: Visual verification**

Navigate to `/headlines`. Verify:
1. Headlines display as content cards (label + summary text)
2. Hover shows amber wash on each card
3. Click expands card to show form fields inline
4. Only one card can be expanded at a time
5. Save/Discard work
6. Create new headline still works
7. Delete still works

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/headlines/index.tsx web/src/components/resume/headlines/HeadlineList.tsx
git commit -m "refactor: headlines page to content-first click-to-edit pattern"
```

---

## Task 9: Refactor Education Page

**Files:**
- Modify: `web/src/routes/education/index.tsx`
- Modify: `web/src/components/resume/education/EducationList.tsx`

- [ ] **Step 1: Refactor EducationPage route**

Same pattern as headlines — wrap in `EditableSectionProvider`, remove `useAggregateDirtyRegistry` and `useNavGuard`:

```tsx
// web/src/routes/education/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { EducationList } from '@/components/resume/education/EducationList';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';

export const Route = createFileRoute('/education/')({
  component: EducationPage
});

function EducationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Education</h1>
        <p className="text-muted-foreground text-sm">Manage your education history.</p>
      </div>
      <EditableSectionProvider>
        <EducationList />
      </EditableSectionProvider>
    </div>
  );
}
```

- [ ] **Step 2: Refactor EducationList to use EditableSection**

Same pattern as HeadlineList refactor:
- Replace inline `EducationCard` with `EditableSection variant="card"` using `EducationCardContent` as display
- Editor slot has existing form fields
- Remove `onDirtyChange` prop
- Keep `CreateEducationModal` as-is (modal for creates is correct per spec)

- [ ] **Step 3: Run typecheck + lint**

Run: `bun run typecheck && bun run check`
Expected: PASS

- [ ] **Step 4: Visual verification**

Navigate to `/education`. Same verification as headlines.

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/education/index.tsx web/src/components/resume/education/EducationList.tsx
git commit -m "refactor: education page to content-first click-to-edit pattern"
```

---

## Note: Companies Inline Edit Deferred

The spec calls for Companies to use inline expand editing, but `use-companies.ts` currently only has `useCompanies()` (list) and `useCreateCompany()`. There is no `useUpdateCompany()` hook or corresponding API endpoint. Implementing Company inline edit requires backend work (API endpoint + mutation hook) which is out of scope for this UI pattern plan. The hover treatment is applied now; inline edit can be added once the update API exists.

---

## Task 10: Experience & Company Hover Treatment

**Files:**
- Modify: `web/src/components/resume/experience/ExperienceCard.tsx`
- Modify: `web/src/components/companies/CompanyCard.tsx`

- [ ] **Step 1: Update ExperienceCard hover class**

In `web/src/components/resume/experience/ExperienceCard.tsx`, change `hover:bg-muted/30` to `hover:bg-accent/40`:

```tsx
// Line ~33: change hover class
className="group w-full text-left border rounded-[14px] p-4 cursor-pointer transition-colors hover:bg-accent/40"
```

- [ ] **Step 2: Update CompanyCard hover class**

In `web/src/components/companies/CompanyCard.tsx`, change `hover:bg-muted/30` to `hover:bg-accent/40`:

```tsx
// Line ~19: change hover class
className="group w-full text-left border rounded-[14px] p-4 cursor-pointer transition-colors hover:bg-accent/40"
```

- [ ] **Step 3: Run lint + commit**

Run: `bun run check`

```bash
git add web/src/components/resume/experience/ExperienceCard.tsx web/src/components/companies/CompanyCard.tsx
git commit -m "style: update hover treatment to warm amber wash for content-first consistency"
```

---

## Task 11: Update Design System Documentation

**Files:**
- Modify: `web/design/design-system.md`
- Modify: `web/design/ux-guidelines.md`
- Modify: `web/CLAUDE.md`

- [ ] **Step 1: Update design-system.md**

Add a new section after "Component Patterns" in `web/design/design-system.md`:

```markdown
### Content-First Editable Sections

All editable data renders as plain content by default. Form inputs only appear when the user clicks to edit.

- **Resting state:** Standard card/section appearance. Content displayed as text with label/value pairs.
- **Hover affordance:** `bg-accent/40` warm amber background wash, `cursor-pointer`, `transition-colors duration-200`.
- **Editing state:** Border shifts to amber (`border-primary/50`). Form fields replace content. Inline Save/Discard buttons at section bottom.
- **Empty fields:** Render as "Not set" in `text-muted-foreground italic`.
```

- [ ] **Step 2: Rewrite ux-guidelines.md Section 1**

Replace the "Always-Editable Fields" and "Aggregate-Scoped Save" subsections with:

```markdown
### Content-First Click-to-Edit

All data fields render as plain text by default. The user clicks a section to enter edit mode.

- Section hover shows a warm amber background wash (`bg-accent/40`) with pointer cursor
- Click transforms the section into an editor with form fields
- Each section has its own inline **Save** (primary) and **Discard** (ghost) buttons
- Only one section can be in edit mode at a time (mutual exclusion via `EditableSectionProvider`)
- Clicking another section while one is editing prompts save/discard of the current section
- Escape key discards changes (if clean) or does nothing (if dirty — user must explicitly save or discard)
- Save button shows spinner during mutation, both buttons disabled

### Edit Granularity

Edit sections are scoped to the domain aggregate boundary:
- **Profile page:** One section for the entire Profile aggregate
- **List pages:** Each list item (headline, education, company) is its own editable section
- **Complex entities (Experiences):** Click opens a modal instead of inline expand

### Inline Expand for Lists

Simple-entity list items (Headlines, Education, Companies) expand in-place when clicked:
- Card displays content in resting state
- Click expands card to reveal form fields with Save/Discard
- Only one card can be expanded at a time within a list

### Modal Forms (Complex Entities)

Experiences (with nested Accomplishments) use modal forms. The card is content-first with the same hover treatment, but click opens `ExperienceFormModal` instead of inline expand.

The `FormModal` shared component continues to handle:
- Create flows for any entity type
- Edit flows for complex entities (Experiences)
```

- [ ] **Step 3: Update web/CLAUDE.md key visual rules**

In the "Design System & UX Guidelines" section, change:

```markdown
- **Always-editable fields** — no edit mode toggles or pencil icons
- **Aggregate-scoped save** — sticky SaveBar appears when fields are dirty
```

to:

```markdown
- **Content-first click-to-edit** — data displays as plain text, click to enter edit mode
- **Inline save/discard per section** — each editing section has its own Save/Discard buttons
- **One section editable at a time** — mutual exclusion via `EditableSectionProvider`
```

- [ ] **Step 4: Commit**

```bash
git add web/design/design-system.md web/design/ux-guidelines.md web/CLAUDE.md
git commit -m "docs: update design system and UX guidelines for content-first editing pattern"
```

---

## Task 12: Page Composition Stories

**Files:**
- Create: `web/src/components/resume/experience/ExperienceCardContent.stories.tsx`
- Create: `web/src/components/companies/CompanyCardContent.stories.tsx`

These are lightweight stories for the existing content-first cards (ExperienceCard and CompanyCard already display content — they just need isolated stories showing their content display).

- [ ] **Step 1: ExperienceCard content story**

```tsx
// web/src/components/resume/experience/ExperienceCardContent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExperienceCard } from './ExperienceCard.js';

const meta = {
  component: ExperienceCard,
  decorators: [Story => <div className="max-w-md"><Story /></div>]
} satisfies Meta<typeof ExperienceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    experience: {
      id: '1',
      title: 'Senior Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      location: 'San Francisco, CA',
      startDate: '2022-01',
      endDate: '2024-03',
      summary: 'Led the migration of the billing system to microservices.',
      ordinal: 0,
      accomplishments: [
        { id: 'a1', title: 'Reduced latency by 40%', narrative: '', ordinal: 0 },
        { id: 'a2', title: 'Mentored 3 junior engineers', narrative: '', ordinal: 1 }
      ]
    },
    onEdit: () => {}
  }
};

export const Minimal: Story = {
  args: {
    experience: {
      id: '2',
      title: 'Junior Developer',
      companyName: 'StartupCo',
      companyWebsite: null,
      location: 'Remote',
      startDate: '2020-06',
      endDate: '2021-12',
      summary: null,
      ordinal: 0,
      accomplishments: []
    },
    onEdit: () => {}
  }
};
```

- [ ] **Step 2: CompanyCard content story**

```tsx
// web/src/components/companies/CompanyCardContent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompanyCard } from './CompanyCard.js';

const meta = {
  component: CompanyCard,
  decorators: [Story => <div className="max-w-md"><Story /></div>]
} satisfies Meta<typeof CompanyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    company: {
      id: '1',
      name: 'Acme Corp',
      website: 'https://acme.com',
      logoUrl: null,
      linkedinLink: 'https://linkedin.com/company/acme',
      businessType: 'b2b',
      industry: 'saas',
      stage: 'series_b'
    },
    onClick: () => {}
  }
};

export const Minimal: Story = {
  args: {
    company: {
      id: '2',
      name: 'Tiny Startup',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    },
    onClick: () => {}
  }
};
```

- [ ] **Step 3: Lint + commit**

Run: `bun run check`

```bash
git add web/src/components/resume/experience/ExperienceCardContent.stories.tsx web/src/components/companies/CompanyCardContent.stories.tsx
git commit -m "feat: add Storybook stories for ExperienceCard and CompanyCard content display"
```

---

## Task 13: Final Verification

- [ ] **Step 1: Run all quality checks**

Run each individually: `bun run typecheck`, `bun run check`, `bun run dep:check`, `bun run knip`, `bun run test:coverage`
Expected: all PASS

- [ ] **Step 2: Run Storybook and verify all stories**

Run: `bun --cwd web storybook`
Check all new stories render correctly in all states.

- [ ] **Step 3: Regenerate diagrams**

Run: `bun run domain:diagram`
(db:diagram only if DB is running)

- [ ] **Step 4: Check git status**

Run: `git status`
Resolve any remaining unstaged/untracked files.

- [ ] **Step 5: Final commit if needed**

Commit any diagram changes or leftover files.
