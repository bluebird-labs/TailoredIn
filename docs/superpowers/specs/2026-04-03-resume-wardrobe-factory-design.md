# Resume Wardrobe + Factory — Design Spec

**Date:** 2026-04-03

## Context

The current resume building UX has several problems:
- The "generic" builder tab is confusing — everything appears disabled or inert
- The "chest" (verbose bullet content introduced in #55) has no editing UI; users can't actually fill in the rich content the LLM depends on
- Bullets are a resume-formatting concept leaking into the content authoring experience — users shouldn't think in bullets when writing about their work
- Jobs are being removed as a primary concept; the app pivots to being a dedicated resume tool

The solution is a two-space model: a **Wardrobe** (content library) and a **Factory** (generation engine). Users author rich narratives in the Wardrobe; the Factory reads those narratives and writes bullets at generation time.

---

## Mental Model

```
Wardrobe                          Factory
────────────────────────         ────────────────────────────────
Your raw content library    →    Input (JD / prompt / file)
                                       ↓
Headlines                         LLM reads wardrobe narratives
Experience narratives             selects relevant accomplishments
Skill categories                  generates tailored bullets
                                       ↓
                                  Review + edit output
                                       ↓
                                  Download PDF
```

**Key principle:** The Wardrobe has no resume formatting — no bullets, no column layout. It's a content database written in the user's own words. Bullets are an output artifact produced by the Factory.

---

## Navigation

Jobs are removed. The app nav becomes:

```
[ Resume ]
  ├── Wardrobe
  └── Factory
```

The `/resume` route renders a tab interface: **Wardrobe** | **Factory**.

---

## Wardrobe

Route: `/resume` (default tab)

Three sub-tabs inside the Wardrobe: **Headlines · Experience · Skills**

### Headlines tab

A list of headline variants. Each has:
- **Title** — short label (e.g. "Staff Engineer", "Backend Lead")
- **Body** — 1–3 sentence professional summary
- **Status** — `active` | `draft` | `archived`

The LLM picks the most relevant headline for the target role.

### Experience tab

A list of experience entries ordered chronologically. Each entry is a card that expands in place to reveal:

**Role-level fields:**
- Company, title, date range (already exist)
- **Role narrative** — a textarea: overall context for the role (scope, team, why it mattered)

**Accomplishments list** (replaces Bullet entity):
Each accomplishment has:
- **Title** — short label for the accomplishment (e.g. "Billing engine sharding")
- **Narrative** — freeform prose textarea: the full story of what the user did, why, and the outcome. This is what the LLM reads.
- **Skill tags** — multi-select of skill categories; helps the LLM match accomplishments to a JD without reading everything

Users add/remove accomplishments per experience. No bullet text field — bullets are inferred at generation time.

### Skills tab

Skill categories with their skills listed. Unchanged from current implementation.

---

## Factory

Route: `/resume` (second tab)

### Step 1 — Input

A single input surface:
- **Free-form textarea**: "Paste a job description, or describe the role you're targeting" — accepts raw JD text, a URL-pasted description, or a free-form prompt (e.g. "focus on my infrastructure and reliability work")
- **File upload** — accepts PDF or DOCX; text is extracted server-side and populated into the textarea
- **Generate Resume** button

### Step 2 — Review & Edit

After generation, the user sees what the LLM produced:

- **Selected headline** (with option to switch to another variant)
- **Per-experience breakdown**: which accomplishments were selected, and the generated bullet text for each
  - User can edit bullet text inline
  - User can toggle an accomplishment off
- **Regenerate** button — re-runs the LLM with the same input
- **Download PDF** button

Generated resumes are stored (linked to the input that produced them) so the user can return to them.

---

## Domain Model Changes

### Remove: `Bullet` entity
The `Bullet` aggregate (with `text`, `verboseDescription`, `status`) is replaced by `Accomplishment`.

### Add: `Accomplishment` entity (replaces Bullet)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `experience` | Experience | belongs-to |
| `title` | string | short label |
| `narrative` | text | the full prose story |
| `skillTags` | string[] | references skill category names |
| `position` | int | ordering within experience |

### Update: `Experience` entity
- Keep `narrative` field (role-level overview, already added in #55)
- Remove relationship to `Bullet`, add relationship to `Accomplishment`

### Update: `DatabaseResumeChestQuery`
Formats wardrobe content for LLM input using accomplishment narratives instead of verbose bullet descriptions.

### Update: `OpenAiResumeTailoringService` / LLM prompt
Input to LLM changes from "here are bullets with verbose descriptions" to "here are accomplishment narratives — write resume bullets for this target role."

### Factory file upload
New endpoint: `POST /factory/extract-text` — accepts PDF/DOCX, returns extracted text string. Used to populate the textarea before generation.

---

## Verification

1. **Wardrobe — Experience tab**: Open `/resume`, go to Experience tab, expand an experience. Should show role narrative textarea + accomplishments list. Add an accomplishment with title, narrative, and tags. Save. Reload — data persists.
2. **Wardrobe — Headlines tab**: Add a headline variant with body text and `active` status. Confirm it saves.
3. **Factory — text input**: Go to Factory tab, paste a JD into the textarea. Click Generate. Should reach Step 2 review with headline + bullets per experience.
4. **Factory — file upload**: Upload a PDF JD. Text should populate the textarea. Proceed to generation.
5. **Factory — review step**: Generated bullets appear per experience. Edit a bullet inline. Download PDF — edited text should appear in the PDF.
6. **Nav**: Jobs section is gone. Only Resume (Wardrobe | Factory) is in the nav.

---

## Files Affected

| File | Change |
|---|---|
| `domain/src/entities/Bullet.ts` | Remove or deprecate |
| `domain/src/entities/Experience.ts` | Replace `bullets` relation with `accomplishments` |
| `domain/src/entities/Accomplishment.ts` | New entity |
| `infrastructure/src/db/entities/` | New ORM entity for Accomplishment, update Experience ORM entity |
| `infrastructure/src/db/migrations/` | Migration: drop bullets table, create accomplishments table |
| `infrastructure/src/DatabaseResumeChestQuery.ts` | Use accomplishment narratives |
| `application/src/use-cases/CreateTailoredResume.ts` | Updated chest input |
| `api/src/routes/` | Add file upload endpoint; update resume routes |
| `web/src/routes/resume/` | Replace builder with Wardrobe + Factory tab layout |
| `web/src/components/wardrobe/` | New: ExperienceTab, HeadlineTab, SkillsTab, AccomplishmentCard |
| `web/src/components/factory/` | New: FactoryInputStep, FactoryReviewStep |
| `web/src/routes/jobs/` | Remove or archive |
