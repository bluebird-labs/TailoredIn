# UX Guidelines

Behavioral UX patterns for TailoredIn. For visual tokens and component styling, see `design-system.md`.

---

## 1. Editing & Forms

### Content-First Click-to-Edit

All data fields render as plain text by default. The user clicks a section to enter edit mode.

- Section hover shows a warm amber background wash (`bg-accent/40`) with pointer cursor
- Click transforms the section into an editor with form fields
- Each section has its own inline **Save** (primary) and **Discard** (ghost) buttons
- Only one section can be in edit mode at a time (mutual exclusion via `EditableSectionProvider`)
- Clicking another section while one is editing: if current is clean, it closes silently; if dirty, user must save/discard first
- Escape key discards changes (if clean) or does nothing (if dirty)
- Save button shows spinner during mutation, both buttons disabled

### Edit Granularity

Edit sections are scoped to the domain aggregate boundary:
- **Profile page:** One section for the entire Profile aggregate
- **List pages:** Each list item (education, company) is its own editable section
- **Detail pages:** Each section (e.g., experience Details, Summary, Skills, individual Accomplishments) is its own editable inline section

### Inline Expand for Lists

Simple-entity list items (Education, Companies) expand in-place when clicked:
- Card displays content in resting state
- Click expands card to reveal form fields with Save/Discard
- Only one card can be expanded at a time within a list

### Detail Page Inline Editing

Complex entities like Experiences (with nested Accomplishments) use inline editing on a detail page. The detail page has editable sections for:
- Details section
- Summary section
- Skills section
- Individual Accomplishments (each is its own editable section)

Editing respects the same mutual exclusion rules: only one section can be in edit mode at a time via `EditableSectionProvider`.

The `FormModal` shared component is used for:
- Create flows for any entity type

### Dirty Tracking

- Compare current field values against the last-saved snapshot
- Dirty fields get a subtle **left border accent** (2px `--primary` at 30% opacity)
- The SaveBar shows a count: "N unsaved changes"

### Validation

- Fires **on save attempt only** — never on blur or keystroke
- Invalid fields get a `--destructive` border color
- Error message appears inline below the field in `text-destructive text-xs`
- Required fields are marked with `*` next to the label
- Validation runs client-side before the API call; API errors are also displayed inline if they map to specific fields

### Modal Forms (High Data Density)

Prefer modals over inline editing when creating or editing entities with **3 or more fields**. Modals provide focused context, prevent accidental navigation, and keep the list/parent view visible behind the overlay.

**When to use modals:**
- Creating a new entity (experience, education, company)
- Editing an entity with high field count where inline editing would be disorienting

**When NOT to use modals:**
- Single-field edits (use inline EditableField)
- Profile-level fields that are always visible (use page-level always-editable pattern)

**Modal behavior:**
- Use the `FormModal` shared component
- Footer: Save (primary, disabled until dirty) + Cancel (ghost)
- Cancel with dirty fields triggers `ConfirmDialog`: "You have unsaved changes. Discard?"
- Close (X) and overlay click behave identically to Cancel
- **Stacked modals:** See the "Stacked Modals" section below for explicit depth treatment
- Validation fires on save attempt only — same rules as inline forms

### Stacked Modals

When a second dialog opens over an existing modal (e.g., discard confirmation over an edit form):

- **Background modal:** `scale(0.90)`, `blur(1.5px)`, `opacity: 0.5`, with `200ms` transition
- **Between-modal overlay:** `rgba(0, 0, 0, 0.15)`
- **Foreground modal:** enhanced shadow `0 16px 48px rgba(0,0,0,0.2)`
- Triggered automatically when `FormModal` detects a nested dialog is open
- Does **not** apply to popovers, dropdowns, or tooltips overlapping a modal
- Content scrolls if form exceeds viewport height (`max-h-[60vh]`)

---

## 2. Loading, Empty & Error States

### Initial Load

- **Skeleton placeholders** matching the content layout
- One skeleton per aggregate section (not per field)
- Use the existing shadcn `<Skeleton>` component

### Empty States

- Centered within the content area
- Muted text (`text-muted-foreground`) with a brief message
- Optional CTA button (primary variant) below: e.g., "No experiences yet — Add one"
- No illustrations (keep it minimal)

### Mutation In-Flight

- Save button shows spinner + "Saving..." text, disabled
- Fields remain visible and editable (no overlay)
- On success: toast confirmation, SaveBar disappears, dirty state clears
- On failure: `toast.error()` AND dirty state preserved so user can retry

### Error Recovery

- Network errors: toast with retry suggestion
- Validation errors: inline below fields (see above)
- 500 errors: toast with generic message, dirty state preserved

---

## 3. Feedback & Notifications

### Toasts (Sonner)

Use for **transient** confirmations:

- Save success: `toast.success('Changes saved')`
- Delete success: `toast.success('Item deleted')`
- Network/server errors: `toast.error('Failed to save. Please try again.')`
- Auto-dismiss: ~4 seconds

### Inline Messages

Use for **persistent** feedback tied to a location:

- Validation errors below fields
- Empty state messages within content areas
- These persist until the condition is resolved

### Confirmation Dialogs (AlertDialog)

Required for **destructive** actions:

- Deleting an aggregate or entity
- Discarding many unsaved changes
- Never for routine saves or non-destructive actions
- Dialog includes: clear title, description of consequences, Cancel (outline) + destructive action button (destructive variant)

---

## 4. Navigation & Data Safety

### Unsaved Changes Guard

- If any aggregate has dirty fields, navigating away triggers a confirmation dialog: "You have unsaved changes. Leave without saving?"
- Two buttons: "Stay" (primary) and "Leave" (ghost/destructive)
- Hooks into TanStack Router's `beforeLoad` / navigation blocking
- Also hooks `window.beforeunload` to catch tab close / browser back

### Post-Save Behavior

- Stay on the same page after saving
- Toast confirmation
- No automatic redirects

---

## 5. Detail Pages

### When to Use Detail Pages

Use a dedicated detail page (full route) for entities that have:
- Nested sub-entities (e.g., experiences with accomplishments, companies with job descriptions)
- Cross-entity references (e.g., experiences linking to companies)
- Enough content to warrant tabbed organization

Keep modal/inline editing for entities that are simple and flat (education).

### Layout Structure

Detail pages follow a consistent structure:

1. **Breadcrumb** — `Parent / Current` with the parent as a link
2. **Header** — Logo/avatar, title (h1), meta badges/text, action buttons (Edit, external links)
3. **Tabs** — Section navigation with count badges for lists
4. **Content** — Tab-specific content using `InfoCard` components

### Read-Only Default

Detail pages are **information-oriented** by default. All data displays as plain text in `InfoCard` components. Editing is only accessible via the Edit button in the header, which opens the entity's existing `FormModal`.

### Navigation

- Clicking a card in a list navigates to the detail page (not opens a modal)
- Cards use `<Link>` from TanStack Router, not `<button>` with onClick
- Breadcrumb links navigate back to the parent list
- Cross-entity links (e.g., linked company on an experience) navigate to that entity's detail page

### Linked Entity Card

When a detail page references another entity, display it as a `LinkedEntityCard`:
- Logo/initial + name + meta text + arrow icon
- Clickable — navigates to the linked entity's detail page
- Hover treatment: `bg-accent/40` warm amber wash, `border-primary/30`

### Side Panel (Optional)

For detail pages with supplementary information (e.g., experience overview), use a side panel layout:
- Main content column: `1fr`
- Side panel: fixed `280px`
- Side panel contains: linked entity cards, quick stats
