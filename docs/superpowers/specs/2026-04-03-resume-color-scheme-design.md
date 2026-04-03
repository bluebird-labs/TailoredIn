# Resume Color Scheme Design

**Date:** 2026-04-03
**Status:** Approved

## Context

The resume template currently uses `#333333` (charcoal) as its accent color — barely distinguishable from black, providing no visual differentiation. The goal is to introduce a cohesive, executive-appropriate color scheme that modernizes the resume without looking immature or attention-seeking.

Target roles: CTO, VP Engineering, Head of Engineering at Series B+ tech companies.

## Selected Scheme: Corporate Polished

| Element | Color | Notes |
|---|---|---|
| Accent | `#3E6B8A` steel blue | One accent, nothing else |
| Section title (first 3 letters) | `#3E6B8A` | e.g. **Exp**erience |
| Job titles | `#3E6B8A` small caps | via `awesome_color` in brilliant-cv |
| Location text | `#3E6B8A` italic | via `awesome_color` in brilliant-cv |
| Section divider line | `#3E6B8A` | custom override (see below) |
| Name (header) | `#3E6B8A` | via `awesome_color` in brilliant-cv |
| Company names | `#1a1a1a` bold | unchanged |
| Dates | `#999999` italic | unchanged (brilliant-cv default) |
| Bullet text | `#343a40` | unchanged (brilliant-cv default) |
| Page background | `#ffffff` | unchanged |

## Architecture

### Source of Truth

`infrastructure/src/resume/TypstFileGenerator.ts` generates all Typst files into `infrastructure/typst/` on every render. The static files in `infrastructure/typst/` are a committed snapshot; they must be kept in sync but are not the authority.

### The Divider Line Problem

`brilliant-cv:3.3.0`'s `cv-section` renders its horizontal rule with hardcoded black stroke:
```typst
#box(width: 1fr, line(stroke: 0.9pt, length: 100%))
```
`awesome_color` does not propagate to this line. A custom `cv-section` must be defined to override it.

### Solution: `helpers.typ`

Generate a `helpers.typ` file alongside `cv.typ` that:
1. Defines a custom `cv-section` re-implementing the section heading with an accent-colored divider
2. Re-exports `cv-entry`, `cv-skill`, `h-bar` from the package for module files to import from one place

Module files (`professional.typ`, `skills.typ`, `education.typ`) import `cv-section` from `"../helpers.typ"` instead of from the package.

```
infrastructure/typst/
  cv.typ             ← generated, unchanged except accent color propagation
  helpers.typ        ← NEW generated file
  metadata.toml      ← awesome_color: "#3E6B8A"
  modules_en/
    professional.typ ← import cv-section from "../helpers.typ"
    skills.typ       ← import cv-section from "../helpers.typ"
    education.typ    ← import cv-section from "../helpers.typ"
```

## Changes

### 1. `TypstFileGenerator.ts`

**`buildMetadataToml()`**: change `awesome_color = "#333333"` → `awesome_color = "#3E6B8A"`

**Add `buildHelpersTyp()`**:
```typst
#import "@preview/brilliant-cv:3.3.0": cv-entry, cv-skill, h-bar

#let _accent = rgb("#3E6B8A")
#let _section-skip = 4pt

#let cv-section(title, letters: 3) = {
  v(_section-skip)
  block(
    sticky: true,
    [#text(size: 16pt, weight: "bold", fill: _accent, title.slice(0, letters))#text(size: 16pt, weight: "bold", title.slice(letters))
    #h(2pt)
    #box(width: 1fr, line(stroke: 0.9pt + _accent, length: 100%))]
  )
}
```

**`generate()`**: add `FS.writeFile(Path.join(workDir, 'helpers.typ'), TypstFileGenerator.buildHelpersTyp(), 'utf8')` to the parallel writes.

**`buildProfessionalTyp()`**: change import line to:
```typst
#import "../helpers.typ": cv-section, cv-entry
```

**`buildSkillsTyp()`**: change import line to:
```typst
#import "../helpers.typ": cv-section, cv-skill, h-bar
```

**`buildEducationTyp()`**: change import line to:
```typst
#import "../helpers.typ": cv-section
```

### 2. Static snapshot files (keep in sync)

- `infrastructure/typst/metadata.toml`: `awesome_color = "#3E6B8A"`
- `infrastructure/typst/helpers.typ`: create with same content as generated version
- `infrastructure/typst/modules_en/professional.typ`: update import
- `infrastructure/typst/modules_en/skills.typ`: update import
- `infrastructure/typst/modules_en/education.typ`: update import

## Verification

1. Run `bun run cvs gen --archetype nerd --theme skyblue --company_name "Acme" --keywords node typescript` — should produce a PDF with steel blue accents and a steel blue section divider
2. Open the PDF and verify:
   - Name in steel blue
   - Section headers with steel blue first letters and steel blue divider line
   - Job titles in steel blue small caps
   - Location text in steel blue
   - Company names still bold black
   - Dates still muted gray
   - Bullets still dark, no color bleed
3. Confirm via API: `PUT /jobs/:id/generate-resume` produces the same result
