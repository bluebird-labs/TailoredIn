# Spec: Archetype-Specific Resume Templates

**Date:** 2026-04-01
**Status:** Draft

## 1. Problem Statement

TailoredIn currently renders every resume through a single Brilliant CV layout with fixed spacing, section ordering, and density. An IC resume and a VP resume look identical except for content. The goal is to produce visually distinct PDFs for three archetype categories, where layout parameters vary by archetype.

## 2. Design Decision: One Parameterized Template

**Chosen approach:** A single parameterized Typst template that reads layout variables from `metadata.toml` and generated `#set` rules.

**Why not multiple complete template sets?**
- The system already uses Brilliant CV `@preview/brilliant-cv:3.3.0`. The `metadata.toml` has a `[layout]` section with spacing, fonts, and display toggles — this is the intended extension point.
- Maintaining 3 separate `.typ` template files would triple the surface area for drift/bugs.
- For parameters not in TOML (font size, line spacing, margins), inject Typst `#set` rules into `cv.typ` before the `#show` directive.

## 3. Archetype-to-Template Mapping

### 3.1 New Domain Value Object: `TemplateStyle`

Add `domain/src/value-objects/TemplateStyle.ts`:

```typescript
export enum TemplateStyle {
  IC = 'ic',
  ARCHITECT = 'architect',
  EXECUTIVE = 'executive',
}
```

This represents a visual treatment, not a business archetype. The domain should not couple `ArchetypeKey` to visual rendering.

### 3.2 Mapping Logic

Extend `TailoringStrategyService` with `resolveTemplateStyle(archetype: ArchetypeKey): TemplateStyle`:

| ArchetypeKey | TemplateStyle |
|---|---|
| `IC` | `IC` |
| `LEAD_IC` | `IC` |
| `NERD` | `IC` |
| `HAND_ON_MANAGER` | `ARCHITECT` |
| `LEADER_MANAGER` | `EXECUTIVE` |

### 3.3 Why not a `templateKey` field on `Archetype` entity?

Visual treatment is a presentation concern that should be derived from archetype classification, not stored as mutable state. If the user creates a new archetype with key `"staff_platform"`, the system should automatically infer `ARCHITECT` style.

## 4. Layout Specifications

### 4.1 Layout Config Type

Add `infrastructure/src/resume/TemplateLayoutConfig.ts`:

```typescript
export type TemplateLayoutConfig = {
  beforeSectionSkip: string;
  beforeEntrySkip: string;
  beforeEntryDescriptionSkip: string;
  bodyFontSize: string;
  headerFontSize: string;
  lineSpacing: string;
  pageMargin: string;
  sectionOrder: ('professional' | 'skills' | 'education')[];
  maxBulletsPerEntry: number;
  showEntrySummary: boolean;
};
```

### 4.2 Concrete Layouts

**IC (Dense / Technical)**

| Parameter | Value | Rationale |
|---|---|---|
| beforeSectionSkip | `"1pt"` | Maximize density |
| beforeEntrySkip | `"1pt"` | Tight packing |
| beforeEntryDescriptionSkip | `"1pt"` | Bullets tight to header |
| bodyFontSize | `"10pt"` | Readable but compact |
| headerFontSize | `"28pt"` | Standard |
| lineSpacing | `"0.65em"` | Dense |
| pageMargin | `"1.2cm"` | Narrow for content space |
| sectionOrder | professional, skills, education | Experience first |
| maxBulletsPerEntry | 6 | Deep technical detail |
| showEntrySummary | true | Context for each role |

**ARCHITECT (Balanced)**

| Parameter | Value | Rationale |
|---|---|---|
| beforeSectionSkip | `"4pt"` | Moderate breathing room |
| beforeEntrySkip | `"3pt"` | Visible separation |
| beforeEntryDescriptionSkip | `"2pt"` | Slight gap |
| bodyFontSize | `"10.5pt"` | Slightly larger, conveys seniority |
| headerFontSize | `"30pt"` | Slightly larger |
| lineSpacing | `"0.75em"` | Balanced |
| pageMargin | `"1.5cm"` | Standard |
| sectionOrder | professional, skills, education | Experience first |
| maxBulletsPerEntry | 5 | Balance |
| showEntrySummary | true | Context preserved |

**EXECUTIVE (Impact-Oriented)**

| Parameter | Value | Rationale |
|---|---|---|
| beforeSectionSkip | `"6pt"` | Generous whitespace |
| beforeEntrySkip | `"5pt"` | Clear separation |
| beforeEntryDescriptionSkip | `"3pt"` | Breathing room |
| bodyFontSize | `"11pt"` | Executive readability |
| headerFontSize | `"32pt"` | Commanding |
| lineSpacing | `"0.85em"` | Spacious |
| pageMargin | `"2cm"` | Wide margins signal confidence |
| sectionOrder | skills, professional, education | Competencies first |
| maxBulletsPerEntry | 3 | Impact statements only |
| showEntrySummary | false | Bullets stand alone |

## 5. Data Flow Changes

```
GenerateResume (use case)
  |-- TailoringStrategyService.resolveTemplateStyle(archetype) --> TemplateStyle
  |-- resumeRenderer.render({ content, companyName, archetype, templateStyle })
        |-- TypstFileGenerator.generate(content, workDir, layoutConfig)
              |-- buildMetadataToml(content, layoutConfig)  // spacing, fonts, margins
              |-- buildCvTyp(layoutConfig)                   // section ordering + #set rules
              |-- buildProfessionalTyp(content, layoutConfig) // bullet truncation, summary toggle
              |-- buildSkillsTyp(content)                     // unchanged
              |-- buildEducationTyp(content)                   // unchanged
        |-- typst compile cv.typ
```

### 5.1 Changes by File

| File | Change |
|---|---|
| `domain/src/value-objects/TemplateStyle.ts` | **New** — `TemplateStyle` enum |
| `domain/src/domain-services/TailoringStrategyService.ts` | Add `resolveTemplateStyle()` method |
| `application/src/ports/ResumeRenderer.ts` | Add `templateStyle: TemplateStyle` to `RenderResumeInput` |
| `application/src/use-cases/GenerateResume.ts` | Wire `resolveTemplateStyle`, pass to renderer |
| `infrastructure/src/resume/TemplateLayoutConfig.ts` | **New** — type definition |
| `infrastructure/src/resume/templateLayouts.ts` | **New** — config registry (`TEMPLATE_LAYOUTS`) |
| `infrastructure/src/resume/TypstFileGenerator.ts` | Refactor `generate()` and all `build*` methods to accept `TemplateLayoutConfig` |
| `infrastructure/src/services/TypstResumeRenderer.ts` | Look up layout config, pass to generator |

### 5.2 Brilliant CV Customization Limits

Brilliant CV's TOML does **not** expose `body_font_size`, `line_spacing`, or `page_margin`. For these, inject `#set` rules into `cv.typ` before the `#show: cv.with(metadata)` line:

```typst
#set text(size: 10pt)
#set par(leading: 0.65em)
#set page(margin: 1.2cm)
```

## 6. Page-Fit Strategy

### 6.1 Proactive Truncation (Primary)

`maxBulletsPerEntry` caps bullets per entry in `buildProfessionalTyp` by slicing the `highlights` array.

### 6.2 Content Selection (Already Exists)

The `ContentSelection` value object already controls which entries are included. This is the user's primary tool for managing page fit.

### 6.3 Overflow Handling

If content still overflows, Typst naturally flows to the next page. IC targets 1-2 pages; EXECUTIVE targets 1 page. Future enhancement: warn the user if an EXECUTIVE resume exceeds 1 page.

## 7. Testing Strategy

### Unit Tests

**`TypstFileGenerator.test.ts`** — test each layout config produces correct Typst source:
- IC config → `metadata.toml` contains `before_section_skip = "1pt"`
- EXECUTIVE config → `cv.typ` lists skills include before professional include
- EXECUTIVE config with 6 highlights → `professional.typ` only contains 3 bullet items
- EXECUTIVE config → no italic summary line; IC config → summary present

**`TailoringStrategyService.test.ts`** — each `ArchetypeKey` maps to expected `TemplateStyle`

### Integration Tests

For each `TemplateStyle`, compile a real PDF and assert:
- File exists and is non-empty
- Page count within expected range (IC: 1-2, ARCHITECT: 1-2, EXECUTIVE: 1)
- Requires `typst` binary on PATH

## 8. Implementation Sequence

1. **Domain layer** — Add `TemplateStyle` enum, add `resolveTemplateStyle` to service, unit tests
2. **Infrastructure: layout config** — Add type and registry
3. **Infrastructure: TypstFileGenerator** — Refactor to accept and use `TemplateLayoutConfig`, unit tests
4. **Application: ports** — Add `templateStyle` to `RenderResumeInput`
5. **Application: use case** — Wire `resolveTemplateStyle` into `GenerateResume`
6. **Infrastructure: TypstResumeRenderer** — Look up layout config, pass to generator
7. **Integration tests** — Compile all three styles, verify PDFs
8. **Tune values** — Generate sample PDFs, adjust spacing/font/margin numbers by visual inspection

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Brilliant CV ignores `#set page(margin:)` when `paper_size` is in TOML | Test early. If conflicting, remove `paper_size` from TOML and set via `#set page()` instead. |
| Executive 1-page target unrealistic for many roles | `maxBulletsPerEntry: 3` + `ContentSelection` makes this achievable. |
| Layout constants need frequent tuning | Single file (`templateLayouts.ts`), no DB migration. |
| Breaking change to `TypstFileGenerator.generate()` | Only called from `TypstResumeRenderer`. Low blast radius. |
