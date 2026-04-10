# Type Safety & Error Handling Audit

**Date:** 2026-04-10

---

## 1. Swallowed Errors

### 1.1 `.catch(() => null)` — silent JSON parse failures (HIGH)

**File:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/hooks/use-resume.ts`
**Lines:** 16, 41, 77

```typescript
const json = await response.json().catch(() => null);
throw new Error((json as { error?: { message?: string } } | null)?.error?.message ?? 'Failed to generate PDF');
```

Three mutations (`useGenerateResumePdf`, `useUpdateResumeDisplaySettings`, `useGenerateResumeContent`) all follow this pattern. When `response.json()` fails, the actual parse error is discarded and replaced with a generic fallback message.

**Why it exists:** The server might return non-JSON error responses (e.g. 502 from a reverse proxy), so parsing needs to be guarded. The intent is "try to extract a server error message, otherwise use a default."

**Potential fix:** Log the original error before falling back. A small helper like `tryParseErrorBody(response): Promise<string | null>` would centralise this and could `console.error` the parse failure for debugging while still falling back gracefully.

---

### 1.2 Empty catch block in teardown (LOW)

**File:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/dev/wt-up.ts`
**Lines:** 191-193

```typescript
} catch {
  /* best effort */
}
```

**Why it exists:** Teardown/cleanup code — if stopping Docker or removing a volume fails, there is nothing meaningful to do.

**Potential fix:** Acceptable as-is for cleanup code. Could add a `console.warn` for debuggability, but not required.

---

### 1.3 Log-only catch in file logging (LOW)

**File:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/services/llm/BaseLlmApiProvider.ts`
**Lines:** 180-182

```typescript
} catch {
  this.log.warn('Failed to write LLM prompt log file');
}
```

**Why it exists:** Writing debug log files to disk is best-effort. Failing to log should not break an LLM request.

**Potential fix:** Acceptable as-is. The warn message could include the caught error for debuggability (`this.log.warn('Failed to write LLM prompt log file', { error })`).

---

### 1.4 Silent fallback in file download (MEDIUM)

**File:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/atelier/AtelierPdfPreview.tsx`
**Lines:** 111-113

```typescript
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') return;
}
```

**Why it exists:** The File System Access API (`showSaveFilePicker`) throws `AbortError` when the user cancels. The code catches that, but any other error (permission denied, disk full) is also silently swallowed because the catch block doesn't rethrow non-AbortErrors.

**Potential fix:** Rethrow when the error is not an `AbortError`:

```typescript
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') return;
  throw err;
}
```

---

## 2. `any` Usage

### 2.1 Library type mismatches (production code)

| File | Line | Code | Reason |
|---|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/core/src/InspectUtil.ts` | 8 | `data: any` | Wraps `util.inspect` which genuinely accepts any value |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/services/llm/ClaudeApiProvider.ts` | 42 | `as any` | `zodToJsonSchema` return type doesn't match Anthropic SDK's `JsonSchema` type |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresCompanyRepository.ts` | 19 | `props as any` | MikroORM `FilterQuery` type mismatch with custom PK on `upsert` |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/lib/api-error.ts` | 10, 13 | `type EdenRouteSegment = any`, `type EdenError = any` | Eden Treaty loses type inference on parameterized routes and error shapes |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/companies/CompanyFormModal.tsx` | 193 | `result: any` | Mutation result type varies between create/update in shared `onSuccess` callback |

All five are annotated with `// biome-ignore` comments explaining the reason. They are all third-party library boundary issues.

**Potential fixes:**

- **InspectUtil** — genuinely correct; `util.inspect` accepts `any`. No fix needed.
- **ClaudeApiProvider** — could use `as unknown as JsonSchema` if the SDK exports the type, making the cast explicit about the target. Worth revisiting when `zod-to-json-schema` or the Anthropic SDK update their types.
- **PostgresCompanyRepository** — MikroORM generic issue. Could be fixed upstream or worked around with a type-narrowing helper. Low priority.
- **api-error.ts** — Eden Treaty limitation. Could be reduced by contributing types upstream or wrapping Eden's error in a typed adapter. Low priority unless Eden is upgraded.
- **CompanyFormModal** — could be fixed by splitting the `onSuccess` callback or using a discriminated union. Worth a small refactor.

### 2.2 Generated code

| File | Lines | Code | Reason |
|---|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/routeTree.gen.ts` | 27, 32, 37, 42, 47, 52, 57, 63, 68, 73 | `} as any)` | Auto-generated by TanStack Router — not user-maintained |

No action needed — this file is regenerated on every route change.

### 2.3 `@ts-expect-error` suppressions

| File | Line | Reason |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Accomplishment.ts` | 18 | MikroORM decorator types don't support `mapToPk` with string PKs |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/GenerationPrompt.ts` | 18 | Same MikroORM `mapToPk` issue |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/core/src/ObjectUtil.ts` | 7 | TS considers merge type too complex; guarded by `TDepth` generic |

**Potential fix:** The two MikroORM suppressions could be removed if MikroORM fixes `mapToPk` types for string PKs. Worth checking on MikroORM upgrades. The ObjectUtil suppression is a TS inference limit — no practical fix.

---

## 3. `unknown` Usage

### 3.1 JSONB schema storage (correct)

| File | Line | Code |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ResumeContent.ts` | 12, 39, 55 | `schema: Record<string, unknown> \| null` |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/ports/ResumeContentGenerator.ts` | 33 | `requestSchema: Record<string, unknown>` |

**Why:** These store arbitrary JSON schemas returned by the LLM. `Record<string, unknown>` is the correct type for unstructured JSONB data — no fix needed.

### 3.2 Generic base class constraint (correct)

| File | Line | Code |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/ValueObject.ts` | 1 | `ValueObject<T extends Record<string, unknown>>` |

Standard generic constraint for value objects — no fix needed.

### 3.3 Test mocks: `as unknown as <Type>` (correct for tests)

19 occurrences across test files in `application/test/` and `infrastructure/test/`. All follow the pattern:

```typescript
const mockRepo = { findById: mock(async () => entity) } as unknown as SomeRepository;
```

**Why:** Partial mock objects don't satisfy the full interface type, so the double-cast through `unknown` is required. This is standard TypeScript test practice.

**Potential fix:** None needed. Could introduce a test utility like `mockOf<T>(partial: Partial<T>): T` to reduce boilerplate, but the current approach is safe and clear.

### 3.4 Query parameter typing (correct)

| File | Line | Code |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/scripts/generate-database-diagram.ts` | 70 | `params: unknown[]` |
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/routes/atelier.tsx` | 10 | `validateSearch: (search: Record<string, unknown>)` |

SQL bind parameters and raw query strings are correctly `unknown`. TanStack Router's `validateSearch` receives untyped search params by design — no fix needed.

### 3.5 Browser API typing (correct)

| File | Line | Code |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/routes/profile/index.tsx` | 215 | `showSaveFilePicker?: (opts: unknown) => ...` |

Optional File System Access API — `unknown` is correct for the options param since the API is not in all TS libs.

### 3.6 Test setup window cast (correct)

| File | Lines | Code |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/test/setup.ts` | 8, 17 | `window as Record<string, unknown>` |

Accessing dynamic window properties in test setup — standard pattern, no fix needed.

### 3.7 Catch clause (correct)

| File | Line | Code |
|---|---|---|
| `/Users/sylvainestevez/Documents/Projects/TailoredIn/core/src/FsUtil.ts` | 9 | `catch (_err: unknown)` |

Standard catch typing — no fix needed.

---

## Summary

| Category | Count | Action needed |
|---|---|---|
| Swallowed errors | 4 locations | Fix `AtelierPdfPreview` rethrow; improve `use-resume.ts` error logging |
| `any` in production code | 5 locations | All at library boundaries with comments; 1 refactorable (`CompanyFormModal`) |
| `any` in generated code | 10 locations | None (auto-generated) |
| `@ts-expect-error` | 3 locations | Monitor for upstream fixes |
| `unknown` (correct usage) | ~30 locations | None — all appropriate |

The codebase is in good shape. The `any` usages are narrowly scoped and documented. The `unknown` usages are all correct. The main actionable items are the error-swallowing patterns in `use-resume.ts` and `AtelierPdfPreview.tsx`.
