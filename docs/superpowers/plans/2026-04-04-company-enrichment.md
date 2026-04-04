# Company Enrichment from URL — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to enrich company data from a URL via Claude CLI, preview the result, then save the company.

**Architecture:** Two use cases (`EnrichCompanyData` + `CreateCompany`) with a `CompanyDataProvider` port in the application layer. `ClaudeCliCompanyDataProvider` in infrastructure shells out to `claude` CLI with a JSON schema prompt. Two API routes (`POST /companies/enrich` and `POST /companies`).

**Tech Stack:** Bun, Elysia, MikroORM, `claude` CLI via `Bun.spawn()`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `application/src/ports/CompanyDataProvider.ts` | Port interface + `CompanyEnrichmentResult` type |
| Create | `application/src/use-cases/company/EnrichCompanyData.ts` | Use case: delegates to port, returns preview |
| Create | `application/src/use-cases/company/CreateCompany.ts` | Use case: creates domain entity, persists, returns DTO |
| Create | `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts` | Adapter: shells out to `claude` CLI |
| Create | `api/src/routes/company/EnrichCompanyRoute.ts` | `POST /companies/enrich` |
| Create | `api/src/routes/company/CreateCompanyRoute.ts` | `POST /companies` |
| Create | `application/test/use-cases/company/EnrichCompanyData.test.ts` | Unit test for enrich use case |
| Create | `application/test/use-cases/company/CreateCompany.test.ts` | Unit test for create use case |
| Create | `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts` | Unit test for CLI adapter |
| Modify | `application/src/dtos/CompanyDto.ts` | Fix `linkedinLink` to `string \| null`, add `toCompanyDto()` |
| Modify | `application/src/ports/index.ts` | Export new port |
| Modify | `application/src/use-cases/index.ts` | Export new use cases |
| Modify | `application/src/dtos/index.ts` | Export `toCompanyDto` |
| Modify | `infrastructure/src/DI.ts` | Add `DataProvider`, `Enrich`, `Create` tokens |
| Modify | `infrastructure/src/index.ts` | Export `ClaudeCliCompanyDataProvider` |
| Modify | `api/src/container.ts` | Bind new services and use cases |
| Modify | `api/src/index.ts` | Mount new routes |

---

## Task 1: CompanyDataProvider Port

**Files:**
- Create: `application/src/ports/CompanyDataProvider.ts`
- Modify: `application/src/ports/index.ts`

- [ ] **Step 1: Create port file**

```typescript
// application/src/ports/CompanyDataProvider.ts
import type { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';

export type CompanyEnrichmentResult = {
  name: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};

export interface CompanyDataProvider {
  enrichFromUrl(url: string): Promise<CompanyEnrichmentResult>;
}
```

- [ ] **Step 2: Update ports barrel**

Replace the comment-only contents of `application/src/ports/index.ts` with:

```typescript
export type { CompanyDataProvider, CompanyEnrichmentResult } from './CompanyDataProvider.js';
```

- [ ] **Step 3: Update application barrel**

Add to `application/src/index.ts`:

```typescript
export type * from './ports/index.js';
```

- [ ] **Step 4: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add application/src/ports/CompanyDataProvider.ts application/src/ports/index.ts application/src/index.ts
git commit -m "feat: add CompanyDataProvider port interface"
```

---

## Task 2: Fix CompanyDto + Add toCompanyDto Helper

**Files:**
- Modify: `application/src/dtos/CompanyDto.ts`
- Modify: `application/src/dtos/index.ts`

- [ ] **Step 1: Write the test**

Create `application/test/use-cases/company/toCompanyDto.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Company, CompanyId } from '@tailoredin/domain';
import { toCompanyDto } from '../../../src/dtos/CompanyDto.js';

describe('toCompanyDto', () => {
  test('maps domain Company to CompanyDto', () => {
    const company = new Company({
      id: new CompanyId('abc-123'),
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    });

    const dto = toCompanyDto(company);

    expect(dto).toEqual({
      id: 'abc-123',
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null
    });
  });

  test('maps null linkedinLink correctly', () => {
    const company = new Company({
      id: new CompanyId('abc-456'),
      name: 'SomeCo',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    });

    const dto = toCompanyDto(company);

    expect(dto.linkedinLink).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/company/toCompanyDto.test.ts`
Expected: FAIL — `toCompanyDto` does not exist yet

- [ ] **Step 3: Fix CompanyDto type and create toCompanyDto**

Update `application/src/dtos/CompanyDto.ts`:

```typescript
import type { BusinessType, Company, CompanyStage, Industry } from '@tailoredin/domain';

export type CompanyDto = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};

export function toCompanyDto(company: Company): CompanyDto {
  return {
    id: company.id.value,
    name: company.name,
    website: company.website,
    logoUrl: company.logoUrl,
    linkedinLink: company.linkedinLink,
    businessType: company.businessType,
    industry: company.industry,
    stage: company.stage
  };
}
```

Note: `linkedinLink` changed from `string` to `string | null` to match domain reality.

- [ ] **Step 4: Update dtos barrel**

In `application/src/dtos/index.ts`, change the CompanyDto line to:

```typescript
export type { CompanyDto } from './CompanyDto.js';
export { toCompanyDto } from './CompanyDto.js';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test application/test/use-cases/company/toCompanyDto.test.ts`
Expected: PASS

- [ ] **Step 6: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add application/src/dtos/CompanyDto.ts application/src/dtos/index.ts application/test/use-cases/company/toCompanyDto.test.ts
git commit -m "feat: fix CompanyDto linkedinLink nullability, add toCompanyDto helper"
```

---

## Task 3: EnrichCompanyData Use Case

**Files:**
- Create: `application/src/use-cases/company/EnrichCompanyData.ts`
- Create: `application/test/use-cases/company/EnrichCompanyData.test.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Write the test**

Create `application/test/use-cases/company/EnrichCompanyData.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '../../../src/ports/CompanyDataProvider.js';
import { EnrichCompanyData } from '../../../src/use-cases/company/EnrichCompanyData.js';

function mockProvider(result: CompanyEnrichmentResult): CompanyDataProvider {
  return {
    enrichFromUrl: async () => result
  };
}

describe('EnrichCompanyData', () => {
  test('delegates to CompanyDataProvider and returns result', async () => {
    const enrichmentResult: CompanyEnrichmentResult = {
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null
    };

    const useCase = new EnrichCompanyData(mockProvider(enrichmentResult));
    const result = await useCase.execute({ url: 'https://github.com' });

    expect(result).toEqual(enrichmentResult);
  });

  test('returns nulls when provider cannot determine fields', async () => {
    const emptyResult: CompanyEnrichmentResult = {
      name: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    };

    const useCase = new EnrichCompanyData(mockProvider(emptyResult));
    const result = await useCase.execute({ url: 'https://unknown-company.example' });

    expect(result.name).toBeNull();
    expect(result.website).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/company/EnrichCompanyData.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the use case**

Create `application/src/use-cases/company/EnrichCompanyData.ts`:

```typescript
import type { CompanyDataProvider, CompanyEnrichmentResult } from '../../ports/CompanyDataProvider.js';

export type EnrichCompanyDataInput = {
  url: string;
};

export class EnrichCompanyData {
  public constructor(private readonly companyDataProvider: CompanyDataProvider) {}

  public async execute(input: EnrichCompanyDataInput): Promise<CompanyEnrichmentResult> {
    return this.companyDataProvider.enrichFromUrl(input.url);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test application/test/use-cases/company/EnrichCompanyData.test.ts`
Expected: PASS

- [ ] **Step 5: Update use-cases barrel**

Add to `application/src/use-cases/index.ts`:

```typescript
export type { EnrichCompanyDataInput } from './company/EnrichCompanyData.js';
export { EnrichCompanyData } from './company/EnrichCompanyData.js';
```

- [ ] **Step 6: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add application/src/use-cases/company/EnrichCompanyData.ts application/test/use-cases/company/EnrichCompanyData.test.ts application/src/use-cases/index.ts
git commit -m "feat: add EnrichCompanyData use case"
```

---

## Task 4: CreateCompany Use Case

**Files:**
- Create: `application/src/use-cases/company/CreateCompany.ts`
- Create: `application/test/use-cases/company/CreateCompany.test.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Write the test**

Create `application/test/use-cases/company/CreateCompany.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { BusinessType, type Company, type CompanyRepository, type CompanyCreateProps, CompanyId, Industry } from '@tailoredin/domain';
import { CreateCompany } from '../../../src/use-cases/company/CreateCompany.js';

function mockCompanyRepo(onSave?: (c: Company) => void): CompanyRepository {
  return {
    findById: async () => null,
    upsertByLinkedinLink: async () => {
      throw new Error('Not implemented');
    },
    save: async (c: Company) => {
      onSave?.(c);
    }
  };
}

describe('CreateCompany', () => {
  test('creates company with all fields and returns DTO', async () => {
    let saved: Company | undefined;

    const useCase = new CreateCompany(
      mockCompanyRepo(c => {
        saved = c;
      })
    );

    const dto = await useCase.execute({
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: BusinessType.PLATFORM,
      industry: Industry.SAAS,
      stage: null
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.name).toBe('GitHub');
    expect(dto.website).toBe('https://github.com');
    expect(dto.logoUrl).toBe('https://logo.com/gh.png');
    expect(dto.linkedinLink).toBe('https://linkedin.com/company/github');
    expect(dto.businessType).toBe(BusinessType.PLATFORM);
    expect(dto.industry).toBe(Industry.SAAS);
    expect(dto.stage).toBeNull();
    expect(saved).toBeDefined();
  });

  test('creates company with minimal fields (name only)', async () => {
    const useCase = new CreateCompany(mockCompanyRepo());

    const dto = await useCase.execute({
      name: 'SomeCo',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    });

    expect(dto.name).toBe('SomeCo');
    expect(dto.website).toBeNull();
    expect(dto.linkedinLink).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/company/CreateCompany.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the use case**

Create `application/src/use-cases/company/CreateCompany.ts`:

```typescript
import { Company, type CompanyRepository } from '@tailoredin/domain';
import type { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type CreateCompanyInput = {
  name: string;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: BusinessType | null;
  industry: Industry | null;
  stage: CompanyStage | null;
};

export class CreateCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: CreateCompanyInput): Promise<CompanyDto> {
    const company = Company.create({
      name: input.name,
      website: input.website,
      logoUrl: input.logoUrl,
      linkedinLink: input.linkedinLink,
      businessType: input.businessType,
      industry: input.industry,
      stage: input.stage
    });
    await this.companyRepository.save(company);
    return toCompanyDto(company);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test application/test/use-cases/company/CreateCompany.test.ts`
Expected: PASS

- [ ] **Step 5: Update use-cases barrel**

Add to `application/src/use-cases/index.ts`:

```typescript
export type { CreateCompanyInput } from './company/CreateCompany.js';
export { CreateCompany } from './company/CreateCompany.js';
```

- [ ] **Step 6: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add application/src/use-cases/company/CreateCompany.ts application/test/use-cases/company/CreateCompany.test.ts application/src/use-cases/index.ts
git commit -m "feat: add CreateCompany use case"
```

---

## Task 5: ClaudeCliCompanyDataProvider

**Files:**
- Create: `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts`
- Create: `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`
- Modify: `infrastructure/src/index.ts`

- [ ] **Step 1: Write the test**

Create `infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`:

```typescript
import { describe, expect, mock, test } from 'bun:test';
import { BusinessType, Industry, CompanyStage } from '@tailoredin/domain';
import { ClaudeCliCompanyDataProvider } from '../../src/services/ClaudeCliCompanyDataProvider.js';

describe('ClaudeCliCompanyDataProvider', () => {
  test('parses valid JSON response from CLI', async () => {
    const validResponse = JSON.stringify({
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: null,
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: 'platform',
      industry: 'saas',
      stage: 'acquired'
    });

    const provider = new ClaudeCliCompanyDataProvider();
    // We test the parsing logic directly via a protected method
    const result = provider.parseResponse(validResponse);

    expect(result.name).toBe('GitHub');
    expect(result.website).toBe('https://github.com');
    expect(result.logoUrl).toBeNull();
    expect(result.linkedinLink).toBe('https://linkedin.com/company/github');
    expect(result.businessType).toBe(BusinessType.PLATFORM);
    expect(result.industry).toBe(Industry.SAAS);
    expect(result.stage).toBe(CompanyStage.ACQUIRED);
  });

  test('maps unknown enum values to null', () => {
    const response = JSON.stringify({
      name: 'SomeCo',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: 'invalid_type',
      industry: 'not_an_industry',
      stage: 'unknown'
    });

    const provider = new ClaudeCliCompanyDataProvider();
    const result = provider.parseResponse(response);

    expect(result.businessType).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.stage).toBeNull();
  });

  test('handles all-null response', () => {
    const response = JSON.stringify({
      name: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    });

    const provider = new ClaudeCliCompanyDataProvider();
    const result = provider.parseResponse(response);

    expect(result.name).toBeNull();
    expect(result.businessType).toBeNull();
  });

  test('throws on invalid JSON', () => {
    const provider = new ClaudeCliCompanyDataProvider();

    expect(() => provider.parseResponse('not json')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the adapter**

Create `infrastructure/src/services/ClaudeCliCompanyDataProvider.ts`:

```typescript
import { injectable } from '@needle-di/core';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '@tailoredin/application';
import { EnumUtil, Logger } from '@tailoredin/core';

@injectable()
export class ClaudeCliCompanyDataProvider implements CompanyDataProvider {
  private readonly log = Logger.create(this);

  public async enrichFromUrl(url: string): Promise<CompanyEnrichmentResult> {
    const prompt = this.buildPrompt(url);

    this.log.info(`Enriching company data for URL: ${url}`);

    const proc = Bun.spawn(['claude', '-p', prompt, '--output-format', 'json'], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      this.log.error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
      throw new Error(`Claude CLI failed with exit code ${exitCode}`);
    }

    const parsed = JSON.parse(output);
    const text = parsed.result ?? output;

    return this.parseResponse(text);
  }

  public parseResponse(raw: string): CompanyEnrichmentResult {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return {
      name: typeof data.name === 'string' ? data.name : null,
      website: typeof data.website === 'string' ? data.website : null,
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : null,
      linkedinLink: typeof data.linkedinLink === 'string' ? data.linkedinLink : null,
      businessType: EnumUtil.fromValue(BusinessType, data.businessType) ?? null,
      industry: EnumUtil.fromValue(Industry, data.industry) ?? null,
      stage: EnumUtil.fromValue(CompanyStage, data.stage) ?? null
    };
  }

  private buildPrompt(url: string): string {
    const businessTypes = Object.values(BusinessType).join(', ');
    const industries = Object.values(Industry).join(', ');
    const stages = Object.values(CompanyStage).join(', ');

    return [
      `Given this URL: ${url}`,
      'Look up or infer information about this company.',
      'Return ONLY a valid JSON object with these fields:',
      '- name (string or null): the company name',
      '- website (string or null): the company website URL',
      '- logoUrl (string or null): a URL to the company logo image',
      '- linkedinLink (string or null): the LinkedIn company page URL',
      `- businessType (one of: ${businessTypes}, or null): the business model`,
      `- industry (one of: ${industries}, or null): the industry`,
      `- stage (one of: ${stages}, or null): the funding/company stage`,
      'Use null for any field you are not confident about.',
      'Return ONLY the JSON object, no other text.'
    ].join('\n');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts`
Expected: PASS

- [ ] **Step 5: Check if `EnumUtil.fromValue` exists**

Verify `EnumUtil.fromValue` exists in `@tailoredin/core`. If not, the implementation needs to handle enum lookup differently. The method should take an enum and a string value and return the matching enum member or `undefined`.

If `EnumUtil.fromValue` does not exist, replace the enum mapping with inline lookups:

```typescript
businessType: Object.values(BusinessType).includes(data.businessType) ? data.businessType as BusinessType : null,
```

- [ ] **Step 6: Update infrastructure barrel**

Add to `infrastructure/src/index.ts`:

```typescript
export { ClaudeCliCompanyDataProvider } from './services/ClaudeCliCompanyDataProvider.js';
```

- [ ] **Step 7: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add infrastructure/src/services/ClaudeCliCompanyDataProvider.ts infrastructure/test/services/ClaudeCliCompanyDataProvider.test.ts infrastructure/src/index.ts
git commit -m "feat: add ClaudeCliCompanyDataProvider adapter"
```

---

## Task 6: DI Tokens + Container Wiring

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `api/src/container.ts`

- [ ] **Step 1: Add DI tokens**

In `infrastructure/src/DI.ts`, add the necessary imports at the top:

```typescript
import type { CompanyDataProvider, EnrichCompanyData, CreateCompany } from '@tailoredin/application';
```

Then update the `Company` block:

```typescript
Company: {
  Repository: new InjectionToken<CompanyRepository>('DI.Company.Repository'),
  DataProvider: new InjectionToken<CompanyDataProvider>('DI.Company.DataProvider'),
  Enrich: new InjectionToken<EnrichCompanyData>('DI.Company.Enrich'),
  Create: new InjectionToken<CreateCompany>('DI.Company.Create')
}
```

- [ ] **Step 2: Wire up container**

In `api/src/container.ts`, add the import:

```typescript
import { CreateCompany, EnrichCompanyData } from '@tailoredin/application';
```

And update the infrastructure import to include `ClaudeCliCompanyDataProvider`:

```typescript
import {
  // ... existing imports ...
  ClaudeCliCompanyDataProvider
} from '@tailoredin/infrastructure';
```

Add bindings after the existing `// Company` section:

```typescript
// Company
container.bind({ provide: DI.Company.Repository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Company.DataProvider, useClass: ClaudeCliCompanyDataProvider });
container.bind({
  provide: DI.Company.Enrich,
  useFactory: () => new EnrichCompanyData(container.get(DI.Company.DataProvider))
});
container.bind({
  provide: DI.Company.Create,
  useFactory: () => new CreateCompany(container.get(DI.Company.Repository))
});
```

- [ ] **Step 3: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/DI.ts api/src/container.ts
git commit -m "feat: wire company enrichment DI tokens and container bindings"
```

---

## Task 7: API Routes

**Files:**
- Create: `api/src/routes/company/EnrichCompanyRoute.ts`
- Create: `api/src/routes/company/CreateCompanyRoute.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create EnrichCompanyRoute**

Create `api/src/routes/company/EnrichCompanyRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { EnrichCompanyData } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class EnrichCompanyRoute {
  public constructor(private readonly enrichCompanyData: EnrichCompanyData = inject(DI.Company.Enrich)) {}

  public plugin() {
    return new Elysia().post(
      '/companies/enrich',
      async ({ body }) => {
        const data = await this.enrichCompanyData.execute({ url: body.url });
        return { data };
      },
      {
        body: t.Object({
          url: t.String({ minLength: 1 })
        })
      }
    );
  }
}
```

- [ ] **Step 2: Create CreateCompanyRoute**

Create `api/src/routes/company/CreateCompanyRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { CreateCompany } from '@tailoredin/application';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateCompanyRoute {
  public constructor(private readonly createCompany: CreateCompany = inject(DI.Company.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/companies',
      async ({ body, set }) => {
        const data = await this.createCompany.execute({
          name: body.name,
          website: body.website ?? null,
          logoUrl: body.logo_url ?? null,
          linkedinLink: body.linkedin_link ?? null,
          businessType: (body.business_type as BusinessType) ?? null,
          industry: (body.industry as Industry) ?? null,
          stage: (body.stage as CompanyStage) ?? null
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          website: t.Optional(t.Nullable(t.String())),
          logo_url: t.Optional(t.Nullable(t.String())),
          linkedin_link: t.Optional(t.Nullable(t.String())),
          business_type: t.Optional(t.Nullable(t.String())),
          industry: t.Optional(t.Nullable(t.String())),
          stage: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
```

- [ ] **Step 3: Mount routes in index.ts**

In `api/src/index.ts`, add imports:

```typescript
import { CreateCompanyRoute } from './routes/company/CreateCompanyRoute.js';
import { EnrichCompanyRoute } from './routes/company/EnrichCompanyRoute.js';
```

Add after the `// Factory` section (before `.onError`):

```typescript
  // Companies
  .use(container.get(EnrichCompanyRoute).plugin())
  .use(container.get(CreateCompanyRoute).plugin())
```

- [ ] **Step 4: Verify types**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Run lint**

Run: `bun run check`
Expected: PASS (or fix any issues)

- [ ] **Step 6: Commit**

```bash
git add api/src/routes/company/EnrichCompanyRoute.ts api/src/routes/company/CreateCompanyRoute.ts api/src/index.ts
git commit -m "feat: add POST /companies/enrich and POST /companies routes"
```

---

## Task 8: Full Verification

- [ ] **Step 1: Run all unit tests**

Run: `bun run test`
Expected: All tests pass

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `bun run check`
Expected: PASS

- [ ] **Step 4: Run architecture boundary check**

Run: `bun run dep:check`
Expected: PASS — no layer violations

- [ ] **Step 5: Run dead code detection**

Run: `bun run knip`
Expected: PASS — no unused exports

- [ ] **Step 6: Manual smoke test (enrichment)**

Start the dev server: `bun up`

Then test the enrichment endpoint:

```bash
curl -s -X POST http://localhost:8000/companies/enrich \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://linkedin.com/company/github"}' | jq .
```

Expected: `{ "data": { "name": "GitHub", "website": "...", ... } }` with some fields populated

- [ ] **Step 7: Manual smoke test (creation)**

```bash
curl -s -X POST http://localhost:8000/companies \
  -H 'Content-Type: application/json' \
  -d '{"name": "GitHub", "website": "https://github.com"}' | jq .
```

Expected: `{ "data": { "id": "...", "name": "GitHub", "website": "https://github.com", ... } }` with HTTP 201
