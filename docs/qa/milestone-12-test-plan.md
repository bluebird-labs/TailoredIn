# Milestone 12 — QA Test Plan

**App URL:** `http://localhost:5173`
**API URL:** `http://localhost:8000`
**Date:** 2026-03-31

---

## Instructions for the QA Agent

### Goal

Execute every test case below by clicking through the live app in a browser. Your job is to find **real, actionable issues** — not to rubber-stamp a checklist.

### What to focus on

For each test case, evaluate along these dimensions:

1. **Correctness** — Does the feature work as described? Do mutations persist after a page reload? Do optimistic updates match what the server actually saved?
2. **UX quality** — Are labels clear? Are error messages helpful? Is the flow intuitive? Flag anything confusing, misleading, or inconsistent (e.g., a button that says "Save" but doesn't disable after saving, inconsistent date formats, misaligned elements).
3. **Hanging pages or APIs** — Does the page finish loading? Do spinners resolve? If an API call hangs or returns an error, note the endpoint and what you see in the UI (blank page, infinite spinner, stale data, etc.).
4. **Slowness** — Flag any interaction that feels noticeably slow (> 1–2 seconds for a non-LLM operation). Note what you clicked and roughly how long it took.
5. **Readability** — Is text truncated inappropriately? Are tables readable at normal viewport widths? Are empty states helpful?

### How to execute

- Work through the test cases **in order by section** (12A through 12E).
- For each test case, perform the exact steps described, then check the expected result.
- If a test case depends on data that doesn't exist yet (e.g., "edit an existing headline"), create the data first using an earlier test case's flow, then proceed.
- When testing mutations (create/edit/delete), **always reload the page afterward** to verify the change persisted — don't trust optimistic UI alone.
- For LLM-dependent tests (resume generation with LLM, company brief generation): skip if no `OPENAI_API_KEY` is set, and note "skipped — no LLM" in the report.

### What NOT to focus on

- Pixel-perfect design or subjective aesthetic preferences.
- Mobile responsiveness (desktop viewport only for this pass).
- Security testing (auth, injection, etc.).
- Performance benchmarking beyond "noticeably slow".

### Output

Produce a report at **`docs/qa/milestone-12-report.md`** with the following structure:

```markdown
# Milestone 12 — QA Report

**Date:** YYYY-MM-DD
**Environment:** (browser, viewport, LLM available yes/no)

## Issues

| # | Test ID(s) | Area | Issue | Severity | Repro steps |
|---|---|---|---|---|---|
| 1 | JOB-025 | Job Detail | Status dropdown doesn't update badge until page reload | P0 — broken | Change status on any job detail; badge stays on old value |
| 2 | — | Experience | Bullet point editor loses focus after each keystroke | P1 — UX | Add bullet, start typing, cursor jumps |
| ... | | | | | |

### Severity scale
- **P0 — broken**: Feature does not work. Blocks the user from completing the action.
- **P1 — degraded**: Feature works but with notable bugs, confusing UX, or data issues.
- **P2 — polish**: Minor cosmetic or UX nit. Not blocking.

## Passed

List of test IDs that passed without issues (comma-separated, grouped by section).

## Skipped

List of test IDs skipped and why (e.g., "no LLM key", "no test data available").
```

Focus the report on **issues** — that's the actionable output. The "Passed" section can be brief. Every issue must include concrete repro steps so a developer can reproduce it without guessing.

---

## 12A. Job Browsing

### Job List — Views & Navigation

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-001 | Job List | Navigate to `http://localhost:5173/jobs`. Verify the page loads with the Triage view selected by default. | Page loads. "Triage" tab is visually active/selected. The URL has `?view=triage` (or no view param, defaulting to triage). A table of jobs is displayed. | P0 |
| JOB-002 | Job List | Click the "Pipeline" tab button in the view switcher at the top. | URL updates to `?view=pipeline`. Table refreshes with jobs in pipeline statuses (Applied, Recruiter Screen, Technical Screen, HM Screen, On-site, Offer). Triage-specific checkboxes disappear from the table. | P0 |
| JOB-003 | Job List | Click the "Archive" tab button. | URL updates to `?view=archive`. Table shows archived/rejected jobs (Retired, Duplicate, High Applicants, Location Unfit, Posted Too Long Ago, Unfit, Expired, Low Salary, Rejected, No News). | P1 |
| JOB-004 | Job List | Click the "All Jobs" tab button. | URL updates to `?view=all`. Table shows all jobs regardless of status. No checkbox column. | P1 |

### Job List — Sorting

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-005 | Job List | On the Triage view, click the "Score" column header. | Jobs are sorted by score descending. A sort icon (down arrow) appears next to "Score". URL updates with `sortBy=score&sortDir=desc`. | P0 |
| JOB-006 | Job List | Click the "Score" column header again. | Sort direction toggles to ascending. Sort icon changes to up arrow. URL updates to `sortDir=asc`. | P1 |
| JOB-007 | Job List | Click the "Posted" column header. | Jobs are sorted by posted date. Sort icon moves to "Posted" column. URL updates with `sortBy=posted_at`. | P1 |

### Job List — Filtering

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-008 | Job List | On the Triage view, if a status sub-filter dropdown is visible, select a specific status (e.g., "New"). | Table filters to show only jobs with status "New". URL updates with `subStatus=NEW`. Page resets to 1. | P1 |
| JOB-009 | Job List | Open the "Business Type" filter dropdown and select a value (e.g., "B2B SaaS"). | Table filters to show only jobs from companies classified as the selected business type. URL updates with `businessType=B2B_SAAS`. Page resets to 1. | P1 |
| JOB-010 | Job List | Open the "Industry" filter dropdown and select a value. | Table filters by industry. URL updates. Page resets to 1. | P1 |
| JOB-011 | Job List | Open the "Stage" filter dropdown and select a value (e.g., "Startup"). | Table filters by company stage. URL updates. Page resets to 1. | P1 |
| JOB-012 | Job List | Apply multiple filters simultaneously (e.g., Business Type + Industry). | Table shows jobs matching ALL selected filters. URL contains both query params. | P1 |
| JOB-013 | Job List | After applying filters, switch view tabs (e.g., Triage to Pipeline). | Filters reset (subStatus clears, sortBy clears). New view loads with default settings. | P1 |

### Job List — Pagination

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-014 | Job List | On a view with more jobs than one page, verify pagination controls appear at the bottom. | Pagination shows total count and current page number. "Previous" button is disabled on page 1. "Next" button is enabled. | P0 |
| JOB-015 | Job List | Click the "Next" button. | Table loads the next page of results. URL updates with `page=2`. "Previous" button becomes enabled. | P0 |
| JOB-016 | Job List | Click "Previous" to go back to page 1. | Table loads page 1. URL updates to `page=1` or removes the param. "Previous" is disabled again. | P1 |
| JOB-017 | Job List | Navigate to the last page using "Next" repeatedly. | On the last page, "Next" button is disabled. | P1 |

### Job List — Score Display

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-018 | Job List | Verify jobs in the table display a numeric score in the Score column. | Each row shows a numeric score value. Scores are visible and formatted as numbers. | P0 |

### Job List — Row Navigation

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-019 | Job List | Click on a job title link in any row. | Browser navigates to `/jobs/{jobId}`. Job detail page loads. | P0 |

### Job Detail

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-020 | Job Detail | Navigate to a job detail page by clicking a job title from the list. | Page loads with: job title (h1), company name (clickable link), status badge, location, salary, remote status, job type, posted date, description section, and external links. | P0 |
| JOB-021 | Job Detail | Click the back link (arrow + "Back to Jobs" at top). | Browser navigates back to `/jobs`. | P1 |
| JOB-022 | Job Detail | Click the company name link. | Browser navigates to `/companies/{companyId}`. Company detail page loads. | P1 |
| JOB-023 | Job Detail | Verify the LinkedIn link (if present) opens in a new tab. | Clicking the LinkedIn link opens the LinkedIn job posting in a new browser tab. | P2 |
| JOB-024 | Job Detail | Verify the Apply link (if present) shows the ATS platform name (e.g., "Apply on Greenhouse", "Apply on LinkedIn"). | The apply link text includes the detected ATS platform. Clicking opens the apply URL in a new tab. | P2 |

### Job Detail — Status Changes

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-025 | Job Detail | On a job with status "New", open the status dropdown and select "Applied". | Status updates immediately. Badge changes to show "Applied". A success toast appears. Returning to the job list shows the updated status. | P0 |
| JOB-026 | Job Detail | Change status to "Recruiter Screen". | Status updates. Badge shows "Recruiter Screen". | P1 |
| JOB-027 | Job Detail | Change status to "Unfit" (an archive status). | Status updates to "Unfit". A "Reopen" button appears. | P1 |
| JOB-028 | Job Detail | Click the "Reopen" button on an archived/discarded job. | Status changes back to "New". Reopen button disappears. Success toast shown. | P1 |

### Job Detail — Scores

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-029 | Job Detail | Verify the Scores card is displayed with Expert, Interest, Avoid, and Salary scores. | Scores card shows four labeled score values as numbers. | P1 |

### Job Detail — Resume Generation (LLM Available)

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-030 | Job Detail | On a job detail page when LLM is available (OPENAI_API_KEY set), click the "Generate Resume" button. | A PDF file downloads. Button shows loading state during generation. | P0 |

### Job Detail — Resume Generation (LLM-Free Mode)

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-031 | Job Detail | On a job detail page when LLM is NOT available, verify the resume generation UI shows an archetype dropdown and keywords input. | An archetype selector dropdown and a comma-separated keywords text input are visible, along with a "Generate Resume" button. | P0 |
| JOB-032 | Job Detail | Select an archetype from the dropdown, optionally enter keywords (e.g., "node, typescript, react"), then click "Generate Resume". | A PDF file downloads. Button shows loading/generating state during the process. | P0 |

### Job Detail — Company Brief

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-033 | Job Detail | On a job detail page where no company brief exists and LLM is available, verify a "Generate" button is shown in the Company Brief card. | Company Brief card is visible with a "Generate" button. | P1 |
| JOB-034 | Job Detail | Click the "Generate" button for the company brief. | Brief generates (loading spinner shown). Once complete, five sections appear: Product Overview, Tech Stack, Culture, Recent News, Key People. | P1 |
| JOB-035 | Job Detail | On a job with an existing company brief, click the "Refresh" button. | Brief regenerates. Loading spinner shown. Content updates with fresh data. | P2 |
| JOB-036 | Job Detail | On a job detail page when LLM is NOT available, verify the Company Brief card shows a lock icon and message indicating LLM is required. | A lock icon and "LLM required" message are displayed instead of the generate button. | P1 |

### Add Job — URL Import

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-037 | Add Job Dialog | On the job list page, click the "Add Job" button. | A dialog opens with two tabs: "Paste URL" (selected by default) and "Enter Manually". | P0 |
| JOB-038 | Add Job Dialog | In the "Paste URL" tab, enter a valid LinkedIn job URL (e.g., `https://www.linkedin.com/jobs/view/1234567890/`) and click "Import Job". | Button shows "Importing..." with spinner. On success, dialog closes and browser navigates to the newly created job's detail page. | P0 |
| JOB-039 | Add Job Dialog | In the "Paste URL" tab, enter an invalid URL (e.g., "not-a-url") and attempt to submit. | Form validation error appears below the input field. Submit is prevented. | P1 |
| JOB-040 | Add Job Dialog | In the "Paste URL" tab, submit an empty URL field. | Validation error shown. Submit prevented. | P1 |

### Add Job — Manual Entry

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-041 | Add Job Dialog | Click the "Enter Manually" tab. | Form switches to show manual entry fields: Job Title, Company Name, Company LinkedIn URL, Location, Description, Salary, Job Type, Remote, Apply Link. | P0 |
| JOB-042 | Add Job Dialog | Fill in all required fields (Job Title, Company Name, Company LinkedIn URL, Location, Description) and click "Add Job". | Button shows "Saving..." with spinner. On success, dialog closes and browser navigates to the new job's detail page. | P0 |
| JOB-043 | Add Job Dialog | Submit the manual form with required fields left empty. | Validation errors appear below each empty required field. Submit is prevented. | P1 |
| JOB-044 | Add Job Dialog | Enter an invalid URL in the "Company LinkedIn URL" field and submit. | Validation error appears for the URL field. | P1 |
| JOB-045 | Add Job Dialog | Click "Cancel" or close the dialog without submitting. | Dialog closes. No job is created. Form is reset when reopened. | P2 |

### Triage View — Bulk Actions

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-046 | Triage View | On the Triage view, verify each row has a checkbox in the first column. | Checkboxes are visible in the leftmost column of each row. | P0 |
| JOB-047 | Triage View | Click the checkbox in the table header row. | All checkboxes on the current page are selected. A bulk action bar appears above the table showing the count of selected items. | P0 |
| JOB-048 | Triage View | With jobs selected, click the "Applied" button in the bulk action bar. | All selected jobs have their status changed to "Applied". Success toast shown. Checkboxes deselect. Jobs may disappear from Triage view (since "Applied" is a Pipeline status). | P0 |
| JOB-049 | Triage View | Select a few jobs using individual checkboxes (not select all). Verify the count in the bulk action bar matches. | Bulk action bar shows the exact count of selected jobs. | P1 |
| JOB-050 | Triage View | With jobs selected, click "Later" in the bulk action bar. | Selected jobs' status changes to "Later". Success toast. | P1 |
| JOB-051 | Triage View | With jobs selected, click "Unfit" in the bulk action bar. | Selected jobs' status changes to "Unfit". Jobs disappear from Triage view (archived). Success toast. | P1 |
| JOB-052 | Triage View | With jobs selected, click the "More..." dropdown and select "Low Salary". | Selected jobs' status changes to "Low Salary". Jobs disappear from Triage view. | P1 |
| JOB-053 | Triage View | With jobs selected, click the "More..." dropdown and select "Expired". | Selected jobs' status changes to "Expired". | P2 |
| JOB-054 | Triage View | With jobs selected, click the "Deselect" button. | All checkboxes are deselected. Bulk action bar disappears. | P1 |

### Company Detail & Classification

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| JOB-055 | Company Detail | Navigate to a company detail page (click company name from a job detail). | Page loads with company name (h1), website link (if any), LinkedIn link (if any), and a Classification card showing Business Type, Industry, and Stage badges. | P0 |
| JOB-056 | Company Detail | Click the back link at the top. | Browser navigates back to `/jobs`. | P2 |
| JOB-057 | Company Detail | Click the "Edit" button (pencil icon) on the Classification card. | A dialog opens with three dropdown selects: Business Type, Industry, Stage. Each is pre-populated with the current values (or "Unclassified"). | P0 |
| JOB-058 | Classification Dialog | Change the Business Type to a different value and click "Save". | Dialog closes. Classification card updates to show the new Business Type badge. Success toast. | P0 |
| JOB-059 | Classification Dialog | Change Industry and Stage as well, then click "Save". | All three classification badges update. | P1 |
| JOB-060 | Classification Dialog | Click "Cancel" without making changes. | Dialog closes. No changes made. | P2 |
| JOB-061 | Company Detail | If website link exists, click it. | Opens company website in a new tab. | P2 |
| JOB-062 | Company Detail | If LinkedIn link exists, click it. | Opens company LinkedIn page in a new tab. | P2 |

---

## 12B. Resume Editing

### Profile Page

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-001 | Profile | Navigate to `/resume/profile` via the sidebar "Profile" link. | Page loads with "Profile" title, "Your personal information for resume generation" subtitle, and a form with fields: First name, Last name, Email, Phone number, GitHub handle, LinkedIn handle, Location. | P0 |
| RES-002 | Profile | Verify form fields are pre-populated with existing user data. | All fields that have saved values show their current values. | P0 |
| RES-003 | Profile | Modify the "First name" field and verify the "Save Changes" and "Cancel" buttons become enabled. | Both buttons become clickable (no longer grayed out/disabled). | P0 |
| RES-004 | Profile | Change "First name" to a new value and click "Save Changes". | Form saves. Success toast appears. Buttons become disabled again (form is no longer dirty). | P0 |
| RES-005 | Profile | Change a field and click "Cancel". | Form resets to the previously saved values. Buttons become disabled. | P1 |
| RES-006 | Profile | Clear the "First name" field (required) and attempt to save. | Validation error appears below the field (e.g., "Required"). Save button may be disabled or submit is prevented. | P1 |
| RES-007 | Profile | Enter an invalid email (e.g., "not-an-email") in the Email field and attempt to save. | Validation error appears indicating invalid email format. | P1 |
| RES-008 | Profile | Verify optional fields (Phone, GitHub, LinkedIn, Location) can be left empty and saved. | Form saves successfully with empty optional fields. | P2 |

### Headlines Page

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-009 | Headlines | Navigate to `/resume/headlines` via the sidebar "Headlines" link. | Page loads with "Headlines" title, subtitle, and either a table of existing headlines or an empty state message: "No headlines yet. Add your first headline." | P0 |
| RES-010 | Headlines | Click the "Add Headline" button (Plus icon). | A dialog opens with "Label" text input and "Summary" textarea fields. Both are empty. | P0 |
| RES-011 | Headlines | Fill in Label (e.g., "Senior Engineer") and Summary (e.g., "Full-stack engineer with 10 years of experience"), then click "Save". | Dialog closes. New headline appears in the table with the label and truncated summary. Success toast. | P0 |
| RES-012 | Headlines | Click the Edit button (pencil icon) on an existing headline. | Dialog opens with both fields pre-populated with the headline's current values. | P0 |
| RES-013 | Headlines | Modify the Label or Summary and click "Save". | Dialog closes. Table row updates with new values. Success toast. | P0 |
| RES-014 | Headlines | Click the Delete button (trash icon) on a headline. | A confirmation dialog appears asking to confirm deletion. | P0 |
| RES-015 | Headlines | Click "Delete" in the confirmation dialog. | Headline is removed from the table. Success toast. | P0 |
| RES-016 | Headlines | Click "Cancel" in the delete confirmation dialog. | Dialog closes. Headline remains. | P2 |
| RES-017 | Headlines | Try to save a headline with empty Label or Summary. | Validation errors appear. Save is prevented. | P1 |

### Experience Page — Companies

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-018 | Experience | Navigate to `/resume/experience` via the sidebar "Experience" link. | Page loads with "Work Experience" title, subtitle, and either company cards or empty state: "No companies yet. Add your first company to get started." | P0 |
| RES-019 | Experience | Click "Add Company" button (Plus icon). | A dialog opens with fields: Company Name, Business Domain, Display Name (optional), Website (optional). | P0 |
| RES-020 | Experience | Fill in Company Name (e.g., "Acme Corp") and Business Domain (e.g., "Cloud Infrastructure"), then click "Save". | Dialog closes. A new company card appears in the list. Success toast. | P0 |
| RES-021 | Experience | Click the Edit button (pencil icon) on a company card header. | Dialog opens with fields pre-populated. | P1 |
| RES-022 | Experience | Modify company details and click "Save". | Dialog closes. Card header updates with new values. Success toast. | P1 |
| RES-023 | Experience | Click the Delete button (trash icon) on a company card header. | Confirmation dialog appears warning about deleting the company and all its positions/bullets. | P1 |
| RES-024 | Experience | Confirm company deletion. | Company card disappears from the list. Success toast. | P1 |
| RES-025 | Experience | Click the expand/collapse chevron on a company card. | Card content toggles between expanded (showing locations and positions) and collapsed. | P1 |

### Experience Page — Positions

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-026 | Experience | Expand a company card. Click the "Add position" button (Plus icon) under the Positions section. | A dialog opens with fields: Title, Start Date, End Date, Summary (optional). | P0 |
| RES-027 | Experience | Fill in Title (e.g., "Senior Engineer"), Start Date (e.g., "2022-01"), End Date (e.g., "Present"), and click "Save". | Dialog closes. New position appears under the company with the title and date range displayed. Success toast. | P0 |
| RES-028 | Experience | Click the Edit button on an existing position. | Dialog opens with fields pre-populated. | P1 |
| RES-029 | Experience | Modify position fields and click "Save". | Position details update. Success toast. | P1 |
| RES-030 | Experience | Click the Delete button on a position. | Confirmation dialog appears. | P1 |
| RES-031 | Experience | Confirm position deletion. | Position disappears from the list. Success toast. | P1 |

### Experience Page — Bullet Points

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-032 | Experience | Under an existing position, locate the "Bullet Points" section. Add a new bullet point using the inline editor. | A new bullet point text field appears. Type text and confirm. Bullet is saved. | P0 |
| RES-033 | Experience | Edit an existing bullet point. | Bullet text is editable. Save changes. Updated text appears. | P1 |
| RES-034 | Experience | Delete a bullet point. | Bullet is removed from the list. | P1 |

### Experience Page — Locations

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-035 | Experience | Under an expanded company card, locate the "Locations" section. Add a new location. | Location editor allows adding a location string. Location appears in the list. | P1 |
| RES-036 | Experience | Edit an existing location. | Location text updates. | P2 |
| RES-037 | Experience | Delete a location. | Location is removed. | P2 |

### Skills Page

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-038 | Skills | Navigate to `/resume/skills` via the sidebar "Skills" link. | Page loads with "Skills" title, subtitle, and either skill category cards or empty state: "No skill categories yet. Add your first category to get started." | P0 |
| RES-039 | Skills | Click "Add Category" button (Plus icon). | A dialog opens with a "Category Name" text input. | P0 |
| RES-040 | Skills | Enter a category name (e.g., "Programming Languages") and click "Save". | Dialog closes. New category card appears. Success toast. | P0 |
| RES-041 | Skills | Click the Edit button on a skill category. | Dialog opens with category name pre-populated. | P1 |
| RES-042 | Skills | Modify the category name and click "Save". | Category card title updates. Success toast. | P1 |
| RES-043 | Skills | Click the Delete button on a skill category. | Confirmation dialog appears. Confirm to delete. Category and all its items are removed. | P1 |
| RES-044 | Skills | Within a skill category card, add a new skill item using the inline editor. | A new skill item appears within the category. | P0 |
| RES-045 | Skills | Edit an existing skill item. | Skill item text updates. | P1 |
| RES-046 | Skills | Delete a skill item. | Skill item is removed from the category. | P1 |
| RES-047 | Skills | Drag a skill category card to a different position in the list (reorder). | Category moves to the new position. Order is persisted (reload page to verify). | P1 |

### Education Page

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| RES-048 | Education | Navigate to `/resume/education` via the sidebar "Education" link. | Page loads with "Education" title, subtitle, and either education cards or empty state: "No education entries yet. Add your first degree or certification." | P0 |
| RES-049 | Education | Click the "Add Entry" button (Plus icon). | A dialog opens with fields: Degree Title, Institution Name, Graduation Year, Location. | P0 |
| RES-050 | Education | Fill in all fields (e.g., "B.S. Computer Science", "MIT", "2018", "Cambridge, MA") and click "Save". | Dialog closes. New education card appears showing degree icon, degree title, institution, year, and location. Success toast. | P0 |
| RES-051 | Education | Click Edit on an existing education entry. | Dialog opens with fields pre-populated. | P1 |
| RES-052 | Education | Modify fields and click "Save". | Card updates with new values. Success toast. | P1 |
| RES-053 | Education | Click Delete on an education entry. | Confirmation dialog appears. Confirm to delete. Entry is removed. | P1 |
| RES-054 | Education | Enter an invalid graduation year (e.g., "20", or "abcd") and attempt to save. | Validation error appears for the graduation year field. | P1 |

---

## 12C. Archetypes

### Archetype List

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| ARC-001 | Archetype List | Navigate to `/archetypes` via the sidebar "Archetypes" link. | Page loads with "Archetypes" title, subtitle, and either a table of archetypes or empty state: "No archetypes yet. Add your first archetype." | P0 |
| ARC-002 | Archetype List | Click the "Add Archetype" button (Plus icon). | Dialog opens with fields: Archetype Type (dropdown), Label, Description (optional), Headline (dropdown), Social Networks (tag input). | P0 |
| ARC-003 | Archetype List | Select an Archetype Type, enter a Label, select a Headline, and click "Save". | Dialog closes. New archetype appears in the table with type badge, label, and description. Success toast. | P0 |
| ARC-004 | Archetype List | Click the Edit button (pencil icon) on an existing archetype. | Dialog opens with fields pre-populated. The Archetype Type field is NOT editable (read-only or hidden). | P0 |
| ARC-005 | Archetype List | Modify the Label or Description and click "Save". | Table row updates. Success toast. | P1 |
| ARC-006 | Archetype List | Click the Delete button (trash icon) on an archetype. | Confirmation dialog appears warning that position/skill/education selections will also be removed. | P0 |
| ARC-007 | Archetype List | Confirm archetype deletion. | Archetype disappears from the table. Success toast. | P0 |
| ARC-008 | Archetype List | Click the View button (eye icon) on an archetype. | Browser navigates to `/archetypes/{archetypeId}`. Archetype detail page loads. | P0 |

### Archetype Detail — Metadata

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| ARC-009 | Archetype Detail | Navigate to an archetype detail page via the View button. | Page loads with: back link, archetype label (h1), type badge, Metadata section (label, description, headline, social networks), Positions section, Skills section, Education section. | P0 |
| ARC-010 | Archetype Detail | Click the back link at the top. | Browser navigates to `/archetypes`. | P2 |
| ARC-011 | Archetype Detail | In the Metadata section, click the Edit button (pencil icon). | Section switches to edit mode showing form fields: Label, Description, Headline (dropdown), Social Networks (tag input). | P0 |
| ARC-012 | Archetype Detail | Modify the Label and click "Save". | Metadata section returns to display mode with updated label. Header h1 updates. Success toast. | P0 |
| ARC-013 | Archetype Detail | Click "Cancel" while editing metadata. | Edit mode exits. No changes saved. Fields revert to original values. | P2 |

### Archetype Detail — Positions

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| ARC-014 | Archetype Detail | In the Positions section, click "Add Position". | A dialog opens allowing selection of a resume position (from experience data). Fields for title override, company name, location, summary, and bullet selection may be available. | P0 |
| ARC-015 | Archetype Detail | Select a resume position and click "Save" in the position dialog. | Position appears in the Positions section showing the title, company, date range, and bullet count. A "Save Positions" button may appear if changes are unsaved. | P0 |
| ARC-016 | Archetype Detail | Click "Save Positions" (if shown) to persist position selections. | Positions are saved to the API. Success toast. "Save Positions" button disappears. | P0 |
| ARC-017 | Archetype Detail | Drag a position to reorder it. | Position moves to the new location in the list. "Save Positions" button appears (dirty state). | P1 |
| ARC-018 | Archetype Detail | Click Delete on a position in the list. | Position is removed from the list. "Save Positions" button appears. | P1 |
| ARC-019 | Archetype Detail | Click Edit on a position. | Dialog opens with position details pre-populated. Allows editing overrides. | P1 |

### Archetype Detail — Skills

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| ARC-020 | Archetype Detail | In the Skills section, verify checkboxes for all skill categories are displayed. | Each skill category from the resume has a checkbox. Unchecked by default (unless already selected). | P0 |
| ARC-021 | Archetype Detail | Check a skill category checkbox. | Category's individual skill items appear (nested checkboxes, indented). All items are checked by default when category is checked. | P0 |
| ARC-022 | Archetype Detail | Uncheck individual skill items within a checked category. | Those specific items are deselected while the category remains checked. | P1 |
| ARC-023 | Archetype Detail | Uncheck a skill category checkbox. | All its items are also unchecked. Items disappear from view. | P1 |
| ARC-024 | Archetype Detail | Select 2+ skill categories. Verify a sortable reorder list appears. | A drag-to-reorder list shows the selected categories. Dragging changes their order. | P1 |
| ARC-025 | Archetype Detail | Click "Save Skills" to persist changes. | Skills are saved. Success toast. "Save Skills" button disappears. | P0 |

### Archetype Detail — Education

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| ARC-026 | Archetype Detail | In the Education section, verify checkboxes for all education entries are displayed. | Each education entry from the resume has a checkbox. | P0 |
| ARC-027 | Archetype Detail | Check one or more education entries. | Entries are selected. If 2+ selected, a sortable reorder list appears. | P0 |
| ARC-028 | Archetype Detail | Reorder selected education entries by dragging. | Order updates visually. "Save Education" button appears. | P1 |
| ARC-029 | Archetype Detail | Click "Save Education" to persist. | Education selections saved. Success toast. "Save Education" button disappears. | P0 |

---

## 12D. Interview Prep

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| INT-001 | Job Detail — Brief | Navigate to a job detail page for a job whose company has NO existing brief. Verify the Company Brief card shows a "Generate" button (LLM required). | Company Brief card is visible. If LLM is available, a "Generate" button is shown. If LLM is not available, a lock icon with message is shown. | P0 |
| INT-002 | Job Detail — Brief | (LLM available) Click "Generate" on the Company Brief card. | Loading spinner appears. After generation completes, the card displays five sections: Product Overview, Tech Stack, Culture, Recent News, Key People. | P0 |
| INT-003 | Job Detail — Brief | Navigate to a job whose company already has a brief generated. Verify the five sections are displayed. | All five brief sections render with content: Product Overview, Tech Stack, Culture, Recent News, Key People. | P1 |
| INT-004 | Job Detail — Brief | Click the "Refresh" button on an existing brief. | Loading spinner appears. Brief content updates after regeneration. | P1 |
| INT-005 | Job Detail — Brief | (LLM NOT available) Verify the Company Brief card shows a lock icon and message. | Lock icon visible. Text indicating LLM is required. No generate/refresh buttons. | P1 |

---

## 12E. Cross-Cutting

### LLM-Free Mode

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| CC-001 | Job Detail | With no OPENAI_API_KEY set, navigate to a job detail page. Verify the resume generation section shows archetype selector + keywords input instead of a simple "Generate Resume" button. | Archetype dropdown and keywords text input are visible. "Generate Resume" button is present. No "Generate" button without archetype selection. | P0 |
| CC-002 | Job Detail | (LLM-free) Select an archetype and click "Generate Resume" without entering keywords. | PDF downloads successfully using the selected archetype without LLM-extracted keywords. | P0 |
| CC-003 | Job Detail | (LLM-free) Select an archetype, enter keywords (e.g., "react, node, aws"), click "Generate Resume". | PDF downloads. Keywords are incorporated into the resume. | P1 |

### Navigation & Sidebar

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| CC-004 | Sidebar | Verify the sidebar contains three groups: Discovery (with Triage, Pipeline, Archive, All Jobs links), Resume (with Profile, Headlines, Experience, Skills, Education links), Templates (with Archetypes link). | All sidebar links are visible and correctly grouped. | P0 |
| CC-005 | Sidebar | Click "Triage" in the sidebar. | Navigates to `/jobs?view=triage`. | P0 |
| CC-006 | Sidebar | Click "Pipeline" in the sidebar. | Navigates to `/jobs?view=pipeline`. | P0 |
| CC-007 | Sidebar | Click "Archive" in the sidebar. | Navigates to `/jobs?view=archive`. | P1 |
| CC-008 | Sidebar | Click "All Jobs" in the sidebar. | Navigates to `/jobs?view=all`. | P1 |
| CC-009 | Sidebar | Click each Resume section link: Profile, Headlines, Experience, Skills, Education. | Each navigates to the corresponding `/resume/*` route. | P0 |
| CC-010 | Sidebar | Click "Archetypes" in the sidebar. | Navigates to `/archetypes`. | P0 |
| CC-011 | Sidebar | Verify the currently active page is highlighted/indicated in the sidebar. | The sidebar link for the current page has a distinct visual style (active state). | P1 |
| CC-012 | Sidebar | Verify the theme toggle is present in the sidebar footer. Click it to toggle between light and dark mode. | Theme switches. UI colors change accordingly. | P2 |

### Error Handling

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| CC-013 | 404 | Navigate to a non-existent route (e.g., `http://localhost:5173/nonexistent`). | A 404 page or redirect to a known page is shown. The app does not crash. | P1 |
| CC-014 | Job Detail | Navigate to `/jobs/99999999` (a non-existent job ID). | An appropriate error state is shown (error message or redirect). The app does not crash or show a blank page. | P1 |

### Loading States

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| CC-015 | Job List | Observe the job list page during initial load (hard refresh). | Skeleton loaders or loading indicators are shown while data loads. Table appears once data arrives. | P1 |
| CC-016 | Profile | Observe the profile page during initial load. | Skeleton loaders are shown for form fields while data loads. Fields populate once data arrives. | P2 |
| CC-017 | Headlines | Observe the headlines page during initial load. | Skeleton rows (3) are shown while data loads. | P2 |
| CC-018 | Experience | Observe the experience page during initial load. | Skeleton cards (3) are shown while data loads. | P2 |
| CC-019 | Archetypes | Observe the archetypes page during initial load. | Skeleton rows are shown while data loads. | P2 |

### Root Redirect

| ID | Page/Area | Test case | Expected result | Priority |
|---|---|---|---|---|
| CC-020 | Root | Navigate to `http://localhost:5173/`. | Browser redirects to `/jobs` (the job list page). | P0 |

---

## Summary

| Area | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| 12A. Job Browsing | 19 | 27 | 7 | 53 |
| 12B. Resume Editing | 13 | 20 | 4 | 37 |
| 12C. Archetypes | 12 | 8 | 2 | 22 |
| 12D. Interview Prep | 2 | 3 | 0 | 5 |
| 12E. Cross-Cutting | 6 | 6 | 5 | 17 |
| **Total** | **52** | **64** | **18** | **134** |
