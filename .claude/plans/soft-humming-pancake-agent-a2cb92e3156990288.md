# Typst Resume Templates Research
## For: TailoredIn — Programmatic Resume Generation (Tech Leadership Roles)
## Date: 2026-04-05

---

## Context

Current template: **Brilliant CV** (brilliant-cv @ typst.app, 758 ⭐ GitHub)
- Uses `metadata.toml` for personal info, layout, lang, and keyword injection
- Content in separate `.typ` section files
- Multi-language via CLI `--input language=XX`

Goal: Identify other native `.typ` Typst templates suitable for programmatic filling via AI-generated content.

---

## Candidate Templates (Ranked by Programmatic Suitability)

### Tier 1 — Excellent Programmatic Fit (Clean Data/Layout Separation)

---

#### 1. imprecv
- **URL**: https://typst.app/universe/package/imprecv/ | https://github.com/jskherman/imprecv
- **GitHub Stars**: 503 ⭐
- **Visual Style**: No-frills minimalist single-column. Inspired by r/EngineeringResumes best practices. Clean, recruiter-scannable.
- **Data Approach**: **YAML** — all CV data lives in a `template.yml` file. The `.typ` file imports the package and loads the YAML. Complete separation of data from layout.
- **Key Features**:
  - YAML data file (version-controllable, easy to diff)
  - GitHub Actions workflow for automated PDF compilation
  - Customizable style variables
  - ATS-friendly output
  - Works via both Typst CLI and typst.app
- **Pros for programmatic use**:
  - YAML is trivial to generate from code
  - Complete data/layout separation
  - CI/CD ready (GitHub Actions included)
  - No hardcoding in the template file
- **Cons**:
  - Single column (less visual differentiation)
  - No icon support
  - Minimal visual flair (may look generic at leadership level)

---

#### 2. academicv
- **URL**: https://typst.app/universe/package/academicv/
- **GitHub Stars**: Not listed (Typst Universe package)
- **Visual Style**: Clean, modern, multi-page academic layout. Customizable fonts, spacing, colors.
- **Data Approach**: **YAML-only** — entire CV controlled via a single YAML file. Section types: header, prose, timeline, numbered list. No `.typ` modification required.
- **Key Features**:
  - True YAML-only approach (no code knowledge needed)
  - Section-level visibility toggles via parameters
  - Primary/secondary/tertiary element configuration
  - Font, spacing, color all YAML-controlled
  - Extensible section types
- **Pros for programmatic use**:
  - Best-in-class data separation — generate one YAML, get a CV
  - Non-technical data format
  - Section toggle makes partial renders easy
- **Cons**:
  - Academic flavor (may need style tweaks for industry leadership roles)
  - Less visual personality than two-column designs

---

#### 3. swe-cv
- **URL**: https://typst.app/universe/package/swe-cv/ | GitHub: swe-cv-typst
- **GitHub Stars**: 11 ⭐ (lower, but targeted)
- **Visual Style**: Clean, structured, Typst-brand-adjacent (blue/gray palette). Engineered for software professionals.
- **Data Approach**: **YAML** — `configuration.yaml` holds personal details, experience, education, competencies. Auto-propagates on compile.
- **Key Features**:
  - Explicitly designed for software engineers (SWE)
  - YAML configuration
  - Minimal setup via `typst init @preview/swe-cv:1.0.0`
  - MIT licensed
- **Pros for programmatic use**:
  - Domain match (tech roles)
  - YAML data layer
  - Simple schema
- **Cons**:
  - Low community traction (11 stars)
  - Limited visual customization documented
  - May not project seniority for VP/CTO level

---

#### 4. porygon
- **URL**: https://typst.app/universe/package/porygon/
- **GitHub Stars**: Not listed
- **Visual Style**: Professional layout with FontAwesome icons.
- **Data Approach**: **JSON** — reads from `cv_data.json`. Single `show-cv()` function call renders everything. Multi-language via CLI `CV_LANG=en/fr` parameter.
- **Key Features**:
  - JSON data file (easily machine-generated)
  - Multi-language support via CLI input
  - FontAwesome icons
  - Typst 0.13.0+ required
- **Pros for programmatic use**:
  - JSON is the most code-friendly format
  - Trivial to generate from TypeScript/JS
  - Multi-language built in
- **Cons**:
  - Limited community visibility
  - Requires FontAwesome font installation
  - No explicit ATS guidance

---

#### 5. free-cv
- **URL**: https://typst.app/universe/package/free-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: "Spacious and colorful" — inspired by CurVe CV by LianTze Lim. More visual than imprecv.
- **Data Approach**: **YAML** — `conf.yaml` for CV information, `example.typ` for section ordering, `freeCV.typ` for styling. Three-file separation.
- **Key Features**:
  - Font Awesome 7 icons
  - Modular section restructuring
  - Customizable color schemes
  - Three-layer architecture (data / structure / style)
- **Pros for programmatic use**:
  - YAML data layer
  - Colorful output appropriate for modern leadership roles
  - Section ordering controllable separately from data
- **Cons**:
  - Font Awesome 7 dependency
  - Three-file structure adds complexity
  - Less community validation

---

### Tier 2 — Good Programmatic Fit (Function-Call Data Structure)

---

#### 6. modern-cv (Typst Universe + GitHub)
- **URL**: https://typst.app/universe/package/modern-cv/ | https://github.com/ptsouchlos/modern-cv
- **GitHub Stars**: 552 ⭐ (most starred non-Brilliant-CV template)
- **Visual Style**: Modern, clean, single-column with colored header. Inspired by Awesome-CV LaTeX template. Supports profile picture. Roboto + Source Sans Pro fonts.
- **Data Approach**: **Function calls** — `resume.with()` for author metadata, `resume-entry()` and `resume-item[]` for content. No YAML/TOML external files.
- **Key Features**:
  - Customizable color schemes
  - FontAwesome icons
  - Multilingual support
  - Cover letter included
  - Profile picture support
  - Paper size configurable
- **Pros for programmatic use**:
  - Highly popular (552 stars) — well tested
  - Clean function-call API
  - Multi-language via parameter
  - Active maintenance (updated Mar 31, 2026)
- **Cons**:
  - All content in `.typ` file (no external data file)
  - ATS compatibility not explicitly addressed
  - Generating `.typ` from code is harder than generating YAML/JSON

---

#### 7. mrbogo-cv
- **URL**: https://typst.app/universe/package/mrbogo-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: Modern, elegant two-column layout with sidebar. Inspired by Awesome CV. FontAwesome social icons.
- **Data Approach**: **Typst function calls + modular files** — `content/[lang]/` directories hold language-specific data as `.typ` files. `lib/` holds styling. `templates/` provides re-exports. `lib/theme.typ` for colors.
- **Key Features**:
  - Explicit content/template separation enforced by directory structure
  - Multi-language (EN/IT built-in, extensible)
  - Skills with numeric proficiency levels (1-5)
  - Section reordering by editing orchestrator imports
  - Theme system for global color changes
- **Pros for programmatic use**:
  - Strongest structural separation of any non-YAML template
  - Language switching by directory — fits multi-locale generation
  - Modular sections = easy to include/exclude programmatically
- **Cons**:
  - Data still in `.typ` files (requires Typst codegen vs. YAML/JSON)
  - More complex directory structure
  - FontAwesome dependency

---

#### 8. grotesk-cv
- **URL**: https://typst.app/universe/package/grotesk-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: Minimalist, modern. HK Grotesk font. Optional FontAwesome section icons. Clean whitespace. Based on Brilliant-CV and fireside templates.
- **Data Approach**: **TOML** — `info.toml` for contact info, language settings, layout preferences. Content in `/content` directory `.typ` files.
- **Key Features**:
  - TOML configuration (similar to Brilliant CV's metadata.toml)
  - Language switching via single variable
  - CV + cover letter generation
  - FontAwesome icons optional
  - Profile picture swap mechanism
- **Pros for programmatic use**:
  - TOML data layer familiar to Brilliant CV users
  - Covers both CV and cover letter
  - Minimal, professional aesthetic
  - Clean Grotesk typography suitable for tech leadership
- **Cons**:
  - Content still in `.typ` files (only metadata in TOML)
  - Relatively new/unproven
  - Limited documentation

---

#### 9. neat-cv
- **URL**: https://typst.app/universe/package/neat-cv/
- **GitHub Stars**: Listed on Universe (typst-neat-cv GitHub)
- **Visual Style**: Modern, elegant two-column with sidebar. Inspired by Awesome CV and simple-hipstercv. Fira Sans / Noto Sans fonts.
- **Data Approach**: **Function calls** — `cv.with()` for config, `entry()`, `item-with-level()`, `contact-info()`, `social-links()` for content. Hayagriva YAML for publications.
- **Key Features**:
  - Level bars for languages and skills
  - Publication lists from Hayagriva YAML (auto-grouped by year)
  - Author highlighting in publication lists
  - Interactive social/contact links
  - Cover letter matching CV aesthetic
  - Requires Typst v0.13.0+
- **Pros for programmatic use**:
  - Clean component API
  - Publications via YAML (useful for academics / thought leaders)
  - Good for senior technical profiles
- **Cons**:
  - No full external data file — content must be in `.typ`
  - Publications workflow adds complexity
  - Two-column may not always parse well with ATS

---

#### 10. cobalt-cv
- **URL**: https://typst.app/universe/package/cobalt-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: **Two-column with shaded sidebar**. Customizable accent color. FontAwesome headers. Adjustable column ratio via `col-ratio`.
- **Data Approach**: **Function calls** — `#education()`, `#skill-category()`, `#experience()`. Degrees/bullets passed as arrays/tuples.
- **Key Features**:
  - Shaded sidebar (distinctive visual)
  - Adjustable column proportions
  - Optional professional summary section
  - Array-based degree/accomplishment inputs
- **Pros for programmatic use**:
  - Array/tuple inputs are machine-friendly
  - Visual distinctiveness (sidebar) good for leadership level
  - Clean function API
- **Cons**:
  - Shaded sidebar may hurt ATS parsing
  - No external data file
  - Limited community validation

---

#### 11. finely-crafted-cv
- **URL**: https://typst.app/universe/package/finely-crafted-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: Clean, professional. Nested organization (company → role → bullet). Attention to typographic detail.
- **Data Approach**: **Nested function calls** — `resume()` → `company-heading()` → `job-heading()`. Accepts strings, images, content blocks.
- **Key Features**:
  - QR code thumbnail support (digital sharing)
  - Keyword metadata for searchability
  - Nested hierarchy (multi-role-at-company)
  - Dynamic contact headers with icons
  - Configurable heading/body fonts
- **Pros for programmatic use**:
  - Multi-role nesting is perfect for career progressions (IC → Staff → Principal)
  - QR code feature interesting for digital distribution
  - Clean nesting model
- **Cons**:
  - No external data file
  - Relatively niche (less validation)

---

### Tier 3 — Moderate Fit (Notable Visual Style or Niche Use)

---

#### 12. alta-typst
- **URL**: https://github.com/GeorgeHoneywood/alta-typst
- **GitHub Stars**: 185 ⭐
- **Visual Style**: Two-column, wraps when space-constrained. IBM Plex Sans. Inspired by AltaCV.
- **Data Approach**: **Function calls** — `alta()` function with structured data including `links` array. SVG icons from `icons/` folder.
- **Key Features**:
  - Column break control (`#colbreak()`)
  - SVG icon system (Font Awesome sourced)
  - HTML export support (Typst 0.14.0)
  - Works on typst.app
- **Pros**: HTML export is unique — could enable web previews
- **Cons**: No external data file; icon setup adds friction

---

#### 13. vercanard
- **URL**: https://typst.app/universe/package/vercanard/ | https://github.com/elegaanz/vercanard
- **GitHub Stars**: 106 ⭐
- **Visual Style**: Colorful, aside panel for contact info, customizable accent color via RGB.
- **Data Approach**: **Function calls** — main resume function + `entry()` with title/description/details.
- **Key Features**:
  - Colorful design
  - Right-aligned aside panel
  - Simple 3-argument entry function
  - GPLv3 (generated resumes not derivative works)
- **Pros**: Visual personality; simple API
- **Cons**: GPLv3 license; no external data file; limited features

---

#### 14. silver-dev-cv
- **URL**: https://typst.app/universe/package/silver-dev-cv/
- **GitHub Stars**: Used by https://silver.dev (engineer-recruiter context)
- **Visual Style**: Clean, professional. Times New Roman default. Engineer-recruiter designed.
- **Data Approach**: **Function calls** — `cv.with()` for config, `#section()`, `#job()`, `#education()`, `#award()`.
- **Key Features**:
  - Designed by an engineer-recruiter
  - Optional header continuation, last-updated date, page count
  - Two-entry and multi-line item formatting
  - MIT licensed
- **Pros**: Recruiter-validated design; practical function API
- **Cons**: Serif font (Times New Roman) may feel dated; no external data file

---

#### 15. linked-cv
- **URL**: https://typst.app/universe/package/linked-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: LinkedIn-inspired UI emulation. Timeline-based. A4 optimized. Roboto + Source Sans Pro.
- **Data Approach**: **Function calls** — `employer-info()`, `workstream()`, `connected-frames()`. `show` rule for personal config.
- **Key Features**:
  - **100+ built-in technology logos** (frameworks, tools)
  - Timeline visualization for multiple positions at one employer
  - Familiar LinkedIn aesthetic
  - Customizable accent colors
- **Pros**: Technology logo library is excellent for tech leadership; familiar visual language
- **Cons**: LinkedIn imitation may feel derivative; no external data file; complex structure

---

#### 16. vantage-cv
- **URL**: https://typst.app/universe/package/vantage-cv/
- **GitHub Stars**: ~85 ⭐ (vantage-typst GitHub)
- **Visual Style**: Two-column, experience left / supplementary right. SVG icons from Lucide Icons.
- **Data Approach**: **YAML** — `configuration.yaml` for personal data, experience, education, skills.
- **Key Features**:
  - ATS friendly (explicitly)
  - YAML config
  - Lucide SVG icon system
  - Local compilation (Typst CLI)
- **Pros**: YAML + ATS + two-column is a solid combination
- **Cons**: Lucide icons vs Font Awesome (less comprehensive); lower star count

---

#### 17. moderner-cv
- **URL**: https://typst.app/universe/package/moderner-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: moderncv LaTeX inspired. Clean, optional framed profile image. FontAwesome icons.
- **Data Approach**: **Function calls** — `show` rule with `name`, `lang`, `social` parameters.
- **Key Features**:
  - FontAwesome social icons
  - Multi-language via `lang` parameter
  - Profile image with frame styling
  - Requires Typst ≥0.14.0
- **Pros**: Familiar moderncv aesthetic
- **Cons**: FontAwesome requires separate install (`--font-path`); adds setup overhead for automated use

---

#### 18. modernpro-cv
- **URL**: https://typst.app/universe/package/modernpro-cv/
- **GitHub Stars**: Not listed
- **Visual Style**: Inspired by Deedy-Resume (LaTeX). Single and two-column variants. Times New Roman default.
- **Data Approach**: **Function calls** — `section-block()`, `render-sections()` for ordering control. `#job()`, `#education()`, `#award()`.
- **Key Features**:
  - `.bib` bibliography integration for publications
  - Section reordering via `render-sections()`
  - Customizable margins (1.25cm default)
  - Quick and advanced template variants
- **Pros**: Publications support; section reordering is useful for role-specific customization
- **Cons**: Deedy-Resume aesthetic may feel dated; serif default

---

#### 19. chicv (GitHub, not just Universe)
- **URL**: https://typst.app/universe/package/chicv/ | https://github.com/skyzh/chicv
- **GitHub Stars**: 713 ⭐ (highest non-Brilliant-CV star count)
- **Visual Style**: Minimal, single-column. `#chiline()` section dividers. 10-12pt recommended.
- **Data Approach**: **Hardcoded in `.typ`** — copy-modify pattern. No external data file.
- **Key Features**:
  - Extremely minimal (4.78 kB)
  - Easy to customize
  - CC0-1.0 + MIT dual license
- **Pros**: High community validation (713 stars); easy to understand; permissive license
- **Cons**: No data separation whatsoever; must generate entire `.typ` from scratch programmatically; no ATS guidance; no icons; too minimal for leadership level

---

#### 20. basic-resume
- **URL**: https://typst.app/universe/package/basic-resume/
- **GitHub Stars**: ~168 ⭐ (basic-typst-resume-template GitHub)
- **Visual Style**: Simple, standard, single-column. Customizable accent color. "New Computer Modern" font.
- **Data Approach**: **Function calls** — `#edu()`, `#work()`, `#project()`, `#extracurriculars()`. Plus generic 2x2 and 1x2 layout helpers.
- **Key Features**:
  - Explicitly ATS-designed
  - r/EngineeringResumes best practices
  - Generic layout helpers for custom sections
  - US letter paper
- **Pros**: ATS-first design; simple API; well validated
- **Cons**: Very plain visually; no icons; may look junior for leadership roles

---

## Comparison Matrix

| Template | Stars | Data Format | ATS | Multi-lang | Icons | Two-Column | Cover Letter | Visual Level |
|---|---|---|---|---|---|---|---|---|
| **Brilliant CV** (current) | 758 | TOML | ✓ | ✓ | FA | - | ✓ | High |
| imprecv | 503 | YAML | ✓ | - | - | - | - | Low |
| academicv | - | YAML | - | - | - | - | - | Medium |
| swe-cv | 11 | YAML | - | - | - | - | - | Medium |
| porygon | - | JSON | - | ✓ | FA | - | - | Medium |
| free-cv | - | YAML | - | - | FA7 | - | - | High |
| modern-cv | 552 | Functions | - | ✓ | FA | - | ✓ | High |
| mrbogo-cv | - | .typ files | - | ✓ | FA | ✓ | - | High |
| grotesk-cv | - | TOML | - | ✓ | FA | - | ✓ | Medium |
| neat-cv | - | Functions | - | - | FA | ✓ | ✓ | High |
| cobalt-cv | - | Functions | - | - | FA | ✓ | - | High |
| finely-crafted-cv | - | Functions | - | - | - | - | - | High |
| alta-typst | 185 | Functions | - | - | SVG | ✓ | - | Medium |
| vercanard | 106 | Functions | - | - | - | - | - | High |
| silver-dev-cv | - | Functions | - | - | - | - | - | Medium |
| linked-cv | - | Functions | - | - | 100+ logos | ✓ | - | High |
| vantage-cv | 85 | YAML | ✓ | - | SVG | ✓ | - | Medium |
| chicv | 713 | Hardcoded | - | - | - | - | - | Minimal |
| basic-resume | 168 | Functions | ✓ | - | - | - | - | Low |

---

## Top Recommendations for TailoredIn

### Best overall for programmatic use (data → CV):
1. **imprecv** — YAML + GitHub Actions + ATS + 503 stars. Closest to ideal for code-generated content.
2. **academicv** — True YAML-only, most hands-off data approach.
3. **porygon** — JSON input is the easiest to generate from TypeScript code.

### Best for visual quality at leadership level:
1. **modern-cv** — 552 stars, actively maintained, professional with color + icons + cover letter.
2. **linked-cv** — LinkedIn-familiar aesthetic + 100+ tech logos (excellent for tech leadership).
3. **mrbogo-cv** — Best structural separation with high visual quality.

### Most similar to Brilliant CV (TOML-like approach):
1. **grotesk-cv** — TOML config + `/content` directory structure (nearly identical mental model).

### Honorable mention for leadership niche:
- **silver-dev-cv** — Built by/for engineer-recruiters, validated in hiring context.
- **finely-crafted-cv** — Multi-role nesting (IC → Staff → Principal at same company) is perfect for leadership progressions.

---

## Sources
- https://github.com/topics/resume-template?l=typst
- https://github.com/topics/cv-template?l=typst
- https://typst.app/universe/search/?q=cv&kind=template
- https://github.com/qjcg/awesome-typst
- https://typst.app/universe/package/imprecv/
- https://typst.app/universe/package/modern-cv/
- https://typst.app/universe/package/mrbogo-cv/
- https://typst.app/universe/package/neat-cv/
- https://typst.app/universe/package/finely-crafted-cv/
- https://typst.app/universe/package/grotesk-cv/
- https://typst.app/universe/package/silver-dev-cv/
- https://typst.app/universe/package/modernpro-cv/
- https://typst.app/universe/package/academicv/
- https://typst.app/universe/package/chicv/
- https://typst.app/universe/package/porygon/
- https://typst.app/universe/package/free-cv/
- https://typst.app/universe/package/cobalt-cv/
- https://typst.app/universe/package/swe-cv/
- https://typst.app/universe/package/resume-ng/
- https://typst.app/universe/package/vantage-cv/
- https://typst.app/universe/package/moderner-cv/
- https://typst.app/universe/package/linked-cv/
- https://typst.app/universe/package/basic-resume/
- https://github.com/jskherman/imprecv
- https://github.com/mintyfrankie/brilliant-CV
- https://github.com/ptsouchlos/modern-cv
- https://github.com/skyzh/chicv
- https://github.com/elegaanz/vercanard
- https://github.com/GeorgeHoneywood/alta-typst
- https://news.ycombinator.com/item?id=38990197
