# Experience Page Inline Editing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Experience detail page's modal-based editing with inline click-to-edit sections for details, summary, skills, and accomplishments.

**Architecture:** Rewrite `/experiences/$experienceId` route to use `EditableSectionProvider` with multiple `EditableSection` cards — same pattern as Education. Add three new accomplishment mutation hooks. Update E2E tests to match new inline interaction.

**Tech Stack:** React 19, TanStack Query, EditableSection/EditableField (existing), SkillPicker (existing), Playwright E2E

---

### Task 1: Add accomplishment mutation hooks

The current `use-experiences.ts` only has `useUpdateExperience` which bundles accomplishments atomically. The inline editing pattern needs individual accomplishment CRUD hooks that call the dedicated API endpoints.

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/hooks/use-experiences.ts`

- [ ] **Step 1: Add `useAddAccomplishment` hook**

Add after the existing `useDeleteExperience` hook (line 135):

```typescript
export function useAddAccomplishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { experienceId: string; title: string; narrative: string; ordinal: number }) => {
      const { experienceId, ...body } = input;
      const segment = api.experiences as EdenRouteSegment;
      const { data, error } = await segment({ id: experienceId }).accomplishments.post(body);
      if (error) throw new Error(extractApiError(error, 'Could not add accomplishment'));
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
```

- [ ] **Step 2: Add `useUpdateAccomplishment` hook**

```typescript
export function useUpdateAccomplishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      experienceId: string;
      accomplishmentId: string;
      title?: string;
      narrative?: string;
      ordinal?: number;
    }) => {
      const { experienceId, accomplishmentId, ...body } = input;
      const segment = api.experiences as EdenRouteSegment;
      const { error } = await segment({ id: experienceId }).accomplishments({ accomplishmentId }).put(body);
      if (error) throw new Error(extractApiError(error, 'Could not update accomplishment'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
```

- [ ] **Step 3: Add `useDeleteAccomplishment` hook**

```typescript
export function useDeleteAccomplishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { experienceId: string; accomplishmentId: string }) => {
      const segment = api.experiences as EdenRouteSegment;
      const { error } = await segment({ id: input.experienceId }).accomplishments({ accomplishmentId: input.accomplishmentId }).delete();
      if (error) throw new Error(extractApiError(error, 'Could not delete accomplishment'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.all });
    }
  });
}
```

**Note on Eden Treaty paths:** The chaining syntax for nested route params (e.g., `segment({ id }).accomplishments({ accomplishmentId }).put(body)`) follows the pattern used by other hooks in this file (see `useLinkCompany` at line 141). If the Eden Treaty types don't match at compile time, inspect how the accomplishment routes are mounted in `api/src/index.ts` and adjust the chaining accordingly. The API endpoints are confirmed to exist — only the client-side chaining syntax may need tweaking.

- [ ] **Step 4: Verify types compile**

Run: `bun run typecheck`
Expected: PASS (no type errors). If Eden Treaty path types fail, adjust the chaining in steps 2-3 to match the app's route tree.

- [ ] **Step 5: Commit**

```bash
git add web/src/hooks/use-experiences.ts
git commit -m "feat: add individual accomplishment mutation hooks"
```

---

### Task 2: Create ExperienceDetailsEditor component

Inline-editable card for the experience detail fields (title, company name, website, location, start/end dates, bullet min/max). Uses `EditableSection` with `variant="card"` and `useDirtyTracking`.

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/ExperienceDetailsEditor.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type Experience, useUpdateExperience } from '@/hooks/use-experiences';
import {
  type ExperienceFormState,
  type ValidationErrors,
  hasErrors,
  validateExperience
} from '@/lib/validation.js';

interface ExperienceDetailsEditorProps {
  readonly experience: Experience;
}

function ExperienceDetailsEditor({ experience }: ExperienceDetailsEditorProps) {
  const update = useUpdateExperience();
  const [errors, setErrors] = useState<ValidationErrors<ExperienceFormState>>({});

  const savedState: ExperienceFormState = useMemo(
    () => ({
      title: experience.title,
      companyName: experience.companyName,
      companyWebsite: experience.companyWebsite ?? '',
      companyAccent: experience.companyAccent ?? '',
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      summary: experience.summary ?? '',
      bulletMin: experience.bulletMin,
      bulletMax: experience.bulletMax
    }),
    [
      experience.title,
      experience.companyName,
      experience.companyWebsite,
      experience.companyAccent,
      experience.location,
      experience.startDate,
      experience.endDate,
      experience.summary,
      experience.bulletMin,
      experience.bulletMax
    ]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    const validationErrors = validateExperience(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    update.mutate(
      {
        id: experience.id,
        title: current.title.trim(),
        company_name: current.companyName.trim(),
        company_website: current.companyWebsite.trim() || undefined,
        company_accent: current.companyAccent.trim() || undefined,
        location: current.location.trim(),
        start_date: current.startDate.trim(),
        end_date: current.endDate.trim(),
        summary: experience.summary ?? undefined,
        ordinal: experience.ordinal,
        accomplishments: experience.accomplishments.map(a => ({
          id: a.id,
          title: a.title,
          narrative: a.narrative,
          ordinal: a.ordinal
        })),
        bullet_min: current.bulletMin,
        bullet_max: current.bulletMax
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
    <EditableSection
      variant="card"
      sectionId="experience-details"
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={update.isPending}
    >
      <EditableSection.Display>
        <InfoCard label="Details">
          <InfoRow label="Title" value={experience.title} />
          <InfoRow label="Company" value={experience.companyName} />
          {experience.companyWebsite && (
            <InfoRow label="Website" value={experience.companyWebsite} href={experience.companyWebsite} />
          )}
          <InfoRow label="Location" value={experience.location} />
          <InfoRow label="Start Date" value={experience.startDate} />
          <InfoRow label="End Date" value={experience.endDate} />
          <InfoRow label="Bullet Min" value={String(experience.bulletMin)} />
          <InfoRow label="Bullet Max" value={String(experience.bulletMax)} />
        </InfoCard>
      </EditableSection.Display>
      <EditableSection.Editor>
        <div className="space-y-3">
          <EditableField
            type="text"
            label="Title"
            required
            value={current.title}
            onChange={v => setField('title', v)}
            isDirty={isDirtyField('title')}
            error={errors.title}
            disabled={update.isPending}
          />
          <EditableField
            type="text"
            label="Company"
            required
            value={current.companyName}
            onChange={v => setField('companyName', v)}
            isDirty={isDirtyField('companyName')}
            error={errors.companyName}
            disabled={update.isPending}
          />
          <EditableField
            type="text"
            label="Website"
            value={current.companyWebsite}
            onChange={v => setField('companyWebsite', v)}
            isDirty={isDirtyField('companyWebsite')}
            disabled={update.isPending}
            placeholder="e.g. https://acme.com"
          />
          <EditableField
            type="text"
            label="Location"
            required
            value={current.location}
            onChange={v => setField('location', v)}
            isDirty={isDirtyField('location')}
            error={errors.location}
            disabled={update.isPending}
          />
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              type="text"
              label="Start Date"
              required
              value={current.startDate}
              onChange={v => setField('startDate', v)}
              isDirty={isDirtyField('startDate')}
              error={errors.startDate}
              disabled={update.isPending}
            />
            <EditableField
              type="text"
              label="End Date"
              required
              value={current.endDate}
              onChange={v => setField('endDate', v)}
              isDirty={isDirtyField('endDate')}
              error={errors.endDate}
              disabled={update.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              type="number"
              label="Bullet Min"
              value={String(current.bulletMin)}
              onChange={v => setField('bulletMin', Number(v) || 0)}
              isDirty={isDirtyField('bulletMin')}
              error={errors.bulletMin}
              disabled={update.isPending}
            />
            <EditableField
              type="number"
              label="Bullet Max"
              value={String(current.bulletMax)}
              onChange={v => setField('bulletMax', Number(v) || 0)}
              isDirty={isDirtyField('bulletMax')}
              error={errors.bulletMax}
              disabled={update.isPending}
            />
          </div>
        </div>
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { ExperienceDetailsEditor };
```

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/experience/ExperienceDetailsEditor.tsx
git commit -m "feat: add ExperienceDetailsEditor inline component"
```

---

### Task 3: Create ExperienceSummaryEditor component

Inline-editable card for the summary textarea. Saves via the same `useUpdateExperience` hook, passing all current field values unchanged except summary.

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/ExperienceSummaryEditor.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { InfoCard } from '@/components/shared/InfoCard.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type Experience, useUpdateExperience } from '@/hooks/use-experiences';

interface ExperienceSummaryEditorProps {
  readonly experience: Experience;
}

function ExperienceSummaryEditor({ experience }: ExperienceSummaryEditorProps) {
  const update = useUpdateExperience();

  const savedState = useMemo(
    () => ({ summary: experience.summary ?? '' }),
    [experience.summary]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    update.mutate(
      {
        id: experience.id,
        title: experience.title,
        company_name: experience.companyName,
        company_website: experience.companyWebsite ?? undefined,
        company_accent: experience.companyAccent ?? undefined,
        location: experience.location,
        start_date: experience.startDate,
        end_date: experience.endDate,
        summary: current.summary.trim() || undefined,
        ordinal: experience.ordinal,
        accomplishments: experience.accomplishments.map(a => ({
          id: a.id,
          title: a.title,
          narrative: a.narrative,
          ordinal: a.ordinal
        })),
        bullet_min: experience.bulletMin,
        bullet_max: experience.bulletMax
      },
      {
        onSuccess: () => toast.success('Changes saved'),
        onError: () => toast.error('Failed to save. Please try again.')
      }
    );
  }

  return (
    <EditableSection
      variant="card"
      sectionId="experience-summary"
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={update.isPending}
    >
      <EditableSection.Display>
        <InfoCard label="Summary">
          {experience.summary ? (
            <p className="text-[14px] leading-relaxed tracking-[0.01em]">{experience.summary}</p>
          ) : (
            <p className="text-[14px] italic text-muted-foreground">No summary</p>
          )}
        </InfoCard>
      </EditableSection.Display>
      <EditableSection.Editor>
        <EditableField
          type="textarea"
          label="Summary"
          value={current.summary}
          onChange={v => setField('summary', v)}
          isDirty={isDirtyField('summary')}
          disabled={update.isPending}
          rows={5}
          placeholder="Describe this role..."
        />
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { ExperienceSummaryEditor };
```

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/experience/ExperienceSummaryEditor.tsx
git commit -m "feat: add ExperienceSummaryEditor inline component"
```

---

### Task 4: Create ExperienceSkillsEditor component

Inline-editable card for skills in the sidebar. Uses `SkillPicker` in edit mode and `SkillChip` in display mode. Tracks local skill list state and syncs via `useSyncExperienceSkills` on save.

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/ExperienceSkillsEditor.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { InfoCard } from '@/components/shared/InfoCard.js';
import { SkillChip } from '@/components/skill-picker/SkillChip.js';
import { SkillPicker } from '@/components/skill-picker/SkillPicker.js';
import type { Experience, ExperienceSkill } from '@/hooks/use-experiences';
import { type Skill, useSyncExperienceSkills } from '@/hooks/use-skills';

interface ExperienceSkillsEditorProps {
  readonly experience: Experience;
}

function ExperienceSkillsEditor({ experience }: ExperienceSkillsEditorProps) {
  const syncSkills = useSyncExperienceSkills();

  // Local skill state for edit mode — initialized from experience.skills
  const initialSkills: Skill[] = useMemo(
    () => experience.skills.map(es => es.skill),
    [experience.skills]
  );

  const [localSkills, setLocalSkills] = useState<Skill[]>(initialSkills);

  // Re-sync local state when experience data changes (after save + query invalidation)
  const savedSkillIds = useMemo(
    () => experience.skills.map(es => es.skillId).sort().join(','),
    [experience.skills]
  );

  useEffect(() => {
    setLocalSkills(experience.skills.map(es => es.skill));
  }, [savedSkillIds]);

  const localSkillIds = localSkills.map(s => s.id).sort().join(',');
  const isDirty = localSkillIds !== savedSkillIds;

  function handleSave() {
    syncSkills.mutate(
      {
        experienceId: experience.id,
        skillIds: localSkills.map(s => s.id)
      },
      {
        onSuccess: () => toast.success('Skills updated'),
        onError: () => toast.error('Failed to update skills. Please try again.')
      }
    );
  }

  const handleDiscard = useCallback(() => {
    setLocalSkills(experience.skills.map(es => es.skill));
  }, [experience.skills]);

  return (
    <EditableSection
      variant="card"
      sectionId="experience-skills"
      onSave={handleSave}
      onDiscard={handleDiscard}
      isDirty={isDirty}
      isSaving={syncSkills.isPending}
    >
      <EditableSection.Display>
        <InfoCard label="Skills">
          {experience.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {experience.skills.map(es => (
                <SkillChip key={es.id} label={es.skill.label} />
              ))}
            </div>
          ) : (
            <p className="text-[14px] italic text-muted-foreground">No skills tagged</p>
          )}
        </InfoCard>
      </EditableSection.Display>
      <EditableSection.Editor>
        <SkillPicker
          selectedSkills={localSkills}
          onAdd={skill => setLocalSkills(prev => [...prev, skill])}
          onRemove={skillId => setLocalSkills(prev => prev.filter(s => s.id !== skillId))}
          disabled={syncSkills.isPending}
        />
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { ExperienceSkillsEditor };
```

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/experience/ExperienceSkillsEditor.tsx
git commit -m "feat: add ExperienceSkillsEditor inline component"
```

---

### Task 5: Create AccomplishmentCard component

Inline-editable card for a single accomplishment. Click to expand into title + narrative editor. Delete button with `ConfirmDialog`. Uses individual `useUpdateAccomplishment` and `useDeleteAccomplishment` hooks.

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/AccomplishmentCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { Button } from '@/components/ui/button';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import {
  type AccomplishmentDto,
  useDeleteAccomplishment,
  useUpdateAccomplishment
} from '@/hooks/use-experiences';
import {
  type AccomplishmentFormState,
  type ValidationErrors,
  hasErrors,
  validateAccomplishment
} from '@/lib/validation.js';

interface AccomplishmentCardProps {
  readonly experienceId: string;
  readonly accomplishment: AccomplishmentDto;
  readonly index: number;
}

function AccomplishmentCard({ experienceId, accomplishment, index }: AccomplishmentCardProps) {
  const updateMutation = useUpdateAccomplishment();
  const deleteMutation = useDeleteAccomplishment();
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});

  const savedState: AccomplishmentFormState = useMemo(
    () => ({
      title: accomplishment.title,
      narrative: accomplishment.narrative
    }),
    [accomplishment.title, accomplishment.narrative]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    const validationErrors = validateAccomplishment(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    updateMutation.mutate(
      {
        experienceId,
        accomplishmentId: accomplishment.id,
        title: current.title.trim(),
        narrative: current.narrative.trim()
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

  function handleDelete() {
    deleteMutation.mutate(
      { experienceId, accomplishmentId: accomplishment.id },
      {
        onSuccess: () => toast.success('Accomplishment deleted'),
        onError: () => toast.error('Failed to delete. Please try again.')
      }
    );
  }

  return (
    <EditableSection
      variant="card"
      sectionId={`accomplishment-${accomplishment.id}`}
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={updateMutation.isPending}
    >
      <EditableSection.Display>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-[12px] text-muted-foreground">#{index + 1}</span>
          <div className="flex-1">
            <h3 className="text-[15px] font-medium">{accomplishment.title}</h3>
            {accomplishment.narrative && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                {accomplishment.narrative}
              </p>
            )}
          </div>
        </div>
      </EditableSection.Display>
      <EditableSection.Editor>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-3">
              <EditableField
                type="text"
                label="Title"
                required
                value={current.title}
                onChange={v => setField('title', v)}
                isDirty={isDirtyField('title')}
                error={errors.title}
                disabled={updateMutation.isPending}
              />
              <EditableField
                type="textarea"
                label="Narrative"
                value={current.narrative}
                onChange={v => setField('narrative', v)}
                isDirty={isDirtyField('narrative')}
                disabled={updateMutation.isPending}
                rows={4}
              />
            </div>
            <ConfirmDialog
              title="Delete accomplishment?"
              description="This accomplishment will be permanently removed."
              onConfirm={handleDelete}
              trigger={
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </Button>
              }
            />
          </div>
        </div>
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { AccomplishmentCard };
```

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/experience/AccomplishmentCard.tsx
git commit -m "feat: add AccomplishmentCard inline component"
```

---

### Task 6: Create CreateAccomplishmentModal component

Modal for creating a new accomplishment (triggered by the "Add accomplishment" button). Uses `FormModal` pattern matching `CreateEducationModal` from `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/education/EducationList.tsx:198-309`.

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/CreateAccomplishmentModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { useAddAccomplishment } from '@/hooks/use-experiences';
import {
  type AccomplishmentFormState,
  type ValidationErrors,
  hasErrors,
  validateAccomplishment
} from '@/lib/validation.js';

const EMPTY_ACCOMPLISHMENT: AccomplishmentFormState = {
  title: '',
  narrative: ''
};

interface CreateAccomplishmentModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly experienceId: string;
  readonly accomplishmentCount: number;
}

function CreateAccomplishmentModal({
  open,
  onOpenChange,
  experienceId,
  accomplishmentCount
}: CreateAccomplishmentModalProps) {
  const addAccomplishment = useAddAccomplishment();
  const { current, setField, isDirtyField, dirtyCount, reset } = useDirtyTracking(EMPTY_ACCOMPLISHMENT);
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});

  function handleSave() {
    const validationErrors = validateAccomplishment(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    addAccomplishment.mutate(
      {
        experienceId,
        title: current.title.trim(),
        narrative: current.narrative.trim(),
        ordinal: accomplishmentCount
      },
      {
        onSuccess: () => {
          setErrors({});
          reset();
          onOpenChange(false);
          toast.success('Accomplishment added');
        },
        onError: () => toast.error('Failed to add accomplishment')
      }
    );
  }

  function handleDiscard() {
    reset();
    setErrors({});
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Accomplishment"
      description="Add a new accomplishment to this experience."
      dirtyCount={dirtyCount}
      isSaving={addAccomplishment.isPending}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      <EditableField
        type="text"
        label="Title"
        required
        value={current.title}
        onChange={v => setField('title', v)}
        isDirty={isDirtyField('title')}
        error={errors.title}
        placeholder="Accomplishment title"
      />
      <EditableField
        type="textarea"
        label="Narrative"
        value={current.narrative}
        onChange={v => setField('narrative', v)}
        isDirty={isDirtyField('narrative')}
        placeholder="Describe what you did"
        rows={4}
      />
    </FormModal>
  );
}

export { CreateAccomplishmentModal };
```

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/experience/CreateAccomplishmentModal.tsx
git commit -m "feat: add CreateAccomplishmentModal component"
```

---

### Task 7: Rewrite the Experience detail route

Replace the modal-based page with `EditableSectionProvider` + the new inline editor components. Two-column grid: left (Details + Summary), right sidebar (Linked Company + Skills). Accomplishments tab uses `AccomplishmentCard` list with "Add" button at top.

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/routes/experiences/$experienceId.tsx`

- [ ] **Step 1: Rewrite the route file**

Replace the entire file content with:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { formatEnumLabel } from '@/components/companies/company-options.js';
import { AccomplishmentCard } from '@/components/resume/experience/AccomplishmentCard.js';
import { CreateAccomplishmentModal } from '@/components/resume/experience/CreateAccomplishmentModal.js';
import { ExperienceDetailsEditor } from '@/components/resume/experience/ExperienceDetailsEditor.js';
import { ExperienceSkillsEditor } from '@/components/resume/experience/ExperienceSkillsEditor.js';
import { ExperienceSummaryEditor } from '@/components/resume/experience/ExperienceSummaryEditor.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperience } from '@/hooks/use-experiences';

export const Route = createFileRoute('/experiences/$experienceId')({
  component: ExperienceDetailPage
});

function ExperienceDetailPage() {
  const { experienceId } = Route.useParams();
  const { data: experience, isLoading } = useExperience(experienceId);
  const [addModalOpen, setAddModalOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!experience) return <EmptyState message="Experience not found." />;

  const initial = experience.companyName.charAt(0).toUpperCase();
  const industryLabel = experience.company ? formatEnumLabel('industry', experience.company.industry) : null;
  const stageLabel = experience.company ? formatEnumLabel('stage', experience.company.stage) : null;
  const accomplishmentCount = experience.accomplishments.length;

  return (
    <EditableSectionProvider>
      <div className="space-y-5">
        <Breadcrumb parentLabel="Profile" parentTo="/profile" current={experience.title} />

        <DetailPageHeader
          logo={
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
              {experience.company?.logoUrl ? (
                <img
                  src={experience.company.logoUrl}
                  alt={experience.companyName}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                initial
              )}
            </div>
          }
          title={experience.title}
          meta={
            <>
              {experience.company ? (
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: experience.company.id }}
                  className="text-[13px] text-primary hover:underline"
                >
                  {experience.companyName}
                </Link>
              ) : (
                <MetaText>{experience.companyName}</MetaText>
              )}
              {experience.location && (
                <>
                  <MetaDot />
                  <MetaText>{experience.location}</MetaText>
                </>
              )}
              <MetaDot />
              <MetaText>
                {experience.startDate} – {experience.endDate}
              </MetaText>
            </>
          }
        />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accomplishments">
              Accomplishments
              {accomplishmentCount > 0 && (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
                  {accomplishmentCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="mt-4 grid grid-cols-[1fr_280px] gap-5">
              <div className="space-y-5">
                <ExperienceDetailsEditor experience={experience} />
                <ExperienceSummaryEditor experience={experience} />
              </div>

              <div className="space-y-5">
                {experience.company && (
                  <InfoCard label="Company">
                    <LinkedEntityCard
                      to={`/companies/${experience.company.id}`}
                      logoUrl={experience.company.logoUrl}
                      logoInitial={experience.company.name.charAt(0).toUpperCase()}
                      name={experience.company.name}
                      meta={
                        [industryLabel, stageLabel].filter(Boolean).join(' · ') ||
                        experience.company.website ||
                        'No details'
                      }
                    />
                  </InfoCard>
                )}
                <ExperienceSkillsEditor experience={experience} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accomplishments">
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add accomplishment
              </Button>

              {accomplishmentCount === 0 ? (
                <EmptyState message="No accomplishments yet." />
              ) : (
                experience.accomplishments.map((accomplishment, index) => (
                  <AccomplishmentCard
                    key={accomplishment.id}
                    experienceId={experience.id}
                    accomplishment={accomplishment}
                    index={index}
                  />
                ))
              )}
            </div>

            <CreateAccomplishmentModal
              open={addModalOpen}
              onOpenChange={setAddModalOpen}
              experienceId={experience.id}
              accomplishmentCount={accomplishmentCount}
            />
          </TabsContent>
        </Tabs>
      </div>
    </EditableSectionProvider>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Run lint/format check**

Run: `bun run check`
Expected: PASS (may need `bun run check:fix` for formatting)

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/experiences/\$experienceId.tsx
git commit -m "feat: rewrite experience detail page with inline editing"
```

---

### Task 8: Update UX guidelines

The UX guidelines currently state "Complex entities (Experiences): Click opens a modal instead of inline expand." This is no longer true.

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/design/ux-guidelines.md`

- [ ] **Step 1: Update the guideline**

Find the line that mentions "Complex entities (Experiences): Click opens a modal instead of inline expand" (or similar) and update it to reflect that Experiences now use inline editing via `EditableSection`, same as Education. The detail page uses `EditableSectionProvider` for mutual exclusion across Details, Summary, Skills, and Accomplishment sections.

- [ ] **Step 2: Commit**

```bash
git add web/design/ux-guidelines.md
git commit -m "docs: update UX guidelines for experience inline editing"
```

---

### Task 9: Run quality checks and verify dead code

Check that the old modal-only components (`AccomplishmentListEditor`, `AccomplishmentEditor`) are unused and can be cleaned up. Run `knip` to detect dead exports.

**Files:**
- Potentially delete: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/AccomplishmentListEditor.tsx`
- Potentially delete: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/web/src/components/resume/experience/AccomplishmentEditor.tsx`

**Important:** Do NOT delete `ExperienceFormModal.tsx` — it is still used in `ExperienceList.tsx` for create mode.

- [ ] **Step 1: Check for remaining imports of AccomplishmentListEditor and AccomplishmentEditor**

Run: `grep -r "AccomplishmentListEditor\|AccomplishmentEditor" web/src/`

If only imported by `ExperienceFormModal.tsx` (which still uses them for the create flow's accomplishment section), leave them. If `ExperienceFormModal.tsx` no longer needs them (because create mode doesn't include accomplishments), delete them.

- [ ] **Step 2: Run knip**

Run: `bun run knip`
Expected: No new unused exports introduced by our changes. Fix any issues found.

- [ ] **Step 3: Run full quality suite**

Run: `bun run typecheck && bun run check && bun run dep:check`
Expected: All PASS

- [ ] **Step 4: Commit any cleanup**

```bash
git add -A
git commit -m "chore: clean up dead code from experience modal refactor"
```

---

### Task 10: Update E2E tests

The existing E2E tests at `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/e2e/tests/experiences.spec.ts` and `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/e2e/tests/accomplishments.spec.ts` test the old modal-based flow. They need to be rewritten to test the inline editing interaction.

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/e2e/tests/experiences.spec.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/.claude/worktrees/curious-foraging-wombat/e2e/tests/accomplishments.spec.ts`

- [ ] **Step 1: Rewrite `experiences.spec.ts`**

Key changes:
- `test('edit experience via modal')` → rewrite to test inline Details section: navigate to detail page, click Details card, edit title field, click Save, verify toast + updated heading.
- `test('discard unsaved modal changes')` → rewrite to test inline discard: click Details card, edit a field, click Discard, verify field reverts.
- `test('validation: empty required fields')` → this test creates via modal from the list page, which still uses `ExperienceFormModal`. Keep as-is since create flow is unchanged.
- Remove references to `page.getByRole('button', { name: 'Edit' })` and `page.getByRole('dialog')` in edit tests — the detail page no longer has an Edit button or modal.

The edit test should look like:
```typescript
test('edit experience details inline', async ({ page }) => {
  await page.getByText('ScratchCorp').first().click();
  await page.waitForURL(/\/experiences\/.+/);

  // Click the Details section to enter edit mode
  const detailsSection = page.getByTestId('editable-section-experience-details');
  await detailsSection.click();

  // Edit the title
  const titleInput = detailsSection.getByLabel('Title');
  await titleInput.clear();
  await titleInput.fill('Senior QA Analyst');

  // Save
  await detailsSection.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Changes saved')).toBeVisible();
});
```

- [ ] **Step 2: Rewrite `accomplishments.spec.ts`**

Key changes:
- Replace `openAcmeCorpModal()` helper with a helper that navigates to the detail page and clicks the Accomplishments tab.
- Accomplishment edit tests: click an accomplishment card to enter edit mode, edit fields, save via the card's inline Save button.
- Add accomplishment: click the "Add accomplishment" button at the top, fill in the modal, save.
- Delete accomplishment: click an accomplishment card to edit, click trash icon, confirm via dialog.
- Remove all references to `page.getByRole('dialog')` for edit actions — accomplishment editing is now inline, not in a modal. The create modal is still a dialog.

- [ ] **Step 3: Run E2E tests**

Run: `bun e2e:test`
Expected: All tests pass. If any fail, debug and fix.

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/experiences.spec.ts e2e/tests/accomplishments.spec.ts
git commit -m "test: update E2E tests for inline experience editing"
```

---

### Task 11: Manual verification and final checks

Start the dev server and verify all interactions work end-to-end in a browser.

- [ ] **Step 1: Start worktree dev server**

Run: `bun wt:up`

- [ ] **Step 2: Verify Overview tab**

1. Navigate to an experience detail page
2. Click the Details card → verify fields appear in edit mode
3. Edit the title, save → verify toast + header updates
4. Click Summary card → verify textarea appears
5. Edit summary, discard → verify reverts
6. Click Skills section → verify SkillPicker appears
7. Add a skill, remove a skill, save → verify chips update
8. Verify mutual exclusion: click Details while Skills is open → should be blocked

- [ ] **Step 3: Verify Accomplishments tab**

1. Click Accomplishments tab
2. Click "Add accomplishment" button at top → verify modal opens
3. Fill in title + narrative, save → verify new card appears
4. Click an accomplishment card → verify title + narrative fields appear
5. Edit narrative, save → verify toast
6. Click an accomplishment, click trash icon → verify confirmation dialog → confirm → verify card removed

- [ ] **Step 4: Run full quality suite**

Run: `bun run typecheck && bun run check && bun run knip && bun run dep:check`
Expected: All PASS

- [ ] **Step 5: Run all tests**

Run: `bun run test && bun run --cwd infrastructure test:integration && bun e2e:test`
Expected: All PASS

- [ ] **Step 6: Regenerate diagrams**

Run: `bun run diags`
(No diagram changes expected since we didn't modify domain/application/infrastructure layers, but run to be safe.)

- [ ] **Step 7: Final commit if any cleanup needed**

```bash
git status
# Commit any remaining changes
```
