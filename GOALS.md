# GOALS.md

Product vision for TailoredIn — what it is and where it's headed.

## What TailoredIn Is

TailoredIn is a self-hosted web application that generates polished, ATS-optimized resumes tailored to different professional archetypes. A software engineering leader maintains one source of truth for their career data — experiences, bullets, variants, skills, education — and produces distinct, recruiter-ready PDFs for each persona they present: IC, architect, VP, and so on. Secondary capabilities include automated job discovery from LinkedIn and interview prep research briefs.

---

## Now — Resume Tailoring

The primary goal: **given real profile data, each archetype produces a distinct, polished PDF that's ready to send to a recruiter — no manual post-processing needed.**

### Pipeline Correctness

The archetype's content selection must actually drive resume output. When a user selects specific bullet variants for their "Tech Lead" archetype, those variants — and only those — appear on the generated PDF. The full chain must work end-to-end:

- Archetype → ContentSelection → experienceSelections with bulletVariantIds
- DatabaseResumeContentFactory reads the selection and assembles only the chosen variants
- Different archetypes for the same person produce meaningfully different resumes

### Archetype-Specific Templates

Different archetypes get different visual treatments:

- **IC / Engineer** — Dense, technical layout. Maximize content on 1–2 pages, tight line spacing, emphasis on technical skills and project details.
- **Architect / Staff+** — Balanced layout. System-level impact, cross-team influence, technical depth with strategic framing.
- **VP / Director** — Executive summary style. Fewer bullets, more impact-oriented statements, breathing room, leadership emphasis.

Each template must produce proper layout: content fits the page, no overflow, no awkward whitespace gaps. The template selection is driven by the archetype.

### Visual Quality

Typography, spacing, and hierarchy must meet the standard a hiring committee at a top-tier engineering organization would expect:

- Company brand color accents applied automatically
- Clean section breaks and visual hierarchy
- Professional but not generic — distinctive without being flashy
- ATS-compatible structure underneath the visual polish

---

## Next

Capabilities that build on a working resume pipeline:

- **LLM Enrichment** — Auto-suggest bullet variants from existing bullet content and auto-tag experiences with role/skill tags to accelerate archetype curation.
- **Job-Specific Tailoring** — Go beyond archetype-level customization to tailor keywords, emphasis, and bullet ordering to a specific job posting.

---

## Later

- **Job Discovery** — Additional job board scrapers (Indeed, Greenhouse, Lever), improved scoring and ranking against skill profiles.
- **Interview Prep** — Auto-generated company research briefs: product overview, tech stack, engineering culture, recent news, key people.
- **CLI Phase-Out** — Migrate remaining CLI workflows (jobby, cvs, robot) to the web UI.

---

## Design Principles

- **Web-first.** The primary interface is a browser-based UI backed by the Elysia API. CLI tools are transitional.
- **Multi-source ready.** The scraper port abstracts job boards behind a common interface. New sources plug in without touching the core pipeline.
- **LLM-assisted, not LLM-dependent.** AI enhances the pipeline (insight extraction, keyword matching, variant suggestions) but the tool remains functional without it — manual content curation, archetype-driven templates.
- **Truthful.** Resume content comes from the user, not the AI. The LLM's role is to analyze, suggest, and optimize presentation of real experience — never to fabricate or embellish.
- **Dogfooded.** The author is the primary user. Features ship when they solve a real problem in an active job search.

## What TailoredIn Is Not

- **Not an auto-applier.** TailoredIn never submits applications on the user's behalf. The pipeline ends at resume PDF generation.
- **Not a SaaS product.** No auth, user accounts, or hosted infrastructure. Designed for self-hosted local execution.
- **Not a mock-interview platform.** Interview prep means research briefs, not interactive practice sessions or AI-scored answers.
- **Not an ATS/CRM.** Job funnel tracking exists to support the pipeline, but building a full applicant tracking system is not a goal.

---

<details>
<summary>Completed Milestones</summary>

### Domain Rethink — Vertical Slices (S0–S6)

Redesigned the domain model via full-stack vertical slices, each delivering domain → application → infrastructure → API → web UI.

| Slice | Scope | PR |
|---|---|---|
| **S0: Foundation** | TagSet, ApprovalStatus, IDs, Tag entity, TagProfile, ContentSelection, DB migration (17 tables) | #28 |
| **S1: Profile** | Profile entity, GetProfile/UpdateProfile, API + page | #29 |
| **S2: Headlines** | Headline entity with role tags, CRUD, tag picker | #31 |
| **S3: Education** | Education entity, CRUD, page | #30 |
| **S4: Skills** | SkillCategory + SkillItem, CRUD, drag-drop reordering | #32 |
| **S5: Experience** | Experience + Bullet + BulletVariant, tags, approval workflow | #33, #34 |
| **S6: Archetypes** | Archetype + TagProfile + ContentSelection, tag weight editor, content picker | #35 |

S7 (LLM Enrichment) was deferred to the "Next" horizon.

### v1 Milestones

| Milestone | Scope | PRs |
|---|---|---|
| 1. Database-Driven Resume Generation | Domain + application layer, repository impls, DatabaseResumeContentFactory | #4, #6, #9 |
| 2. Resume Data API | Profile, experience, education, headline, skill, archetype endpoints | #7, #10 |
| 3. Job Browsing | Job list, job detail, resume download | #11 |
| 4. Profile & Resume Editing | Profile, headlines, experience, skills, education pages | #12, #13 |
| 5. Archetypes | Archetype list + detail pages | #15 |
| 6. Single-URL Job Import | URL-based import backend + "Add Job" UI + resume generation | #16, #17 |
| 7. LLM-Free Fallbacks | Generic resume generation, LLM-free UI | #19 |
| 8. Job Triaging | Triaging UI, lifecycle views, apply button | #20 |
| 9. Company Classification | Domain model + classification UI | #18 |
| 10. Interview Prep | Domain + backend + web UI | #21 |
| 11. Experience as Positions | Domain refactor, application + infrastructure, experience page | #22 |
| 12. QA Pass | Completed | — |
| Data Migration + Legacy Cleanup | Completeness + legacy cleanup | #36 |

</details>
