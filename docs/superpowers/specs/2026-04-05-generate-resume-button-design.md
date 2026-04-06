# Generate Resume Button — Design Spec

**Date:** 2026-04-05
**Status:** Ready for implementation
**Target branch:** main (after `vectorized-bubbling-horizon` lands)

## Context

The `POST /resume/generate` endpoint was implemented in `vectorized-bubbling-horizon`. It takes a `jobDescriptionId` and returns tailored resume bullets for each work experience, framed to match the target JD.

This spec covers adding a **"Generate Resume"** button to the job description detail page that calls the endpoint and displays the structured bullet output.

## Endpoint

```
POST /resume/generate
Body: { "jobDescriptionId": "<uuid>" }

Response:
{
  "data": {
    "experiences": [
      {
        "experienceId": "uuid",
        "experienceTitle": "Senior Engineer",
        "companyName": "Acme Corp",
        "bullets": [
          "Led migration of monolithic architecture to microservices, cutting deployment time by 60%.",
          "..."
        ]
      }
    ]
  }
}
```

## Feature Description

### Trigger

A **"Generate Resume"** button on the job description detail page (wherever the JD actions are — top bar, sidebar, or action menu). The button should be visually distinct (primary or accent) to indicate it's the main CTA for a JD.

### Behavior

1. User clicks "Generate Resume" on a JD detail page
2. A loading state is shown on the button (spinner, disabled)
3. The API call fires: `POST /resume/generate` with the current JD's id
4. On success: a **modal or drawer** opens showing the generated bullets organized by experience
5. On error: a toast notification with a clear message

### Output display (modal/drawer)

- Title: "Generated Resume Content" (or similar)
- Subtitle: the JD title
- One section per experience, in order:
  - **Experience title** + **company name** as section header
  - Bulleted list of generated bullets
- A **"Copy all"** button that copies the full output as plain text (one bullet per line, grouped by experience) to the clipboard
- Optional: individual copy button per experience section

### Loading UX

- Generation takes 10–30s (Haiku model). The button should show a spinner + "Generating…" label while in flight.
- The modal should not open until the response is received (not optimistic).

## Implementation notes for next session

### Before coding

1. Read the JD detail page component to understand current layout and action patterns
2. Read the Eden Treaty client (`web/src/api.ts` or similar) to understand how to type the new endpoint call
3. Check existing `useMutation` patterns in the web app for the right hook shape
4. Check the design system spec for modal/drawer conventions

### API call (Eden Treaty)

The endpoint will be accessible via the typed client. Look for how other POST mutations are called — pattern is roughly:

```typescript
const mutation = useMutation({
  mutationFn: () => api.resume.generate.post({ jobDescriptionId: jd.id }),
});
```

Exact path depends on how Elysia route is registered — check `web/src/api.ts` or the Eden client type.

### Key files to read on main

- JD detail page component (find via router or `web/src/`)
- `web/src/api.ts` (or wherever Eden Treaty client is defined)
- An existing modal usage (search for `Dialog` or `Sheet` in web/src/)
- An existing `useMutation` usage for a POST endpoint
- Design system spec if present (`docs/` or `web/src/components/`)

### Constraints

- Use existing shadcn/ui components (`Dialog` or `Sheet` for the result panel, `Button`, `Spinner`)
- Follow existing mutation + toast patterns — do not introduce new patterns
- The JD id is available from the route params on the detail page
- Do not add any new routes — this is a modal flow entirely within the JD detail page
