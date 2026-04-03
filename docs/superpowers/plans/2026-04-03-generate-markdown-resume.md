# Generate Markdown Resume — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generate Markdown" button to the resume builder that produces a downloadable `.md` file matching the PDF content.

**Architecture:** A pure `formatResumeAsMarkdown` function in the application layer converts `ResumeContentDto` to markdown. A new `GenerateResumeMarkdown` use case reuses `ResumeContentFactory` for content assembly. A new API route returns the markdown as `text/markdown`. The web UI adds a secondary button next to "Generate PDF".

**Tech Stack:** TypeScript, Bun, Elysia, React, TanStack Router, needle-di

**Spec:** `docs/superpowers/specs/2026-04-03-generate-markdown-resume-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `application/src/services/formatResumeAsMarkdown.ts` | Pure function: `ResumeContentDto → string` |
| Create | `application/test/services/formatResumeAsMarkdown.test.ts` | Unit tests for the formatter |
| Create | `application/src/use-cases/GenerateResumeMarkdown.ts` | Use case: assemble content + format as markdown |
| Create | `api/src/routes/GenerateResumeMarkdownRoute.ts` | `POST /resumes/generate-markdown` |
| Modify | `application/src/use-cases/index.ts` | Export `GenerateResumeMarkdown` |
| Modify | `infrastructure/src/DI.ts` | Add `DI.Resume.GenerateResumeMarkdown` token |
| Modify | `api/src/container.ts` | Bind `GenerateResumeMarkdown` |
| Modify | `api/src/index.ts` | Register route |
| Modify | `web/src/components/resume/builder/VersionTabs.tsx` | Add button + prop |
| Modify | `web/src/routes/resume/builder.tsx` | Add handler + state |

---

## Task 1: `formatResumeAsMarkdown` — Tests

**Files:**
- Create: `application/test/services/formatResumeAsMarkdown.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, expect, it } from 'bun:test';
import type { ResumeContentDto } from '../../src/dtos/ResumeContentDto.js';
import { formatResumeAsMarkdown } from '../../src/services/formatResumeAsMarkdown.js';

const content: ResumeContentDto = {
  personal: {
    first_name: 'Jane',
    last_name: 'Doe',
    github: 'janedoe',
    linkedin: 'janedoe',
    email: 'jane@example.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    header_quote: 'Full-Stack Engineer'
  },
  keywords: ['TypeScript', 'React'],
  experience: [
    {
      title: 'Senior Engineer',
      society: 'Acme Corp',
      date: 'Jan 2023 – Present',
      location: 'Remote',
      summary: 'Led platform team.',
      highlights: ['Built the API gateway.', 'Reduced latency by 40%.']
    },
    {
      title: 'Engineer',
      society: 'StartupCo',
      date: 'Mar 2020 – Dec 2022',
      location: 'NYC',
      summary: '',
      highlights: ['Shipped v2 launch.']
    }
  ],
  skills: [
    { type: 'Languages', info: 'TypeScript, Python, Go' },
    { type: 'Frameworks', info: 'React, Node.js' }
  ],
  education: [
    {
      title: 'B.S. Computer Science',
      society: 'UC Berkeley',
      date: '2016 – 2020',
      location: 'Berkeley, CA'
    }
  ]
};

describe('formatResumeAsMarkdown', () => {
  const md = formatResumeAsMarkdown(content);

  it('starts with the full name as H1', () => {
    expect(md).toStartWith('# Jane Doe\n');
  });

  it('includes the header quote as a blockquote', () => {
    expect(md).toContain('> Full-Stack Engineer');
  });

  it('includes contact info line with middle-dot separators', () => {
    expect(md).toContain('San Francisco, CA');
    expect(md).toContain('jane@example.com');
    expect(md).toContain('(555) 123-4567');
    expect(md).toContain('[GitHub](https://github.com/janedoe)');
    expect(md).toContain('[LinkedIn](https://linkedin.com/in/janedoe)');
    expect(md).toContain(' · ');
  });

  it('includes experience section with titles and companies', () => {
    expect(md).toContain('## Experience');
    expect(md).toContain('### Senior Engineer — Acme Corp');
    expect(md).toContain('*Jan 2023 – Present · Remote*');
    expect(md).toContain('Led platform team.');
    expect(md).toContain('- Built the API gateway.');
    expect(md).toContain('- Reduced latency by 40%.');
  });

  it('omits empty summaries', () => {
    const engineerSection = md.split('### Engineer — StartupCo')[1]!.split('###')[0]!;
    const lines = engineerSection.split('\n').filter(l => l.trim() !== '' && !l.startsWith('*') && !l.startsWith('-'));
    expect(lines).toHaveLength(0);
  });

  it('includes skills section with bold category names', () => {
    expect(md).toContain('## Skills');
    expect(md).toContain('**Languages:** TypeScript, Python, Go');
    expect(md).toContain('**Frameworks:** React, Node.js');
  });

  it('includes education section', () => {
    expect(md).toContain('## Education');
    expect(md).toContain('### B.S. Computer Science — UC Berkeley');
    expect(md).toContain('*2016 – 2020 · Berkeley, CA*');
  });

  it('separates major sections with horizontal rules', () => {
    expect(md).toContain('---\n\n## Experience');
    expect(md).toContain('---\n\n## Skills');
    expect(md).toContain('---\n\n## Education');
  });

  it('omits sections with no entries', () => {
    const empty: ResumeContentDto = {
      personal: content.personal,
      keywords: [],
      experience: [],
      skills: [],
      education: []
    };
    const result = formatResumeAsMarkdown(empty);
    expect(result).not.toContain('## Experience');
    expect(result).not.toContain('## Skills');
    expect(result).not.toContain('## Education');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test application/test/services/formatResumeAsMarkdown.test.ts`
Expected: FAIL — module not found

---

## Task 2: `formatResumeAsMarkdown` — Implementation

**Files:**
- Create: `application/src/services/formatResumeAsMarkdown.ts`

- [ ] **Step 1: Write the formatter**

```typescript
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export function formatResumeAsMarkdown(content: ResumeContentDto): string {
  const lines: string[] = [];
  const { personal, experience, skills, education } = content;

  // Header
  lines.push(`# ${personal.first_name} ${personal.last_name}`);
  lines.push('');

  if (personal.header_quote) {
    lines.push(`> ${personal.header_quote}`);
    lines.push('');
  }

  // Contact line
  const contact = [
    personal.location,
    personal.email,
    personal.phone,
    `[GitHub](https://github.com/${personal.github})`,
    `[LinkedIn](https://linkedin.com/in/${personal.linkedin})`
  ].filter(Boolean);
  lines.push(contact.join(' · '));
  lines.push('');

  // Experience
  if (experience.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Experience');
    lines.push('');

    for (const exp of experience) {
      lines.push(`### ${exp.title} — ${exp.society}`);
      lines.push(`*${exp.date} · ${exp.location}*`);
      lines.push('');

      if (exp.summary) {
        lines.push(exp.summary);
        lines.push('');
      }

      for (const h of exp.highlights) {
        lines.push(`- ${h}`);
      }
      lines.push('');
    }
  }

  // Skills
  if (skills.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Skills');
    lines.push('');

    for (const skill of skills) {
      lines.push(`**${skill.type}:** ${skill.info}`);
    }
    lines.push('');
  }

  // Education
  if (education.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Education');
    lines.push('');

    for (const edu of education) {
      lines.push(`### ${edu.title} — ${edu.society}`);
      lines.push(`*${edu.date} · ${edu.location}*`);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}
```

- [ ] **Step 2: Run the tests**

Run: `bun test application/test/services/formatResumeAsMarkdown.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add application/src/services/formatResumeAsMarkdown.ts application/test/services/formatResumeAsMarkdown.test.ts
git commit -m "feat: add formatResumeAsMarkdown pure function with tests"
```

---

## Task 3: `GenerateResumeMarkdown` Use Case

**Files:**
- Create: `application/src/use-cases/GenerateResumeMarkdown.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Create the use case**

```typescript
import { ok, type ProfileRepository, type Result } from '@tailoredin/domain';
import type { GenerateResumeDto } from '../dtos/GenerateResumeDto.js';
import type { ResumeContentFactory } from '../ports/ResumeContentFactory.js';
import { formatResumeAsMarkdown } from '../services/formatResumeAsMarkdown.js';

export type GenerateResumeMarkdownOutput = {
  markdown: string;
};

export class GenerateResumeMarkdown {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly resumeContentFactory: ResumeContentFactory
  ) {}

  public async execute(input: GenerateResumeDto): Promise<Result<GenerateResumeMarkdownOutput, Error>> {
    const profile = await this.profileRepository.findSingle();

    const content = await this.resumeContentFactory.makeFromSelection({
      profileId: profile.id.value,
      headlineText: input.headlineText,
      experienceSelections: input.experienceSelections,
      educationIds: input.educationIds,
      skillCategoryIds: input.skillCategoryIds,
      skillItemIds: input.skillItemIds,
      keywords: input.keywords ?? []
    });

    const markdown = formatResumeAsMarkdown(content);

    return ok({ markdown });
  }
}
```

- [ ] **Step 2: Export from the use-cases barrel**

Add to `application/src/use-cases/index.ts`:

```typescript
export type { GenerateResumeMarkdownOutput } from './GenerateResumeMarkdown.js';
export { GenerateResumeMarkdown } from './GenerateResumeMarkdown.js';
```

- [ ] **Step 3: Commit**

```bash
git add application/src/use-cases/GenerateResumeMarkdown.ts application/src/use-cases/index.ts
git commit -m "feat: add GenerateResumeMarkdown use case"
```

---

## Task 4: DI Token + Container Wiring

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `api/src/container.ts`

- [ ] **Step 1: Add DI token**

In `infrastructure/src/DI.ts`, add inside the `Resume` object (after the `GenerateResumeFromJob` line):

```typescript
GenerateResumeMarkdown: new InjectionToken<GenerateResumeMarkdown>('DI.Resume.GenerateResumeMarkdown'),
```

And add `GenerateResumeMarkdown` to the import from `@tailoredin/application`:

```typescript
import type {
  // ... existing imports ...
  GenerateResumeMarkdown,
  // ...
} from '@tailoredin/application';
```

- [ ] **Step 2: Bind in container**

In `api/src/container.ts`, add `GenerateResumeMarkdown` to the import from `@tailoredin/application`:

```typescript
import {
  // ... existing imports ...
  GenerateResumeMarkdown,
  // ...
} from '@tailoredin/application';
```

Add the binding after the existing `DI.Resume.GenerateResumeFromJob` binding (around line 196):

```typescript
container.bind({
  provide: DI.Resume.GenerateResumeMarkdown,
  useFactory: () =>
    new GenerateResumeMarkdown(
      container.get(DI.Profile.Repository),
      container.get(DI.Resume.ContentFactory)
    )
});
```

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/DI.ts api/src/container.ts
git commit -m "feat: wire GenerateResumeMarkdown into DI container"
```

---

## Task 5: API Route

**Files:**
- Create: `api/src/routes/GenerateResumeMarkdownRoute.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create the route**

```typescript
import { inject, injectable } from '@needle-di/core';
import type { GenerateResumeMarkdown } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GenerateResumeMarkdownRoute {
  public constructor(
    private readonly generateResumeMarkdown: GenerateResumeMarkdown = inject(DI.Resume.GenerateResumeMarkdown)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/resumes/generate-markdown',
      async ({ body, set }) => {
        const result = await this.generateResumeMarkdown.execute({
          headlineText: body.headline_text,
          experienceSelections: body.experience_selections.map(s => ({
            experienceId: s.experience_id,
            bulletIds: s.bullet_ids
          })),
          educationIds: body.education_ids,
          skillCategoryIds: body.skill_category_ids,
          skillItemIds: body.skill_item_ids,
          keywords: body.keywords
        });

        if (!result.isOk) {
          set.status = 400;
          return { error: { code: 'GENERATION_FAILED', message: result.error.message } };
        }

        set.headers['content-type'] = 'text/markdown; charset=utf-8';
        set.headers['content-disposition'] = 'attachment; filename="resume.md"';
        return result.value.markdown;
      },
      {
        body: t.Object({
          headline_text: t.String(),
          experience_selections: t.Array(
            t.Object({
              experience_id: t.String({ format: 'uuid' }),
              bullet_ids: t.Array(t.String({ format: 'uuid' }))
            })
          ),
          education_ids: t.Array(t.String({ format: 'uuid' })),
          skill_category_ids: t.Array(t.String({ format: 'uuid' })),
          skill_item_ids: t.Array(t.String({ format: 'uuid' })),
          keywords: t.Optional(t.Array(t.String()))
        })
      }
    );
  }
}
```

- [ ] **Step 2: Register in api/src/index.ts**

Add the import at the top:

```typescript
import { GenerateResumeMarkdownRoute } from './routes/GenerateResumeMarkdownRoute.js';
```

Add the `.use()` call after the existing `PreviewResumeRoute` registration (around line 90):

```typescript
.use(container.get(GenerateResumeMarkdownRoute).plugin())
```

- [ ] **Step 3: Commit**

```bash
git add api/src/routes/GenerateResumeMarkdownRoute.ts api/src/index.ts
git commit -m "feat: add POST /resumes/generate-markdown API route"
```

---

## Task 6: Web UI — "Generate Markdown" Button

**Files:**
- Modify: `web/src/components/resume/builder/VersionTabs.tsx`
- Modify: `web/src/routes/resume/builder.tsx`

- [ ] **Step 1: Add props and button to VersionTabs**

In `web/src/components/resume/builder/VersionTabs.tsx`:

Add `FileText` to the lucide-react import:

```typescript
import { Copy, Download, FileText, Loader2, Plus, Wand2, X } from 'lucide-react';
```

Add new props to `VersionTabsProps`:

```typescript
type VersionTabsProps = {
  archetypes: Archetype[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: (mode: 'blank' | 'duplicate') => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  generating: boolean;
  onGenerate: () => void;
  generatingMarkdown: boolean;
  onGenerateMarkdown: () => void;
  onSuggest: () => void;
};
```

Update the function destructuring:

```typescript
export function VersionTabs({
  archetypes,
  activeId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  generating,
  onGenerate,
  generatingMarkdown,
  onGenerateMarkdown,
  onSuggest
}: VersionTabsProps) {
```

Add the "Generate Markdown" button between the "Tailor to Job" button and the "Generate PDF" button. Replace the existing `{/* Generate PDF button */}` section with:

```tsx
        {/* Generate Markdown button */}
        <button
          type="button"
          disabled={generatingMarkdown}
          onClick={onGenerateMarkdown}
          className="px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-border text-foreground hover:bg-muted transition-colors"
        >
          {generatingMarkdown ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Markdown
            </>
          )}
        </button>

        {/* Generate PDF button */}
        <button
          type="button"
          disabled={generating}
          onClick={onGenerate}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${activeColor.btnBg} ${activeColor.btnText}`}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate PDF
            </>
          )}
        </button>
```

- [ ] **Step 2: Add handler in builder.tsx**

In `web/src/routes/resume/builder.tsx`:

Add a `generatingMarkdown` state next to the existing `generating` state (line 127):

```typescript
const [generatingMarkdown, setGeneratingMarkdown] = useState(false);
```

Add `handleGenerateMarkdown` after the existing `handleGenerate` function (after line 330):

```typescript
  const handleGenerateMarkdown = async () => {
    const headlineText = activeArchetype?.headlineText ?? '';

    const experienceSelections = [];
    for (const [expId, bulletIds] of visibleBulletIds) {
      if (bulletIds.size > 0) {
        experienceSelections.push({
          experience_id: expId,
          bullet_ids: [...bulletIds]
        });
      }
    }

    const body = {
      headline_text: headlineText,
      experience_selections: experienceSelections,
      education_ids: [...visibleEducationIds],
      skill_category_ids: activeArchetype?.contentSelection.skillCategoryIds ?? [],
      skill_item_ids: activeArchetype?.contentSelection.skillItemIds ?? [],
      keywords: []
    };

    setGeneratingMarkdown(true);
    try {
      const response = await fetch('/api/resumes/generate-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message ?? 'Generation failed');
      }

      const text = await response.text();
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.md';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Markdown resume downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneratingMarkdown(false);
    }
  };
```

Pass the new props to `VersionTabs`:

```tsx
<VersionTabs
  archetypes={archetypes}
  activeId={activeArchetypeId}
  onSwitch={setActiveArchetypeId}
  onCreate={handleCreate}
  onRename={handleRename}
  onDelete={handleDelete}
  generating={generating}
  onGenerate={handleGenerate}
  generatingMarkdown={generatingMarkdown}
  onGenerateMarkdown={handleGenerateMarkdown}
  onSuggest={() => setSuggestModalOpen(true)}
/>
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/builder/VersionTabs.tsx web/src/routes/resume/builder.tsx
git commit -m "feat: add Generate Markdown button to resume builder UI"
```

---

## Task 7: Verification

- [ ] **Step 1: Run unit tests**

```bash
bun test application/test/services/formatResumeAsMarkdown.test.ts
```

Expected: All tests PASS

- [ ] **Step 2: Run lint/format**

```bash
bun run check
```

Expected: No errors. If there are formatting issues, run `bun run check:fix` and amend.

- [ ] **Step 3: Run typechecks**

```bash
bun run --cwd application typecheck && bun run --cwd infrastructure typecheck && bun run --cwd api typecheck && bun run --cwd web typecheck
```

Expected: No type errors

- [ ] **Step 4: Manual E2E test**

```bash
bun run dev
```

1. Open `http://localhost:5173/resume/builder`
2. Click "Generate Markdown" — should download a `resume.md` file
3. Open the file — verify it contains the same content as the PDF preview (name, headline, experiences, skills, education)
4. Click "Generate PDF" — should still work as before

- [ ] **Step 5: Final commit (if any fix-ups needed)**

```bash
git add -A
git commit -m "fix: address lint/type issues from markdown resume feature"
```
