# Milestone 8 — Job Triaging

Lifecycle-driven job management UI. Jobs should be triaged, tracked through stages, and resurfaced when needed.

## 8A + 8B: View-Based Job Navigation + Triage Bulk Actions

Replace the single-status dropdown with four preset views on the existing `/jobs` page, controlled by a `view` search param:

| View | Statuses | Default sort |
|---|---|---|
| **Triage** (default) | NEW, LATER | score desc |
| **Pipeline** | APPLIED, RECRUITER_SCREEN, TECHNICAL_SCREEN, HM_SCREEN, ON_SITE, OFFER | posted_at desc |
| **Archive** | All 10 DISCARDED statuses | posted_at desc |
| **All** | No filter | score desc |

### Sidebar

Expand Discovery nav group from one "Jobs" link to four: Triage, Pipeline, Archive, All Jobs. Each uses TanStack Router `Link` with `search` prop.

### View tabs + sub-filter

A tab bar above the table for view switching. Within each view, a status sub-filter dropdown narrows to a single status within that view's group.

### Triage bulk actions

When view is `triage`:
- Checkbox column (first column) for row selection. Header checkbox = select all on page.
- Bulk action bar appears when selection is non-empty: quick buttons for Later, Applied, Unfit + dropdown for other statuses.
- Selection clears on page change.

### Reopen archived jobs

On job detail page, when status is discarded, show a "Reopen" button that sets status to NEW via the existing `PUT /jobs/:id/status` endpoint.

### Backend: bulk status change

- `PUT /jobs/bulk-status` — `{ job_ids: string[], status: JobStatus }` → `{ data: { updated: number } }`
- `BulkChangeJobStatus` use case iterates jobs and calls `job.changeStatus()` on each (preserves domain events).
- DI token + composition root wiring.

## 8C: Apply Button with ATS Platform Detection

Pure frontend. Parse `applyLink` URL hostname to detect ATS platform. Display "Apply on {Platform}" instead of plain "Apply" on job detail page.

Platform lookup table (hostname → name):
- `boards.greenhouse.io`, `job-boards.greenhouse.io` → Greenhouse
- `jobs.lever.co` → Lever
- `*.myworkdayjobs.com` → Workday
- `jobs.ashbyhq.com` → Ashby
- `*.jobvite.com` → Jobvite
- `*.taleo.net` → Taleo
- `*.icims.com` → iCIMS
- `*.breezy.hr` → Breezy
- `*.applytojob.com` → Rippling
- `*.smartrecruiters.com` → SmartRecruiters

Falls back to plain "Apply" for unrecognized domains or null `applyLink`.

Utility: `web/src/lib/ats-platform.ts` — `detectAtsPlatform(url: string): { name: string } | null`.

## 8D: Experience Titles

Add `jobTitle: string | null` to `ResumeCompany` across all layers:

- **Domain**: new field on entity + create props
- **Application**: DTO, CreateCompany input, UpdateCompany input, ListCompanies mapping
- **Infrastructure**: ORM column `job_title text NULL`, migration, repository mapping
- **API**: `job_title` in CreateCompany and UpdateCompany route body schemas
- **Web**: "Job Title" input in CompanyFormDialog, display as "Title at Company" on CompanyCard
