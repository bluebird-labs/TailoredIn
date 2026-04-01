# Session Instructions: P2 — Archetype-Specific Templates

## Setup

```bash
git worktree add .claude/worktrees/archetype-templates -b feat/archetype-templates
```

Do ALL work inside `.claude/worktrees/archetype-templates`.

## Required Reading

1. `CLAUDE.md` — architecture, conventions, commands
2. `GOALS.md` — the "Now" section defines the product goal
3. `docs/superpowers/specs/2026-04-01-archetype-templates.md` — your detailed spec
4. `docs/superpowers/specs/2026-04-01-resume-tailoring-coordination.md` — how this fits with parallel sessions

## Problem

Every resume looks identical regardless of archetype. An IC resume and a VP resume use the same layout, spacing, font sizes, section order, and bullet density. The system needs to produce visually distinct PDFs per archetype category.

## What to Build

### Layer 1: Domain

1. **New file** `domain/src/value-objects/TemplateStyle.ts` — enum with values `IC`, `ARCHITECT`, `EXECUTIVE`. Export from `domain/src/index.ts`.

2. **Modify** `domain/src/domain-services/TailoringStrategyService.ts` — add `resolveTemplateStyle(archetype: ArchetypeKey): TemplateStyle` mapping:
   - IC, LEAD_IC, NERD → `IC`
   - HAND_ON_MANAGER → `ARCHITECT`
   - LEADER_MANAGER → `EXECUTIVE`

### Layer 2: Application

3. **Modify** `application/src/ports/ResumeRenderer.ts` — add `templateStyle: TemplateStyle` to `RenderResumeInput`.

4. **Modify** `application/src/use-cases/GenerateResume.ts` — call `resolveTemplateStyle(archetype)` and pass `templateStyle` to the renderer.

### Layer 3: Infrastructure

5. **New file** `infrastructure/src/resume/TemplateLayoutConfig.ts` — type with: `beforeSectionSkip`, `beforeEntrySkip`, `beforeEntryDescriptionSkip`, `bodyFontSize`, `headerFontSize`, `lineSpacing`, `pageMargin`, `sectionOrder`, `maxBulletsPerEntry`, `showEntrySummary`.

6. **New file** `infrastructure/src/resume/templateLayouts.ts` — `TEMPLATE_LAYOUTS` registry with concrete values for IC (dense), ARCHITECT (balanced), EXECUTIVE (spacious). See spec section 4.2 for exact values.

7. **Modify** `infrastructure/src/resume/TypstFileGenerator.ts` — refactor `generate()` and all `build*` methods to accept `TemplateLayoutConfig`:
   - `buildMetadataToml`: inject layout spacing values
   - `buildCvTyp`: reorder `#include` statements per `sectionOrder`, add `#set text(size:)`, `#set par(leading:)`, `#set page(margin:)` before `#show`
   - `buildProfessionalTyp`: slice `highlights` by `maxBulletsPerEntry`, conditionally include/omit summary per `showEntrySummary`

8. **Modify** `infrastructure/src/services/TypstResumeRenderer.ts` — look up `TEMPLATE_LAYOUTS[input.templateStyle]`, pass config to `TypstFileGenerator.generate()`.

### Tests

9. **Unit tests** for `TailoringStrategyService` — each ArchetypeKey maps to expected TemplateStyle.

10. **Unit tests** for `TypstFileGenerator` — each layout config produces correct Typst source:
    - IC → tight spacing in metadata.toml
    - EXECUTIVE → skills include before professional include in cv.typ
    - EXECUTIVE with 6 highlights → only 3 in professional.typ
    - EXECUTIVE → no summary line; IC → summary present

11. **Integration tests** — compile a PDF for each TemplateStyle, assert file exists and page count is reasonable (requires `typst` on PATH).

## Key Files

| File | Action |
|---|---|
| `domain/src/value-objects/TemplateStyle.ts` | **Create** |
| `domain/src/domain-services/TailoringStrategyService.ts` | **Modify** — add `resolveTemplateStyle()` |
| `application/src/ports/ResumeRenderer.ts` | **Modify** — add `templateStyle` to input type |
| `application/src/use-cases/GenerateResume.ts` | **Modify** — wire template style |
| `infrastructure/src/resume/TemplateLayoutConfig.ts` | **Create** |
| `infrastructure/src/resume/templateLayouts.ts` | **Create** |
| `infrastructure/src/resume/TypstFileGenerator.ts` | **Modify** — parameterize all `build*` methods |
| `infrastructure/src/services/TypstResumeRenderer.ts` | **Modify** — look up and pass layout config |
| `infrastructure/src/resume/brilliant-cv/types.ts` | Read — `BrilliantCVContent` type |

## Important Notes

- Use ONE parameterized template (not multiple .typ files). Differentiation happens through `metadata.toml` values + `#set` rules in `cv.typ`.
- Brilliant CV's TOML does NOT support `body_font_size`, `line_spacing`, or `page_margin` — use Typst `#set` rules injected before the `#show: cv.with(metadata)` line.
- All relative imports must use `.js` extensions (NodeNext resolution).
- Export new value objects from barrel files.

## Completion Checklist

- [ ] `TemplateStyle` enum exists and is exported from domain
- [ ] `resolveTemplateStyle` maps archetype keys to template styles
- [ ] `TypstFileGenerator` accepts and uses `TemplateLayoutConfig`
- [ ] Section ordering varies per template style
- [ ] Bullet truncation (`maxBulletsPerEntry`) works
- [ ] Summary toggle (`showEntrySummary`) works
- [ ] All unit tests pass
- [ ] Integration tests compile PDFs for each style
- [ ] `bun run check` — clean
- [ ] `bun run knip` — no dead code
- [ ] Run `/land` to rebase, PR, and merge
