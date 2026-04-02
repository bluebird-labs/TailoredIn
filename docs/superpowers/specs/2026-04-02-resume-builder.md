# Spec: Resume Builder Page — Standalone Generation

**Date:** 2026-04-02
**Status:** Draft

## Problem

Resume generation currently requires a job (`PUT /jobs/:id/generate-resume`). Users should be able to assemble and generate a resume by directly picking content — no job or archetype required.

## Design

### New Page: `/resume/builder`

A resume-style preview page where you cherry-pick content and generate a PDF. The layout mirrors the experience page redesign — left side reads like the actual resume output, right side has selection controls.

```
┌──────────────────────────────────────────┬───────────────┐
│ Resume Preview (left)                    │ Controls      │
│                                          │ (right)       │
│ ┌─ Headline ──────────────────────────┐  │               │
│ │ "Experienced engineering leader..." │  │ [Headline ▾]  │
│ └─────────────────────────────────────┘  │               │
│                                          │ Template      │
│ ── Professional Experience ──────────    │ [IC ▾]        │
│                                          │               │
│ ☑ Staff Software Engineer                │ Keywords      │
│   Stealth Startup · Sep 2024–Nov 2024   │ [          ]  │
│   • Diagnosed N+1 query bottleneck...   │               │
│   • Designed event-driven architecture  │               │
│                                          │ ─────────     │
│ ☑ Tech Lead Manager                     │               │
│   Volvo Cars · Mar 2020–Apr 2023        │ [Generate]    │
│   • Built cross-functional team of 8    │               │
│   • Architected booking platform        │               │
│                                          │               │
│ ☐ Senior Software Engineer (hidden)     │               │
│                                          │               │
│ ── Education ────────────────────────    │               │
│ ☑ B.S. Computer Science                 │               │
│                                          │               │
│ ── Skills ───────────────────────────    │               │
│ ☑ Backend: Node.js, TypeScript, Go      │               │
│ ☑ DevOps: Docker, Kubernetes, Terraform │               │
│ ☐ Frontend (hidden)                     │               │
└──────────────────────────────────────────┴───────────────┘
```

### Left Panel — Resume Preview

Renders selected content in resume-style layout (same typography as experience page):

- **Headline** — italic summary text at the top (from selected headline)
- **Professional Experience** — each selected experience shows title, company, dates, and selected bullet variants. Unchecked experiences are dimmed/collapsed.
- **Education** — selected entries show degree, institution, year
- **Skills** — selected categories with their items

Checkboxes are inline on the left side — check/uncheck an experience and the preview updates immediately. Each experience is expandable to pick specific bullet variants (same inline expand pattern from the experience page).

### Right Panel — Controls

Compact control panel:

- **Headline picker** — dropdown of all headlines
- **Template style** — IC / Architect / Executive dropdown
- **Keywords** — optional text input (comma-separated)
- **Generate Resume** button — downloads PDF

### Interactions

| Action | Behavior |
|---|---|
| Check/uncheck experience | Toggles in preview, updates immediately |
| Expand experience | Shows bullet variants with checkboxes |
| Check/uncheck bullet variant | Toggles in preview |
| Check/uncheck education | Toggles in preview |
| Check/uncheck skill category | Toggles in preview |
| Change headline | Preview updates |
| Change template style | Visual indicator only (actual layout is in the PDF) |
| Click Generate | Sends selections to API, downloads PDF |

## Backend

### Rename

`GenerateResume` → `GenerateResumeFromJob` — the existing job-linked use case keeps working, just renamed for clarity.

Update all references: route, DI token, container binding, imports.

### New Use Case: `GenerateResume`

```typescript
type GenerateResumeInput = {
  headlineId: string;
  experienceSelections: { experienceId: string; bulletVariantIds: string[] }[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  templateStyle: TemplateStyle;
  keywords?: string[];
};
```

- Loads profile
- Calls `ResumeContentFactory.makeFromSelection()` with the inline content selection
- Calls `ResumeRenderer.render()` with `companyName: 'Generic'`, the chosen template style
- Returns PDF path

No job, no archetype, no LLM, no color extraction. Default color `#0395DE`.

### New Port Method: `ResumeContentFactory.makeFromSelection()`

The existing `make()` takes an `archetypeId` and looks up the content selection internally. Add a second method that accepts the selection directly:

```typescript
makeFromSelection(input: {
  profileId: string;
  headlineId: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  awesomeColor: string;
  keywords: string[];
}): Promise<ResumeContentDto>;
```

The existing `make()` becomes a thin wrapper: load archetype → extract content selection → call `makeFromSelection()`.

### New Route: `POST /resumes/generate`

```
POST /resumes/generate
Body: {
  headline_id: string,
  experience_selections: [{ experience_id: string, bullet_variant_ids: string[] }],
  education_ids: string[],
  skill_category_ids: string[],
  skill_item_ids: string[],
  template_style: "ic" | "architect" | "executive",
  keywords?: string[]
}
Response: PDF blob (application/pdf)
```

## Files to Modify

| File | Change |
|---|---|
| `application/src/use-cases/GenerateResume.ts` | **Rename** to `GenerateResumeFromJob.ts`, rename class |
| `application/src/use-cases/GenerateResume.ts` | **New** — standalone use case |
| `application/src/ports/ResumeContentFactory.ts` | Add `makeFromSelection()` |
| `infrastructure/src/services/DatabaseResumeContentFactory.ts` | Implement `makeFromSelection()`, refactor `make()` to delegate |
| `api/src/routes/GenerateResumeRoute.ts` | **Rename** to `GenerateResumeFromJobRoute.ts` |
| `api/src/routes/GenerateResumeBuilderRoute.ts` | **New** — `POST /resumes/generate` |
| `api/src/index.ts` | Wire new route |
| `infrastructure/src/DI.ts` | Add new DI token |
| `api/src/container.ts` | Bind new use case |
| `web/src/routes/resume/builder.tsx` | **New** — builder page with resume preview + controls |
| `web/src/components/sidebar.tsx` (or equivalent) | Add "Resume Builder" nav link |
| All imports referencing `GenerateResume` | Update to `GenerateResumeFromJob` |

## What's NOT Changing

- Job-linked generation (`PUT /jobs/:id/generate-resume`) keeps working — just renamed internally
- Content factory core logic — `makeFromSelection` reuses the same variant resolution code
- Renderer, template layouts, Typst generation — all reused
- Domain model — no new entities
