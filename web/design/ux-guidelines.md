# UX Guidelines

Behavioral UX patterns for TailoredIn. For visual tokens and component styling, see `design-system.md`.

---

## 1. Editing & Forms

### Always-Editable Fields

All data fields render as inputs by default. There is no read-only display mode and no "edit" toggle. The field IS the display.

- Text fields render as `<Input>` or `<Textarea>`
- Selects render as `<Select>`
- Date fields render as `<MonthYearPicker>`
- Labels are always visible above the field

### Aggregate-Scoped Save

Saving is explicit and scoped to the domain aggregate boundary:

- A **sticky footer bar** (SaveBar) slides up at the bottom of the aggregate's section when any field within it is dirty
- Contains **Save** (primary) and **Discard** (ghost) buttons
- Disappears on successful save or discard
- Save button shows a spinner and disables during mutation

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
