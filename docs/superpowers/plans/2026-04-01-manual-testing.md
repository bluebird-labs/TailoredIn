# Manual Testing Plan — Resume Tailoring Verification

## Goal

Verify the complete resume tailoring pipeline works end-to-end after PRs #37–#44 landed. This is a manual QA pass — interact with the running app, check every page, generate PDFs, and report findings.

## Setup

```bash
cd /path/to/TailoredIn
bun up
```

Wait for `bun up` to complete (Docker, migrations, seeds, servers). Open `http://localhost:5173`.

## Test Sections

Work through each section in order. For each item, report PASS or FAIL with details. If something fails, note the error, take a screenshot if possible, and continue with the rest.

---

### 1. App Loads
- [ ] `http://localhost:5173` loads without errors
- [ ] Sidebar navigation renders with all links
- [ ] No console errors in browser dev tools

### 2. Profile Page (`/resume/profile`)
- [ ] Form loads with seeded profile data (name, email, phone, location)
- [ ] Edit the phone number, click Save, verify toast confirms
- [ ] Reload page — edited phone number persists
- [ ] Clear an optional field, save — no error

### 3. Headlines Page (`/resume/headlines`)
- [ ] Table loads with at least 1 seeded headline
- [ ] Create a new headline with label + summary — appears in table
- [ ] Edit the headline — changes persist after reload
- [ ] Delete the headline — removed from table

### 4. Education Page (`/resume/education`)
- [ ] Cards load with seeded education entries
- [ ] Create a new entry — card appears
- [ ] Delete an entry — card removed

### 5. Skills Page (`/resume/skills`)
- [ ] Skill categories load with items
- [ ] Create a new category, add items to it
- [ ] Drag to reorder categories — ordinals persist after reload
- [ ] Delete a category — removed

### 6. Experience Page (`/resume/experience`) — CRITICAL
#### Layout
- [ ] Page renders in resume-style layout (NOT cards)
- [ ] Each experience shows: title (bold), company, dates (right-aligned), location, summary (italic)
- [ ] Bullets display as a clean list with `•` prefix
- [ ] Right gutter shows Edit, Delete, + Add buttons
- [ ] Experiences sorted by start date descending (most recent first)

#### Experience CRUD
- [ ] Click "+ Add Experience" — dialog opens with MonthYearPicker for dates (NOT freetext)
- [ ] No "Order" / ordinal field visible in the form
- [ ] Fill all fields, save — experience appears in list at correct position by date
- [ ] Click Edit in gutter — dialog opens pre-filled, edit title, save — updated
- [ ] Click Delete in gutter — confirmation dialog, confirm — experience removed

#### Bullet Management
- [ ] Each bullet has `edit` pill visible at the end of the line
- [ ] Click `edit` — inline input replaces text, type new text, save — updated
- [ ] Click "+ Add" in gutter — inline input at bottom of bullet list, type, enter — bullet appears
- [ ] Bullets with variants show `⟳ N` pill (indigo tint) with variant count

#### Variant Management
- [ ] Click `⟳ N` pill — variants expand below bullet with indented left border
- [ ] Pill changes to solid indigo with `▴` indicator
- [ ] Each variant shows: text, approval badge, angle badge, source badge
- [ ] PENDING variants show ✓ (approve) and ✗ (reject) pills
- [ ] Click ✓ — status changes to APPROVED, approve/reject pills disappear
- [ ] Click "+ Add variant" — form appears, fill text + angle, save — variant appears
- [ ] Click `del` on a variant — variant removed
- [ ] Click `⟳ N` pill again — variants collapse

### 7. Archetypes List (`/archetypes/`)
- [ ] All 5 archetypes visible: Lead IC, Nerd, IC, Hands-On Manager, VP / Director
- [ ] Create a test archetype — appears in list
- [ ] Delete the test archetype — removed

### 8. Archetype Detail (`/archetypes/$id`)
Pick the "Lead IC" archetype:
- [ ] Detail page loads with metadata, tag profile, content selection sections
- [ ] Headline picker dropdown works — select a headline, save
- [ ] Tag weight sliders — adjust a role tag weight, save, reload — persists
- [ ] Content selection — experiences listed with checkboxes
- [ ] Check/uncheck an experience — save, reload — persists
- [ ] Expand an experience — bullet variant checkboxes visible
- [ ] Check specific variants, save, reload — selection persists
- [ ] Education and skill category checkboxes — select, save, persist

### 9. Resume Generation — THE MAIN TEST
#### Setup
Navigate to a job detail page (`/jobs/$id`) that has a company with a website.

#### Generate for Lead IC archetype
- [ ] Select "Lead IC" archetype, click Generate Resume
- [ ] PDF downloads — open it
- [ ] PDF contains the bullet variant text from Lead IC's content selection (NOT all bullets)
- [ ] Layout is dense (IC template — tight spacing, more content per page)
- [ ] Company brand color visible as accent

#### Generate for VP / Director archetype
- [ ] Select "VP / Director", generate resume on the SAME job
- [ ] PDF downloads — open it
- [ ] Content is DIFFERENT from Lead IC (different variants selected)
- [ ] Layout is executive style (wider margins, fewer bullets, more spacing)
- [ ] Skills section appears BEFORE professional experience (executive section order)

#### Generate for Hands-On Manager
- [ ] Generate on same job — PDF has balanced layout (between IC and Executive)
- [ ] Content matches Hands-On Manager's content selection

### 10. Jobs (sanity check)
- [ ] Job list loads (`/jobs`) with seeded data
- [ ] View switching works: Triage, Archive, Pipeline, All Jobs
- [ ] Job detail page loads when clicking a job

---

## Reporting

After completing all sections, summarize:
1. Total PASS / FAIL count
2. List of failures with details
3. Any observations or UX issues noticed (not failures, just notes)
