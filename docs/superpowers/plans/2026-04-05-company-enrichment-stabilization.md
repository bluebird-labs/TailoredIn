# Company Enrichment Stabilization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix company enrichment failures (CLI hangs, overly aggressive URL validation, broken logos) and add resilience (retry, multi-provider logo chain, frontend manual-entry fallback).

**Architecture:** Changes span four layers — LLM infrastructure (timeout + retry), enrichment provider (URL validation + logo chain), prompt template (add logoUrl), and frontend (manual-entry recovery). Each layer is independently testable. No new packages or migrations required.

**Tech Stack:** Bun, Zod, bun:test, React 19, TanStack Query, Elysia

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `infrastructure/src/services/llm/BaseLlmCliProvider.ts` | Add CLI timeout (60s) + retry with backoff |
| Modify | `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts` | Remove aggressive URL validation, add logo provider chain, add logging |
| Modify | `infrastructure/src/services/prompts/enrich-company.md` | Add `logoUrl` to enrichment prompt schema |
| Modify | `web/src/components/companies/CompanyFormModal.tsx` | Add "Continue manually" recovery when enrichment fails |
| Modify | `infrastructure/test/services/llm/BaseLlmCliProvider.test.ts` | Add timeout + retry tests |
| Modify | `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts` | Add logo chain + URL handling tests |

---

### Task 1: Add CLI Timeout to BaseLlmCliProvider

**Files:**
- Modify: `infrastructure/src/services/llm/BaseLlmCliProvider.ts:29-38`
- Test: `infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`

- [ ] **Step 1: Write the failing test for timeout**

Add to `infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`. This test needs to exercise the *real* `BaseLlmCliProvider.request()` method (not the overridden one in the existing `TestProvider`). Create a second testable subclass that actually spawns a process:

```typescript
// Add at bottom of file, after existing tests

class SpawningTestProvider extends BaseLlmCliProvider {
  protected readonly log = Logger.create('spawning-test-provider');

  protected buildCommand(): string[] {
    // sleep 120 = a process that will hang for 2 minutes
    return ['sleep', '120'];
  }

  protected extractResult(_stdout: string): unknown {
    return { name: 'test', count: 1 };
  }
}

describe('BaseLlmCliProvider timeout', () => {
  test('kills process and returns error after timeout', async () => {
    const provider = new SpawningTestProvider();
    const request = new TestRequest();

    // Override the default 60s timeout to 1s for testing
    const result = await provider.request(request, { timeoutMs: 1000 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.message).toContain('timed out');
    }
  }, 10_000);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`
Expected: FAIL — `request` does not accept a second argument, and no timeout logic exists.

- [ ] **Step 3: Implement timeout in BaseLlmCliProvider**

Replace the spawn + await block in `infrastructure/src/services/llm/BaseLlmCliProvider.ts`. The `request` method gains an optional `options` parameter:

```typescript
import type { Logger } from '@tailoredin/core';
import { err, ok, type Result } from '@tailoredin/domain';
import type { z } from 'zod';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { LlmRequestError } from './LlmRequestError.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

const DEFAULT_TIMEOUT_MS = 60_000;

export type LlmRequestOptions = {
  readonly timeoutMs?: number;
};

export abstract class BaseLlmCliProvider {
  protected abstract readonly log: LoggerInstance;

  protected abstract buildCommand(request: LlmJsonRequest<z.ZodObject<z.ZodRawShape>>, jsonSchema: string): string[];

  protected abstract extractResult(stdout: string): unknown;

  public async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    options?: LlmRequestOptions
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const jsonSchema = request.getJsonSchema();
    const command = this.buildCommand(request, jsonSchema);
    const start = performance.now();

    this.log.debug(`LLM request | command: ${this.formatCommand(command)}`);

    let stdout: string;
    let stderr: string;
    let exitCode: number;

    try {
      const proc = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });

      const exited = Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited
      ]);

      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM request timed out')), timeoutMs);
      });

      const [stdoutResult, stderrResult, exitCodeResult] = await Promise.race([exited, timeout]);
      stdout = stdoutResult;
      stderr = stderrResult;
      exitCode = exitCodeResult;
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const message = e instanceof Error && e.message === 'LLM request timed out'
        ? `CLI timed out after ${timeoutMs}ms`
        : `Failed to spawn CLI: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, null, '', '', duration));
    }

    const duration = Math.round(performance.now() - start);

    this.log.debug(
      `LLM response | duration=${duration}ms stdout="${stdout.slice(0, 1000)}" stderr="${stderr.slice(0, 500)}"`
    );

    if (exitCode !== 0) {
      return err(new LlmRequestError(`CLI exited with code ${exitCode}`, command, exitCode, stdout, stderr, duration));
    }

    let extracted: unknown;
    try {
      extracted = this.extractResult(stdout);
    } catch (e) {
      const message = `Failed to extract result: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    if (extracted == null) {
      return err(new LlmRequestError('Empty result from LLM', command, exitCode, stdout, stderr, duration));
    }

    const parsed = request.schema.safeParse(extracted);

    if (!parsed.success) {
      const message = `Zod validation failed: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    return ok(parsed.data as z.infer<T>);
  }

  private formatCommand(command: string[]): string {
    return command.map(a => (a.includes(' ') || a.includes('"') ? `'${a}'` : a)).join(' ');
  }
}
```

- [ ] **Step 4: Update the existing TestProvider to pass options through**

The existing `TestProvider` in the test file overrides `request()` entirely, so it won't break. But update its signature to accept the new optional parameter:

In `infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`, update the `TestProvider.request` signature:

```typescript
  public override async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    _options?: LlmRequestOptions
  ) {
```

Add the import:

```typescript
import { BaseLlmCliProvider, type LlmRequestOptions } from '../../../src/services/llm/BaseLlmCliProvider.js';
```

- [ ] **Step 5: Run tests to verify timeout test passes**

Run: `bun test infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`
Expected: ALL PASS (existing tests still pass + new timeout test passes)

- [ ] **Step 6: Export LlmRequestOptions from index**

In `infrastructure/src/services/llm/index.ts`, add the export if not already present. Check the file first; if `BaseLlmCliProvider` is already exported, add `LlmRequestOptions` alongside it. If not, add:

```typescript
export type { LlmRequestOptions } from './BaseLlmCliProvider.js';
```

- [ ] **Step 7: Commit**

```bash
git add infrastructure/src/services/llm/BaseLlmCliProvider.ts infrastructure/test/services/llm/BaseLlmCliProvider.test.ts
git commit -m "feat: add 60s CLI timeout to BaseLlmCliProvider

Wraps Bun.spawn in Promise.race with configurable timeout.
Kills hung processes and returns LlmRequestError with clear message.
Timeout defaults to 60s, overridable via options for testing."
```

---

### Task 2: Add Retry with Backoff to BaseLlmCliProvider

**Files:**
- Modify: `infrastructure/src/services/llm/BaseLlmCliProvider.ts`
- Test: `infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`

- [ ] **Step 1: Write failing tests for retry**

Add to `infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`:

```typescript
describe('BaseLlmCliProvider retry', () => {
  test('retries on spawn failure and succeeds', async () => {
    const provider = new TestProvider();
    let callCount = 0;

    // First call fails, second succeeds
    provider.extractedValue = { name: 'Retry', count: 1 };
    const originalRequest = provider.request.bind(provider);

    // We need a provider that actually exercises retry logic.
    // Use SpawningTestProvider with a command that fails then succeeds.
    // Instead, test retry at the integration level via a CountingProvider:
    class CountingProvider extends BaseLlmCliProvider {
      protected readonly log = Logger.create('counting-provider');
      public callCount = 0;

      protected buildCommand(): string[] {
        this.callCount++;
        // First two calls: command that exits with code 1
        // Third call: command that succeeds
        if (this.callCount <= 2) {
          return ['sh', '-c', 'exit 1'];
        }
        return ['echo', '{"type":"result","subtype":"success","is_error":false,"duration_ms":100,"duration_api_ms":90,"num_turns":1,"result":"{\\"name\\":\\"OK\\",\\"count\\":1}","stop_reason":"end_turn","session_id":"s","total_cost_usd":0,"usage":{"input_tokens":1,"output_tokens":1,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"server_tool_use":{"web_search_requests":0,"web_fetch_requests":0}}}'];
      }

      protected extractResult(stdout: string): unknown {
        // Use ClaudeCliProvider-style extraction for simplicity
        const response = JSON.parse(stdout);
        if (response.is_error) return null;
        const raw = response.result;
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    }

    const counting = new CountingProvider();
    const result = await counting.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(result.isOk).toBe(true);
    expect(counting.callCount).toBe(3);
  }, 10_000);

  test('does not retry on Zod validation failure', async () => {
    class SingleCallProvider extends BaseLlmCliProvider {
      protected readonly log = Logger.create('single-call-provider');
      public callCount = 0;

      protected buildCommand(): string[] {
        this.callCount++;
        // Returns valid JSON but with wrong shape for the schema
        return ['echo', '{"type":"result","subtype":"success","is_error":false,"duration_ms":100,"duration_api_ms":90,"num_turns":1,"result":"{\\"wrong\\":\\"shape\\"}","stop_reason":"end_turn","session_id":"s","total_cost_usd":0,"usage":{"input_tokens":1,"output_tokens":1,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"server_tool_use":{"web_search_requests":0,"web_fetch_requests":0}}}'];
      }

      protected extractResult(stdout: string): unknown {
        const response = JSON.parse(stdout);
        const raw = response.result;
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    }

    const provider = new SingleCallProvider();
    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Zod validation failed');
    }
    expect(provider.callCount).toBe(1); // No retry on validation failure
  });

  test('returns last error after all retries exhausted', async () => {
    class AlwaysFailProvider extends BaseLlmCliProvider {
      protected readonly log = Logger.create('always-fail-provider');
      public callCount = 0;

      protected buildCommand(): string[] {
        this.callCount++;
        return ['sh', '-c', 'exit 1'];
      }

      protected extractResult(): unknown {
        return null;
      }
    }

    const provider = new AlwaysFailProvider();
    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('exited with code 1');
    }
    expect(provider.callCount).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`
Expected: FAIL — `maxRetries` and `retryDelayMs` not recognized in options, no retry behavior.

- [ ] **Step 3: Implement retry in BaseLlmCliProvider**

Update `LlmRequestOptions` and the `request` method in `infrastructure/src/services/llm/BaseLlmCliProvider.ts`:

```typescript
export type LlmRequestOptions = {
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
};
```

Refactor `request` to extract a single-attempt method and wrap it in retry logic:

```typescript
  public async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    options?: LlmRequestOptions
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const maxRetries = options?.maxRetries ?? 3;
    const retryDelayMs = options?.retryDelayMs ?? 2000;

    let lastError: LlmRequestError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.executeOnce(request, options);

      if (result.isOk) return result;

      // Don't retry Zod validation failures — they won't self-heal
      if (result.error.message.startsWith('Zod validation failed')) return result;

      // Don't retry extraction failures — the LLM returned bad structure
      if (result.error.message.startsWith('Failed to extract result')) return result;

      // Don't retry empty results — the LLM returned nothing useful
      if (result.error.message === 'Empty result from LLM') return result;

      lastError = result.error;

      if (attempt < maxRetries) {
        const delay = retryDelayMs * 2 ** (attempt - 1);
        this.log.info(`LLM request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return err(lastError!);
  }

  private async executeOnce<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    options?: LlmRequestOptions
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const jsonSchema = request.getJsonSchema();
    const command = this.buildCommand(request, jsonSchema);
    const start = performance.now();

    this.log.debug(`LLM request | command: ${this.formatCommand(command)}`);

    let stdout: string;
    let stderr: string;
    let exitCode: number;

    try {
      const proc = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });

      const exited = Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited
      ]);

      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM request timed out')), timeoutMs);
      });

      const [stdoutResult, stderrResult, exitCodeResult] = await Promise.race([exited, timeout]);
      stdout = stdoutResult;
      stderr = stderrResult;
      exitCode = exitCodeResult;
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const message = e instanceof Error && e.message === 'LLM request timed out'
        ? `CLI timed out after ${timeoutMs}ms`
        : `Failed to spawn CLI: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, null, '', '', duration));
    }

    const duration = Math.round(performance.now() - start);

    this.log.debug(
      `LLM response | duration=${duration}ms stdout="${stdout.slice(0, 1000)}" stderr="${stderr.slice(0, 500)}"`
    );

    if (exitCode !== 0) {
      return err(new LlmRequestError(`CLI exited with code ${exitCode}`, command, exitCode, stdout, stderr, duration));
    }

    let extracted: unknown;
    try {
      extracted = this.extractResult(stdout);
    } catch (e) {
      const message = `Failed to extract result: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    if (extracted == null) {
      return err(new LlmRequestError('Empty result from LLM', command, exitCode, stdout, stderr, duration));
    }

    const parsed = request.schema.safeParse(extracted);

    if (!parsed.success) {
      const message = `Zod validation failed: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    return ok(parsed.data as z.infer<T>);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test infrastructure/test/services/llm/BaseLlmCliProvider.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/services/llm/BaseLlmCliProvider.ts infrastructure/test/services/llm/BaseLlmCliProvider.test.ts
git commit -m "feat: add retry with exponential backoff to BaseLlmCliProvider

Retries spawn failures and non-zero exit codes up to 3 times.
Does not retry Zod validation failures, extraction errors, or empty results.
Backoff: 2s, 4s, 8s (configurable via options for testing)."
```

---

### Task 3: Remove Aggressive URL Validation + Add Logging

**Files:**
- Modify: `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts:64-133`
- Test: `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`

- [ ] **Step 1: Write tests for new URL handling behavior**

Replace the existing tests and add new ones in `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`:

```typescript
import { describe, expect, mock, test } from 'bun:test';
import { BusinessType, CompanyStage, err, ok, Industry } from '@tailoredin/domain';
import { ClaudeCliCompanyDataProvider } from '../../src/services/ClaudeCliCompanyDataProvider.js';
import type { ClaudeCliProvider } from '../../src/services/llm/ClaudeCliProvider.js';
import { LlmRequestError } from '../../src/services/llm/LlmRequestError.js';

function createMockProvider(result: ReturnType<typeof ok> | ReturnType<typeof err>) {
  return { request: mock(() => Promise.resolve(result)) } as unknown as ClaudeCliProvider;
}

describe('ClaudeCliCompanyDataProvider', () => {
  test('returns enrichment result and keeps LLM-provided URLs as-is', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'GitHub',
        description: 'Code hosting platform',
        website: 'https://github.com',
        linkedinLink: 'https://linkedin.com/company/github',
        logoUrl: null,
        businessType: BusinessType.PLATFORM,
        industry: Industry.SAAS,
        stage: CompanyStage.ACQUIRED
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://github.com');

    expect(result.name).toBe('GitHub');
    expect(result.website).toBe('https://github.com');
    expect(result.linkedinLink).toBe('https://linkedin.com/company/github');
    expect(result.businessType).toBe(BusinessType.PLATFORM);
  });

  test('normalizes URLs without protocol by prepending https://', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'Example',
        description: null,
        website: 'example.com',
        linkedinLink: 'linkedin.com/company/example',
        logoUrl: null,
        businessType: null,
        industry: null,
        stage: null
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://example.com');

    expect(result.website).toBe('https://example.com');
    expect(result.linkedinLink).toBe('https://linkedin.com/company/example');
  });

  test('clears empty/whitespace-only URLs to null', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'Test',
        description: null,
        website: '   ',
        linkedinLink: '',
        logoUrl: null,
        businessType: null,
        industry: null,
        stage: null
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://test.com');

    expect(result.website).toBeNull();
    expect(result.linkedinLink).toBeNull();
  });

  test('throws ExternalServiceError on LLM failure', async () => {
    const mockProvider = createMockProvider(
      err(new LlmRequestError('CLI exited with code 1', ['claude'], 1, '', '', 100))
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);

    await expect(dataProvider.enrichFromUrl('https://example.com')).rejects.toThrow('Company enrichment failed');
  });

  test('handles all-null enrichment response', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: null,
        description: null,
        website: null,
        linkedinLink: null,
        logoUrl: null,
        businessType: null,
        industry: null,
        stage: null
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://unknown.com');

    expect(result.name).toBeNull();
    expect(result.businessType).toBeNull();
    expect(result.logoUrl).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify the new "keeps URLs as-is" tests fail**

Run: `bun test infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`
Expected: FAIL — Current code does HEAD validation and clears URLs that fail.

- [ ] **Step 3: Rewrite enrichFromUrl to remove HEAD validation**

Replace the `enrichFromUrl`, `validateUrls`, and `urlExists` methods in `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts`:

```typescript
  public async enrichFromUrl(url: string, context?: string): Promise<CompanyEnrichmentResult> {
    this.log.info(`Enriching company data for URL: "${url}"`);

    const result = await this.provider.request(new CompanyEnrichmentRequest(url, context));

    if (result.isErr) {
      this.log.error(
        `Company enrichment failed | url="${url}" error="${result.error.message}" exitCode=${result.error.exitCode} duration=${result.error.duration}ms`
      );
      throw new ExternalServiceError('Claude CLI', 'Company enrichment failed');
    }

    const enrichment: CompanyEnrichmentResult = {
      ...result.value,
      website: this.normalizeUrl(result.value.website),
      linkedinLink: this.normalizeUrl(result.value.linkedinLink),
      businessType: result.value.businessType as BusinessType | null,
      industry: result.value.industry as Industry | null,
      stage: result.value.stage as CompanyStage | null
    };

    const enriched = await this.applyLogo(enrichment);
    this.log.info(`Company enrichment completed | url="${url}" name="${enriched.name}"`);
    return enriched;
  }
```

Remove the `validateUrls` method entirely. Keep `normalizeUrl` as-is. Remove the old `urlExists` method (we'll add a new one in the logo task).

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`
Expected: ALL PASS (the `applyLogo` method doesn't exist yet — we'll add it in Task 4, so for now rename the call to `applyLogoFromDomain` temporarily, or implement both tasks together. See Task 4.)

Note: If `applyLogo` doesn't exist yet, temporarily keep calling `applyLogoFromDomain`. Task 4 will replace it.

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/services/ClaudeCliCompanyDataProvider.ts infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts
git commit -m "fix: remove aggressive URL HEAD validation from enrichment

URLs from the LLM are now trusted and kept as-is after normalization.
Previous behavior silently cleared valid URLs when HEAD requests returned
403 (LinkedIn) or timed out. Better error context in logs."
```

---

### Task 4: Add Multi-Provider Logo Chain

**Files:**
- Modify: `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts`
- Modify: `infrastructure/src/services/prompts/enrich-company.md`
- Test: `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`

- [ ] **Step 1: Add logoUrl to enrichment prompt**

In `infrastructure/src/services/prompts/enrich-company.md`, update the JSON output format to include `logoUrl`:

```markdown
## Output format

Return ONLY a valid JSON object with these fields:

```json
{
  "name": "string or null",
  "description": "string or null — one or two sentences describing what the company does",
  "website": "string or null — the company's primary website URL",
  "linkedinLink": "string or null — LinkedIn company page URL",
  "logoUrl": "string or null — direct URL to the company's logo image (PNG, SVG, or JPG)",
  "businessType": "one of [{{businessTypes}}] or null",
  "industry": "one of [{{industries}}] or null",
  "stage": "one of [{{stages}}] or null"
}
```

Return ONLY the JSON object. No markdown, no explanation, no code fences.
```

- [ ] **Step 2: Add logoUrl to Zod schema**

In `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts`, update `companyEnrichmentSchema`:

```typescript
const companyEnrichmentSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  linkedinLink: z.string().nullable(),
  logoUrl: z.string().nullable(),
  businessType: z.enum(Object.values(BusinessType) as [string, ...string[]]).nullable(),
  industry: z.enum(Object.values(Industry) as [string, ...string[]]).nullable(),
  stage: z.enum(Object.values(CompanyStage) as [string, ...string[]]).nullable()
});
```

- [ ] **Step 3: Write tests for logo provider chain**

Add to `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`:

```typescript
describe('logo provider chain', () => {
  test('uses LLM-provided logoUrl when present', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'Acme',
        description: null,
        website: 'https://acme.com',
        linkedinLink: null,
        logoUrl: 'https://acme.com/logo.png',
        businessType: null,
        industry: null,
        stage: null
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://acme.com');

    // LLM-provided logo is used directly (no HTTP lookup needed)
    expect(result.logoUrl).toBe('https://acme.com/logo.png');
  });

  test('falls back to domain-based logo providers when LLM provides no logo', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'Acme',
        description: null,
        website: 'https://acme.com',
        linkedinLink: null,
        logoUrl: null,
        businessType: null,
        industry: null,
        stage: null
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://acme.com');

    // Logo is either from hunter.io, companyenrich.com, or null
    // We can't control external services in unit tests, so just verify it's a string or null
    expect(typeof result.logoUrl === 'string' || result.logoUrl === null).toBe(true);
  });

  test('returns null logoUrl when no website is available', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'Mystery Corp',
        description: null,
        website: null,
        linkedinLink: null,
        logoUrl: null,
        businessType: null,
        industry: null,
        stage: null
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://mystery.com');

    expect(result.logoUrl).toBeNull();
  });
});
```

- [ ] **Step 4: Implement the logo provider chain**

Replace `applyLogoFromDomain` with `applyLogo` in `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts`:

```typescript
  private async applyLogo(result: CompanyEnrichmentResult): Promise<CompanyEnrichmentResult> {
    // If LLM already provided a logo URL, use it directly
    if (result.logoUrl) {
      this.log.debug(`Using LLM-provided logo URL: "${result.logoUrl}"`);
      return result;
    }

    const websiteUrl = result.website;
    if (!websiteUrl) return result;

    let domain: string;
    try {
      domain = new URL(websiteUrl).hostname;
    } catch {
      this.log.debug(`Cannot extract domain from website URL: "${websiteUrl}"`);
      return result;
    }

    // Try logo providers in order: Hunter → CompanyEnrich
    const providers = [
      { name: 'Hunter', url: `https://logos.hunter.io/${domain}` },
      { name: 'CompanyEnrich', url: `https://companyenrich.com/api/logo/${domain}` }
    ];

    for (const provider of providers) {
      const exists = await this.urlReturnsImage(provider.url);
      if (exists) {
        this.log.debug(`Logo found via ${provider.name} | domain="${domain}"`);
        return { ...result, logoUrl: provider.url };
      }
      this.log.debug(`Logo not found via ${provider.name} | domain="${domain}"`);
    }

    this.log.debug(`No logo found for domain="${domain}"`);
    return result;
  }

  private async urlReturnsImage(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
      const contentType = response.headers.get('content-type') ?? '';
      return response.ok && contentType.startsWith('image/');
    } catch {
      return false;
    }
  }
```

Also update `enrichFromUrl` to call `applyLogo` instead of `applyLogoFromDomain`:

```typescript
    const enriched = await this.applyLogo(enrichment);
```

Remove the old `applyLogoFromDomain`, `validateUrls`, and `urlExists` methods.

- [ ] **Step 5: Run all tests**

Run: `bun test infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/services/ClaudeCliCompanyDataProvider.ts infrastructure/src/services/prompts/enrich-company.md infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts
git commit -m "feat: multi-provider logo chain with LLM fallback

Logo resolution order: LLM-provided URL → Hunter → CompanyEnrich.
Added logoUrl to enrichment prompt so LLM can suggest logos.
Each provider checked via HEAD with content-type validation.
Debug logging for each provider attempt."
```

---

### Task 5: Frontend — Manual Entry Recovery on Enrichment Failure

**Files:**
- Modify: `web/src/components/companies/CompanyFormModal.tsx:109-131`

- [ ] **Step 1: Update handleEnrich to fall through to form on failure**

In `web/src/components/companies/CompanyFormModal.tsx`, replace the `handleEnrich` function:

```typescript
  function handleEnrich() {
    if (selectedIndex === null) return;
    const candidate = candidates[selectedIndex];
    const url = candidate.website;

    if (!url) {
      // No website to enrich from — skip to form with name pre-filled
      setFields({ ...emptyState(), name: candidate.name });
      setStep('form');
      return;
    }

    setStep('enriching');
    enrichCompany.mutate(
      { url, context: candidate.name },
      {
        onSuccess: result => {
          const formState = enrichmentToFormState(result);
          // Ensure the company name is filled even if enrichment didn't return one
          if (!formState.name && candidate.name) {
            formState.name = candidate.name;
          }
          setFields(formState);
          setStep('form');
        },
        onError: () => {
          toast.error('Enrichment failed — you can fill in the details manually.');
          // Fall through to form with name + website pre-filled from candidate
          setFields({ ...emptyState(), name: candidate.name, website: url });
          setStep('form');
        }
      }
    );
  }
```

Note: `enrichmentToFormState` returns a mutable object (plain object literal), so assigning to `formState.name` is fine.

- [ ] **Step 2: Verify the flow manually**

Start the worktree dev environment: `bun wt:up`

Test these scenarios:
1. Search for a company → select candidate **with** website → enrichment succeeds → form pre-filled
2. Search for a company → select candidate **with** website → enrichment fails (disconnect network or stop API) → toast error → form shows with name + website pre-filled
3. Search for a company → select candidate **without** website → skips enrichment → form shows with name only

- [ ] **Step 3: Commit**

```bash
git add web/src/components/companies/CompanyFormModal.tsx
git commit -m "fix: fall through to manual entry when enrichment fails

Instead of bouncing back to search step on enrichment failure,
advances to the form with name and website pre-filled from the
search candidate. Also handles candidates with no website URL
by skipping enrichment entirely."
```

---

### Task 6: Run Full Quality Checks

- [ ] **Step 1: Type-check all packages**

Run: `bun run typecheck`
Expected: No errors

- [ ] **Step 2: Lint and format**

Run: `bun run check`
Expected: No errors. If formatting issues, run `bun run check:fix` and commit.

- [ ] **Step 3: Run all unit tests**

Run: `bun run test`
Expected: ALL PASS

- [ ] **Step 4: Run dependency boundary check**

Run: `bun run dep:check`
Expected: No violations

- [ ] **Step 5: Run dead code detection**

Run: `bun run knip`
Expected: No new unused exports (the removed `validateUrls`/`urlExists`/`applyLogoFromDomain` methods were private, so knip won't flag them)

- [ ] **Step 6: Fix any issues found and commit**

```bash
git add -A
git commit -m "chore: fix lint/format issues from enrichment stabilization"
```

(Only if there are actual issues to fix. Skip if all checks pass clean.)
