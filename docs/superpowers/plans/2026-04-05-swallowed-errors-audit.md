# Swallowed Errors Audit

## Context

Full-project audit for errors that are caught but silently discarded, masking bugs or making debugging difficult. Searched all `.ts`/`.tsx` files across every package.

## Findings

### 1. Overly broad catch blocks in application use cases (MEDIUM)

**8 use cases** catch *any* exception from `findByIdOrFail` / `findAccomplishmentOrFail` and convert it to a generic "not found" error, discarding the original:

| File | Line(s) |
|------|---------|
| `application/src/use-cases/experience/UpdateAccomplishment.ts` | 18, 25 |
| `application/src/use-cases/experience/AddAccomplishment.ts` | 18 |
| `application/src/use-cases/experience/DeleteExperience.ts` | 13 |
| `application/src/use-cases/experience/DeleteAccomplishment.ts` | 15, 21 |
| `application/src/use-cases/experience/UpdateExperience.ts` | 24 |
| `application/src/use-cases/education/UpdateEducation.ts` | 21 |
| `application/src/use-cases/headline/UpdateHeadline.ts` | 25 |
| `application/src/use-cases/headline/DeleteHeadline.ts` | 13 |

**Problem:** If the repository throws a database connection error, ORM error, or timeout, the catch block returns `err(new Error("Experience not found: ..."))` - masking the real failure. The caller sees "not found" when the DB might be down.

**Note:** `DeleteEducation.ts` does this correctly - it preserves the original error:
```typescript
catch (error) {
  return err(error instanceof Error ? error : new Error(String(error)));
}
```

**Fix:** Either:
- (a) Narrow the catch to only handle the specific `NotFoundError` thrown by `findByIdOrFail`, letting other errors propagate, or
- (b) Follow the `DeleteEducation` pattern and preserve the original error

---

### 2. Fire-and-forget double mutation in accomplishment reordering (HIGH)

**File:** `web/src/components/resume/experience/AccomplishmentListEditor.tsx:29-30, 37-38`

```typescript
updateAccomplishment.mutate({ accomplishmentId: current.id, ordinal: above.ordinal });
updateAccomplishment.mutate({ accomplishmentId: above.id, ordinal: current.ordinal });
```

**Problem:** Two mutations fire without awaiting or coordinating. If the first fails, the second still executes, potentially leaving ordinals in an inconsistent state (e.g., two items with the same ordinal). Neither mutation has `onError` handling.

**Fix:** Use `mutateAsync` with `Promise.all`, or wrap in a single backend endpoint for atomic reorder.

---

### 3. Floating `.then()` on mutation promise (LOW-MEDIUM)

**File:** `web/src/components/companies/CompanyFormModal.tsx:154-161`

```typescript
const mutation = isEdit
  ? updateCompany.mutateAsync({ id: company.id, ...payload })
  : createCompany.mutateAsync(payload);

mutation.then(
  () => { resetAll(); onOpenChange(false); toast.success(...); },
  () => toast.error(...)
);
```

**Problem:** The `.then()` result is not returned or awaited - it's a floating promise. While the rejection handler exists (so the error isn't truly swallowed), this pattern can cause state updates after unmount. The idiomatic TanStack pattern is `mutate()` with `onSuccess`/`onError` callbacks instead.

**Fix:** Use `mutate()` with callbacks instead of `mutateAsync().then()`.

---

### 4. Unguarded `JSON.parse` in Claude CLI providers (MEDIUM)

**Files:**
- `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts:36, 45`
- `infrastructure/src/services/ClaudeCliCompanySearchProvider.ts:34, 41`

```typescript
const parsed = JSON.parse(output);          // line 36 - could throw on malformed output
const data = typeof raw === 'string' ? JSON.parse(raw) : raw;  // line 45 - same
```

**Problem:** If Claude CLI returns non-JSON output (e.g., an error message in plaintext), `JSON.parse` throws an unhandled error with a cryptic message like `Unexpected token ...`. The error propagates to the global handler but lacks context about what was being parsed or why.

**Fix:** Wrap in try-catch with a descriptive error message that includes a truncated snippet of the unparseable output.

---

### 5. Silent empty-array return on unexpected data shape (LOW)

**File:** `infrastructure/src/services/ClaudeCliCompanySearchProvider.ts:43`

```typescript
if (!Array.isArray(data)) return [];
```

**Problem:** If the parsed response is a valid JSON object but not an array, the function silently returns an empty array. The UI shows "no results" instead of indicating a parsing failure. No logging occurs.

**Fix:** Log a warning via `this.log.warn(...)` when the shape is unexpected.

---

### 6. `Promise.race` ignores process exit codes (LOW)

**Files:**
- `infrastructure/dev/dev-up.ts:106`
- `infrastructure/dev/wt-up.ts:156`

```typescript
await Promise.race([apiProc.exited, webProc.exited]);
shutdown();
```

**Problem:** When either process exits, `shutdown()` is called without checking the exit code. A crash (exit code > 0) produces the same behavior as a clean shutdown. No log indicates which process failed or why.

**Fix:** Check the exit code from the race winner and log it before shutting down.

---

### Intentional / Acceptable (no action needed)

These were reviewed and are fine as-is:

| File | Pattern | Why it's OK |
|------|---------|-------------|
| `core/src/FsUtil.ts:9` | `exists()` returns false on any error | Standard file-exists utility |
| `infrastructure/dev/wt-up.ts:166` | Best-effort cleanup catch | Teardown after failure |
| `infrastructure/dev/WorktreeSession.ts:57` | `deleteSession()` ignores missing file | Idempotent cleanup |
| `infrastructure/dev/e2e-start-servers.ts:116` | Health-check polling ignores fetch errors | Retry loop with timeout |
| `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts:87` | `applyLogoFromDomain` returns original on failure | Optional enrichment |
| `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts:104` | `urlExists` returns false on error | Boolean utility |
| `infrastructure/dev/guard-main.ts:11` | Catches and logs error message, exits 1 | CLI script |
| `api/src/routes/company/UpdateCompanyRoute.ts:27` | Catches "not found", rethrows others | Correct selective handling |
| `application/src/use-cases/education/DeleteEducation.ts:14` | Preserves original error in Result | Good pattern |

## Implementation plan

### Step 1: Fix overly broad catch blocks in use cases

For each of the 8 affected use cases, change the bare `catch` to check for the specific error type from `findByIdOrFail`. If it's not a "not found" error, rethrow it. Alternatively, follow the `DeleteEducation.ts` pattern.

### Step 2: Fix accomplishment reordering race condition

Coordinate the two mutations in `AccomplishmentListEditor.tsx` with `Promise.all` on `mutateAsync` and add error handling.

### Step 3: Fix CompanyFormModal floating promise

Replace `mutateAsync().then()` with `mutate()` + `onSuccess`/`onError` callbacks.

### Step 4: Add guarded JSON.parse in Claude CLI providers

Wrap the 4 `JSON.parse` calls with try-catch that provides context in the error message.

### Step 5: Add logging for unexpected data shapes

Add `this.log.warn(...)` in `ClaudeCliCompanySearchProvider.parseResponse` when data is not an array.

### Step 6: Log exit codes in dev scripts

Check and log the exit code from `Promise.race` in `dev-up.ts` and `wt-up.ts`.

## Verification

```bash
bun run typecheck
bun run check
bun run test
bun run --cwd infrastructure test:integration
```
