# Detail Pages & Modal Stacking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add read-only detail pages for Companies and Experiences, implement scale+blur modal stacking, update navigation flows, add storybook stories, and revise design docs.

**Architecture:** New TanStack Router routes (`/companies/$companyId`, `/experiences/$experienceId`) backed by new `GET` API endpoints. Shared presentational components (`Breadcrumb`, `InfoCard`, `LinkedEntityCard`, `DetailPageHeader`) keep detail pages DRY. Modal stacking is CSS-only via a `data-stacked` attribute on `DialogContent`. Card click behavior changes from "open modal" to "navigate to detail page".

**Tech Stack:** React 19, TanStack Router/Query, Elysia, base-ui Dialog, Tailwind CSS, Storybook

---

## File Map

### Backend (new files)

| File | Responsibility |
|---|---|
| `application/src/use-cases/company/GetCompany.ts` | Use case: fetch single company by ID |
| `application/test/use-cases/company/GetCompany.test.ts` | Unit test for GetCompany |
| `application/src/use-cases/experience/GetExperience.ts` | Use case: fetch single experience by ID with company |
| `application/test/use-cases/experience/GetExperience.test.ts` | Unit test for GetExperience |
| `api/src/routes/company/GetCompanyRoute.ts` | Route: `GET /companies/:id` |
| `api/src/routes/experience/GetExperienceRoute.ts` | Route: `GET /experiences/:id` |

### Backend (modified files)

| File | Change |
|---|---|
| `application/src/use-cases/index.ts` | Export `GetCompany`, `GetExperience` |
| `infrastructure/src/DI.ts` | Add `DI.Company.Get`, `DI.Experience.Get` tokens |
| `api/src/container.ts` | Bind `GetCompany`, `GetExperience` use cases |
| `api/src/index.ts` | Mount `GetCompanyRoute`, `GetExperienceRoute` |

### Frontend — shared components (new files)

| File | Responsibility |
|---|---|
| `web/src/components/shared/Breadcrumb.tsx` | Breadcrumb with parent link + current text |
| `web/src/components/shared/Breadcrumb.stories.tsx` | Storybook story |
| `web/src/components/shared/InfoCard.tsx` | Read-only card: section label + description or key-value rows |
| `web/src/components/shared/InfoCard.stories.tsx` | Storybook story |
| `web/src/components/shared/LinkedEntityCard.tsx` | Clickable card linking to another entity's detail page |
| `web/src/components/shared/LinkedEntityCard.stories.tsx` | Storybook story |
| `web/src/components/shared/DetailPageHeader.tsx` | Reusable header: logo, title, meta items, action buttons |
| `web/src/components/shared/DetailPageHeader.stories.tsx` | Storybook story |

### Frontend — detail pages (new files)

| File | Responsibility |
|---|---|
| `web/src/routes/companies/$companyId.tsx` | Company detail page route |
| `web/src/routes/experiences/$experienceId.tsx` | Experience detail page route |

### Frontend — modal stacking (new + modified)

| File | Change |
|---|---|
| `web/src/components/ui/dialog.tsx` | Add `data-stacked` CSS for scale+blur treatment |
| `web/src/components/shared/FormModal.tsx` | Detect nested dialog open → set `data-stacked` on own content |
| `web/src/components/shared/StackedModal.stories.tsx` | Storybook story demonstrating the effect |

### Frontend — navigation changes (modified files)

| File | Change |
|---|---|
| `web/src/lib/query-keys.ts` | Add `detail(id)` keys for companies and experiences |
| `web/src/hooks/use-companies.ts` | Add `useCompany(id)` hook |
| `web/src/hooks/use-experiences.ts` | Add `useExperience(id)` hook |
| `web/src/components/companies/CompanyCard.tsx` | Change from `button` with `onClick` to `Link` navigating to detail page |
| `web/src/components/companies/CompanyList.tsx` | Remove modal-on-click, keep create modal only |
| `web/src/components/resume/experience/ExperienceCard.tsx` | Change from `div[role=button]` with `onEdit` to `Link` navigating to detail page |
| `web/src/components/resume/experience/ExperienceList.tsx` | Remove edit modal, keep create modal only |
| `web/src/components/companies/CompanyCardContent.stories.tsx` | Update story args (no onClick) |
| `web/src/components/resume/experience/ExperienceCardContent.stories.tsx` | Update story args (no onEdit) |

### Design docs (modified files)

| File | Change |
|---|---|
| `web/design/ux-guidelines.md` | Add "Detail Pages" section, update "Modal Forms" with stacking rules |
| `web/design/design-system.md` | Add detail page component specs, stacked modal CSS values |

---

## Task 1: GetCompany Use Case + API Route

**Files:**
- Create: `application/src/use-cases/company/GetCompany.ts`
- Create: `application/test/use-cases/company/GetCompany.test.ts`
- Create: `api/src/routes/company/GetCompanyRoute.ts`
- Modify: `application/src/use-cases/index.ts`
- Modify: `infrastructure/src/DI.ts`
- Modify: `api/src/container.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Write the failing test for GetCompany**

Create `application/test/use-cases/company/GetCompany.test.ts`:

```typescript
import { describe, expect, it, vi } from 'bun:test';
import { Company, CompanyId, type CompanyRepository } from '@tailoredin/domain';
import { GetCompany } from '../../src/use-cases/company/GetCompany.js';

function makeCompany(overrides: Partial<ConstructorParameters<typeof Company>[0]> = {}): Company {
  return new Company({
    id: new CompanyId('aaaaaaaa-1111-2222-3333-444444444444'),
    name: 'Acme Corp',
    description: 'Leading SaaS platform',
    website: 'https://acme.com',
    logoUrl: null,
    linkedinLink: 'https://linkedin.com/company/acme',
    businessType: 'b2b',
    industry: 'saas',
    stage: 'series_b',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });
}

describe('GetCompany', () => {
  it('returns a company DTO when found', async () => {
    const company = makeCompany();
    const repo: CompanyRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(company),
      upsertByLinkedinLink: vi.fn(),
      save: vi.fn()
    };

    const useCase = new GetCompany(repo);
    const result = await useCase.execute({ companyId: 'aaaaaaaa-1111-2222-3333-444444444444' });

    expect(result.id).toBe('aaaaaaaa-1111-2222-3333-444444444444');
    expect(result.name).toBe('Acme Corp');
    expect(result.description).toBe('Leading SaaS platform');
  });

  it('throws when company not found', async () => {
    const repo: CompanyRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      upsertByLinkedinLink: vi.fn(),
      save: vi.fn()
    };

    const useCase = new GetCompany(repo);
    await expect(useCase.execute({ companyId: 'aaaaaaaa-1111-2222-3333-444444444444' })).rejects.toThrow(
      'Company not found'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/company/GetCompany.test.ts`
Expected: FAIL — `GetCompany` module not found

- [ ] **Step 3: Implement GetCompany use case**

Create `application/src/use-cases/company/GetCompany.ts`:

```typescript
import { CompanyId, type CompanyRepository } from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type GetCompanyInput = {
  companyId: string;
};

export class GetCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: GetCompanyInput): Promise<CompanyDto> {
    const company = await this.companyRepository.findById(new CompanyId(input.companyId));
    if (!company) {
      throw new Error(`Company not found: ${input.companyId}`);
    }
    return toCompanyDto(company);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test application/test/use-cases/company/GetCompany.test.ts`
Expected: PASS — both tests green

- [ ] **Step 5: Export from barrel and add DI token**

Add to `application/src/use-cases/index.ts` (after existing company exports):

```typescript
export type { GetCompanyInput } from './company/GetCompany.js';
export { GetCompany } from './company/GetCompany.js';
```

Add to `infrastructure/src/DI.ts` — in the `Company` object, after `Update`:

```typescript
Get: new InjectionToken<GetCompany>('DI.Company.Get'),
```

Also add the import at the top of `DI.ts`:

```typescript
GetCompany,
```

- [ ] **Step 6: Wire DI and create route**

Add to `api/src/container.ts` — after the `DI.Company.Update` binding:

```typescript
container.bind({
  provide: DI.Company.Get,
  useFactory: () => new GetCompany(container.get(DI.Company.Repository))
});
```

Create `api/src/routes/company/GetCompanyRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { GetCompany } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetCompanyRoute {
  public constructor(private readonly getCompany: GetCompany = inject(DI.Company.Get)) {}

  public plugin() {
    return new Elysia().get(
      '/companies/:id',
      async ({ params, set }) => {
        try {
          const data = await this.getCompany.execute({ companyId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Company not found')) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
```

Mount in `api/src/index.ts` — after `container.get(UpdateCompanyRoute).plugin()`:

```typescript
.use(container.get(GetCompanyRoute).plugin())
```

Add the import and container binding for the route class in `container.ts`.

- [ ] **Step 7: Run typecheck and tests**

Run: `bun run typecheck && bun test application/test/use-cases/company/GetCompany.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add application/src/use-cases/company/GetCompany.ts application/test/use-cases/company/GetCompany.test.ts application/src/use-cases/index.ts infrastructure/src/DI.ts api/src/container.ts api/src/routes/company/GetCompanyRoute.ts api/src/index.ts
git commit -m "feat(api): add GET /companies/:id endpoint with GetCompany use case"
```

---

## Task 2: GetExperience Use Case + API Route

**Files:**
- Create: `application/src/use-cases/experience/GetExperience.ts`
- Create: `application/test/use-cases/experience/GetExperience.test.ts`
- Create: `api/src/routes/experience/GetExperienceRoute.ts`
- Modify: `application/src/use-cases/index.ts`
- Modify: `infrastructure/src/DI.ts`
- Modify: `api/src/container.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Write the failing test for GetExperience**

Create `application/test/use-cases/experience/GetExperience.test.ts`:

```typescript
import { describe, expect, it, vi } from 'bun:test';
import { Company, CompanyId, type CompanyRepository, Experience, type ExperienceRepository } from '@tailoredin/domain';
import { GetExperience } from '../../src/use-cases/experience/GetExperience.js';

function makeExperience(): Experience {
  return new Experience({
    id: { value: 'eeeeeeee-1111-2222-3333-444444444444' },
    title: 'Senior Engineer',
    companyName: 'Acme Corp',
    companyWebsite: 'https://acme.com',
    companyId: 'cccccccc-1111-2222-3333-444444444444',
    location: 'San Francisco',
    startDate: '2022-03',
    endDate: 'Present',
    summary: 'Led platform team',
    ordinal: 0,
    accomplishments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeCompany(): Company {
  return new Company({
    id: new CompanyId('cccccccc-1111-2222-3333-444444444444'),
    name: 'Acme Corp',
    description: 'SaaS platform',
    website: 'https://acme.com',
    logoUrl: null,
    linkedinLink: null,
    businessType: 'b2b',
    industry: 'saas',
    stage: 'series_b',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

describe('GetExperience', () => {
  it('returns an experience DTO with linked company', async () => {
    const expRepo: ExperienceRepository = {
      findByIdOrFail: vi.fn().mockResolvedValue(makeExperience()),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn()
    };
    const companyRepo: CompanyRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(makeCompany()),
      upsertByLinkedinLink: vi.fn(),
      save: vi.fn()
    };

    const useCase = new GetExperience(expRepo, companyRepo);
    const result = await useCase.execute({ experienceId: 'eeeeeeee-1111-2222-3333-444444444444' });

    expect(result.id).toBe('eeeeeeee-1111-2222-3333-444444444444');
    expect(result.title).toBe('Senior Engineer');
    expect(result.company).not.toBeNull();
    expect(result.company!.name).toBe('Acme Corp');
  });

  it('returns experience with null company when not linked', async () => {
    const exp = makeExperience();
    (exp as any).companyId = null;
    const expRepo: ExperienceRepository = {
      findByIdOrFail: vi.fn().mockResolvedValue(exp),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn()
    };
    const companyRepo: CompanyRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      upsertByLinkedinLink: vi.fn(),
      save: vi.fn()
    };

    const useCase = new GetExperience(expRepo, companyRepo);
    const result = await useCase.execute({ experienceId: 'eeeeeeee-1111-2222-3333-444444444444' });

    expect(result.company).toBeNull();
    expect(companyRepo.findById).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/experience/GetExperience.test.ts`
Expected: FAIL — `GetExperience` module not found

- [ ] **Step 3: Implement GetExperience use case**

Create `application/src/use-cases/experience/GetExperience.ts`:

```typescript
import { CompanyId, type CompanyRepository, type ExperienceRepository } from '@tailoredin/domain';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from '../experience/ListExperiences.js';

export type GetExperienceInput = {
  experienceId: string;
};

export class GetExperience {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(input: GetExperienceInput): Promise<ExperienceDto> {
    const experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    const company = experience.companyId
      ? await this.companyRepository.findById(new CompanyId(experience.companyId))
      : null;
    return toExperienceDto(experience, company ? toCompanyDto(company) : null);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test application/test/use-cases/experience/GetExperience.test.ts`
Expected: PASS

- [ ] **Step 5: Export, add DI token, wire, create route**

Add to `application/src/use-cases/index.ts`:

```typescript
export type { GetExperienceInput } from './experience/GetExperience.js';
export { GetExperience } from './experience/GetExperience.js';
```

Add to `infrastructure/src/DI.ts` — in the `Experience` object, after `Delete`:

```typescript
Get: new InjectionToken<GetExperience>('DI.Experience.Get'),
```

Add `GetExperience` to the imports at the top of `DI.ts`.

Add to `api/src/container.ts`:

```typescript
container.bind({
  provide: DI.Experience.Get,
  useFactory: () => new GetExperience(container.get(DI.Experience.Repository), container.get(DI.Company.Repository))
});
```

Create `api/src/routes/experience/GetExperienceRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { GetExperience } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetExperienceRoute {
  public constructor(private readonly getExperience: GetExperience = inject(DI.Experience.Get)) {}

  public plugin() {
    return new Elysia().get(
      '/experiences/:id',
      async ({ params, set }) => {
        try {
          const data = await this.getExperience.execute({ experienceId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
```

Mount in `api/src/index.ts` after existing experience routes:

```typescript
.use(container.get(GetExperienceRoute).plugin())
```

- [ ] **Step 6: Run typecheck and tests**

Run: `bun run typecheck && bun test application/test/use-cases/experience/GetExperience.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add application/src/use-cases/experience/GetExperience.ts application/test/use-cases/experience/GetExperience.test.ts application/src/use-cases/index.ts infrastructure/src/DI.ts api/src/container.ts api/src/routes/experience/GetExperienceRoute.ts api/src/index.ts
git commit -m "feat(api): add GET /experiences/:id endpoint with GetExperience use case"
```

---

## Task 3: Query Keys + Frontend Hooks

**Files:**
- Modify: `web/src/lib/query-keys.ts`
- Modify: `web/src/hooks/use-companies.ts`
- Modify: `web/src/hooks/use-experiences.ts`

- [ ] **Step 1: Add detail query keys**

In `web/src/lib/query-keys.ts`, add `detail` function to both `companies` and `experiences`:

```typescript
companies: {
  all: ['companies'] as const,
  list: () => [...queryKeys.companies.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.companies.all, 'detail', id] as const
},
experiences: {
  all: ['experiences'] as const,
  list: () => [...queryKeys.experiences.all, 'list'] as const,
  detail: (id: string) => [...queryKeys.experiences.all, 'detail', id] as const
},
```

- [ ] **Step 2: Add useCompany hook**

In `web/src/hooks/use-companies.ts`, add after the `useCompanies` function:

```typescript
export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async () => {
      const segment = api.companies as AnyRouteSegment;
      const { data, error } = await segment({ id }).get();
      if (error) throw new Error('Failed to fetch company');
      return data?.data as Company;
    }
  });
}
```

- [ ] **Step 3: Add useExperience hook**

In `web/src/hooks/use-experiences.ts`, add after the `useExperiences` function:

```typescript
export function useExperience(id: string) {
  return useQuery({
    queryKey: queryKeys.experiences.detail(id),
    queryFn: async () => {
      const segment = api.experiences as AnyRouteSegment;
      const { data, error } = await segment({ id }).get();
      if (error) throw new Error('Failed to fetch experience');
      return data?.data as Experience;
    }
  });
}
```

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/query-keys.ts web/src/hooks/use-companies.ts web/src/hooks/use-experiences.ts
git commit -m "feat(web): add detail query keys and useCompany/useExperience hooks"
```

---

## Task 4: Shared Detail Page Components

**Files:**
- Create: `web/src/components/shared/Breadcrumb.tsx`
- Create: `web/src/components/shared/InfoCard.tsx`
- Create: `web/src/components/shared/LinkedEntityCard.tsx`
- Create: `web/src/components/shared/DetailPageHeader.tsx`

- [ ] **Step 1: Create Breadcrumb component**

Create `web/src/components/shared/Breadcrumb.tsx`:

```tsx
import { Link } from '@tanstack/react-router';

interface BreadcrumbProps {
  readonly parentLabel: string;
  readonly parentTo: string;
  readonly current: string;
}

export function Breadcrumb({ parentLabel, parentTo, current }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      <Link to={parentTo} className="text-primary hover:underline">
        {parentLabel}
      </Link>
      <span className="text-border">/</span>
      <span className="text-muted-foreground">{current}</span>
    </nav>
  );
}
```

- [ ] **Step 2: Create InfoCard component**

Create `web/src/components/shared/InfoCard.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function InfoCard({ label, children, className }: InfoCardProps) {
  return (
    <div className={cn('rounded-[14px] border bg-card p-5', className)}>
      <div className="mb-3 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

interface InfoRowProps {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly href?: string;
}

export function InfoRow({ label, value, href }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-b-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {value ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-[13px] text-foreground">{value}</span>
        )
      ) : (
        <span className="text-[13px] italic text-muted-foreground">Not set</span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create LinkedEntityCard component**

Create `web/src/components/shared/LinkedEntityCard.tsx`:

```tsx
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

interface LinkedEntityCardProps {
  readonly to: string;
  readonly logo: string;
  readonly name: string;
  readonly meta: string;
}

export function LinkedEntityCard({ to, logo, name, meta }: LinkedEntityCardProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[14px] border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/40"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-[14px] font-medium text-accent-foreground">
        {logo}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-foreground">{name}</div>
        <div className="text-[11px] text-muted-foreground">{meta}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
```

- [ ] **Step 4: Create DetailPageHeader component**

Create `web/src/components/shared/DetailPageHeader.tsx`:

```tsx
import type { ReactNode } from 'react';

interface DetailPageHeaderProps {
  readonly logo: ReactNode;
  readonly title: string;
  readonly meta: ReactNode;
  readonly actions: ReactNode;
}

export function DetailPageHeader({ logo, title, meta, actions }: DetailPageHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      {logo}
      <div className="flex-1">
        <h1 className="text-[22px] font-medium leading-tight tracking-[-0.01em]">{title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div>
      </div>
      <div className="flex flex-shrink-0 gap-2">{actions}</div>
    </div>
  );
}

export function MetaBadge({ children }: { readonly children: ReactNode }) {
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">{children}</span>
  );
}

export function MetaDot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-border" />;
}

export function MetaText({ children }: { readonly children: ReactNode }) {
  return <span className="text-[13px] text-muted-foreground">{children}</span>;
}
```

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/components/shared/Breadcrumb.tsx web/src/components/shared/InfoCard.tsx web/src/components/shared/LinkedEntityCard.tsx web/src/components/shared/DetailPageHeader.tsx
git commit -m "feat(web): add shared detail page components — Breadcrumb, InfoCard, LinkedEntityCard, DetailPageHeader"
```

---

## Task 5: Company Detail Page Route

**Files:**
- Create: `web/src/routes/companies/$companyId.tsx`

- [ ] **Step 1: Create the company detail route**

Create `web/src/routes/companies/$companyId.tsx`:

```tsx
import { Link, createFileRoute } from '@tanstack/react-router';
import { ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { CompanyFormModal } from '@/components/companies/CompanyFormModal.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/hooks/use-companies';
import { formatEnumLabel } from '@/components/companies/company-options.js';

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { data: company, isLoading } = useCompany(companyId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!company) return <EmptyState message="Company not found." />;

  const initial = company.name.charAt(0).toUpperCase();
  const industryLabel = formatEnumLabel('industry', company.industry);
  const stageLabel = formatEnumLabel('stage', company.stage);
  const businessTypeLabel = formatEnumLabel('businessType', company.businessType);

  return (
    <div className="space-y-5">
      <Breadcrumb parentLabel="Companies" parentTo="/companies" current={company.name} />

      <DetailPageHeader
        logo={
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              initial
            )}
          </div>
        }
        title={company.name}
        meta={
          <>
            {businessTypeLabel && <MetaBadge>{businessTypeLabel}</MetaBadge>}
            {stageLabel && (
              <>
                <MetaDot />
                <MetaText>{stageLabel}</MetaText>
              </>
            )}
            {industryLabel && (
              <>
                <MetaDot />
                <MetaText>{industryLabel}</MetaText>
              </>
            )}
          </>
        }
        actions={
          <>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Website
                </Button>
              </a>
            )}
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="job-descriptions">Job Descriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mt-4 grid grid-cols-2 gap-5">
            <InfoCard label="About">
              {company.description ? (
                <p className="text-[14px] leading-relaxed tracking-[0.01em]">{company.description}</p>
              ) : (
                <p className="text-[14px] italic text-muted-foreground">No description</p>
              )}
            </InfoCard>

            <InfoCard label="Details">
              <InfoRow label="Website" value={company.website} href={company.website ?? undefined} />
              <InfoRow label="LinkedIn" value={company.linkedinLink} href={company.linkedinLink ?? undefined} />
              <InfoRow label="Industry" value={industryLabel} />
              <InfoRow label="Stage" value={stageLabel} />
              <InfoRow label="Business Type" value={businessTypeLabel} />
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="job-descriptions">
          <div className="mt-4">
            <EmptyState message="No job descriptions yet." />
          </div>
        </TabsContent>
      </Tabs>

      {editOpen && (
        <CompanyFormModal open company={company} onOpenChange={next => { if (!next) setEditOpen(false); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS (route tree regenerates automatically)

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/companies/\$companyId.tsx web/src/routeTree.gen.ts
git commit -m "feat(web): add company detail page at /companies/:id"
```

---

## Task 6: Experience Detail Page Route

**Files:**
- Create: `web/src/routes/experiences/$experienceId.tsx`

- [ ] **Step 1: Create the experience detail route**

Create `web/src/routes/experiences/$experienceId.tsx`:

```tsx
import { Link, createFileRoute } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ExperienceFormModal } from '@/components/resume/experience/ExperienceFormModal.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperience } from '@/hooks/use-experiences';

export const Route = createFileRoute('/experiences/$experienceId')({
  component: ExperienceDetailPage
});

function ExperienceDetailPage() {
  const { experienceId } = Route.useParams();
  const { data: experience, isLoading } = useExperience(experienceId);
  const [editOpen, setEditOpen] = useState(false);

  const handleAccomplishmentDirtyChange = useCallback((_id: string, _isDirty: boolean) => {}, []);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!experience) return <EmptyState message="Experience not found." />;

  const companyInitial = experience.companyName?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="space-y-5">
      <Breadcrumb parentLabel="Experiences" parentTo="/experiences" current={experience.title} />

      <DetailPageHeader
        logo={
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
            {experience.company?.logoUrl ? (
              <img
                src={experience.company.logoUrl}
                alt={experience.companyName}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              companyInitial
            )}
          </div>
        }
        title={experience.title}
        meta={
          <>
            {experience.company ? (
              <Link to="/companies/$companyId" params={{ companyId: experience.company.id }} className="text-[13px] text-primary hover:underline">
                ↗ {experience.companyName}
              </Link>
            ) : (
              <MetaText>{experience.companyName}</MetaText>
            )}
            <MetaDot />
            <MetaText>{experience.location}</MetaText>
            <MetaDot />
            <MetaText>{experience.startDate} – {experience.endDate}</MetaText>
          </>
        }
        actions={
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accomplishments">
            Accomplishments
            {experience.accomplishments.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-px text-[11px] text-muted-foreground">
                {experience.accomplishments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mt-4 grid grid-cols-[1fr_280px] gap-5">
            <div className="space-y-5">
              <InfoCard label="Summary">
                {experience.summary ? (
                  <p className="text-[14px] leading-relaxed tracking-[0.01em]">{experience.summary}</p>
                ) : (
                  <p className="text-[14px] italic text-muted-foreground">No summary</p>
                )}
              </InfoCard>

              <InfoCard label="Details">
                <InfoRow label="Title" value={experience.title} />
                <InfoRow label="Company" value={experience.companyName} />
                <InfoRow label="Location" value={experience.location} />
                <InfoRow label="Period" value={`${experience.startDate} – ${experience.endDate}`} />
              </InfoCard>
            </div>

            <div className="space-y-4">
              {experience.company && (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                    Linked Company
                  </div>
                  <LinkedEntityCard
                    to={`/companies/${experience.company.id}`}
                    logo={experience.company.logoUrl ? '' : experience.company.name.charAt(0).toUpperCase()}
                    name={experience.company.name}
                    meta={[experience.company.businessType, experience.company.stage].filter(Boolean).join(' · ')}
                  />
                </div>
              )}

              <InfoCard label="Quick Stats">
                <InfoRow label="Accomplishments" value={String(experience.accomplishments.length)} />
              </InfoCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accomplishments">
          <div className="mt-4 space-y-3">
            {experience.accomplishments.length === 0 ? (
              <EmptyState message="No accomplishments yet." />
            ) : (
              experience.accomplishments.map((acc, idx) => (
                <div key={acc.id} className="rounded-[14px] border bg-card p-5">
                  <div className="mb-1 text-[11px] text-muted-foreground">#{idx + 1}</div>
                  <h3 className="text-[15px] font-medium tracking-[-0.01em]">{acc.title}</h3>
                  {acc.narrative && (
                    <p className="mt-1.5 text-[14px] leading-relaxed tracking-[0.01em] opacity-85">{acc.narrative}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {editOpen && (
        <ExperienceFormModal
          open
          onOpenChange={next => { if (!next) setEditOpen(false); }}
          modalMode={{ mode: 'edit', experience }}
          onAccomplishmentDirtyChange={handleAccomplishmentDirtyChange}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/experiences/\$experienceId.tsx web/src/routeTree.gen.ts
git commit -m "feat(web): add experience detail page at /experiences/:id"
```

---

## Task 7: Card Navigation Changes

**Files:**
- Modify: `web/src/components/companies/CompanyCard.tsx`
- Modify: `web/src/components/companies/CompanyList.tsx`
- Modify: `web/src/components/resume/experience/ExperienceCard.tsx`
- Modify: `web/src/components/resume/experience/ExperienceList.tsx`

- [ ] **Step 1: Update CompanyCard to use Link**

In `web/src/components/companies/CompanyCard.tsx`:

Replace the `<button>` wrapper and `onClick` prop with a `<Link>` from TanStack Router:

- Remove `onClick` from props interface
- Change outer element from `<button onClick={onClick}>` to `<Link to="/companies/$companyId" params={{ companyId: company.id }}>`
- Keep the same classes for hover treatment

Updated props:
```typescript
interface CompanyCardProps {
  readonly company: Company;
}
```

Updated wrapper:
```tsx
<Link
  to="/companies/$companyId"
  params={{ companyId: company.id }}
  className="group block w-full text-left border rounded-[14px] p-4 transition-colors hover:bg-accent/40"
>
```

- [ ] **Step 2: Update CompanyList to remove edit modal on card click**

In `web/src/components/companies/CompanyList.tsx`:

- Remove the `ModalState` type's `edit` variant — only keep `closed` and `create`
- Remove `modalState.mode === 'edit'` rendering block
- Update `CompanyCard` usage to remove `onClick` prop:

```tsx
<CompanyCard key={company.id} company={company} />
```

- [ ] **Step 3: Update ExperienceCard to use Link**

In `web/src/components/resume/experience/ExperienceCard.tsx`:

- Remove `onEdit` from props interface
- Change outer element from `<div role="button" onClick={onEdit}>` to `<Link to="/experiences/$experienceId" params={{ experienceId: experience.id }}>`
- Remove keyboard handler (Link handles it natively)
- Keep delete button with `e.preventDefault()` + `e.stopPropagation()` to prevent navigation

Updated props:
```typescript
interface ExperienceCardProps {
  readonly experience: Experience;
}
```

- [ ] **Step 4: Update ExperienceList to remove edit modal**

In `web/src/components/resume/experience/ExperienceList.tsx`:

- Simplify `ModalState` to only `closed` | `create`
- Remove edit-related modal rendering
- Update `ExperienceCard` usage to remove `onEdit` prop:

```tsx
<ExperienceCard key={exp.id} experience={exp} />
```

- [ ] **Step 5: Update story files**

Update `web/src/components/companies/CompanyCardContent.stories.tsx`:
- Remove `onClick: () => {}` from args
- Wrap stories in `MemoryRouter` or TanStack Router test wrapper for `Link` to work

Update `web/src/components/resume/experience/ExperienceCardContent.stories.tsx`:
- Remove `onEdit: () => {}` from args
- Add router wrapper

- [ ] **Step 6: Run typecheck and check**

Run: `bun run typecheck && bun run check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add web/src/components/companies/CompanyCard.tsx web/src/components/companies/CompanyList.tsx web/src/components/resume/experience/ExperienceCard.tsx web/src/components/resume/experience/ExperienceList.tsx web/src/components/companies/CompanyCardContent.stories.tsx web/src/components/resume/experience/ExperienceCardContent.stories.tsx
git commit -m "refactor(web): change card click from open-modal to navigate-to-detail-page"
```

---

## Task 8: Modal Stacking (Scale + Blur)

**Files:**
- Modify: `web/src/components/ui/dialog.tsx`
- Modify: `web/src/components/shared/FormModal.tsx`

- [ ] **Step 1: Add stacked CSS to dialog.tsx**

In `web/src/components/ui/dialog.tsx`, add CSS classes for the stacked state.

In the `DialogContent` component, add a `data-stacked` attribute support. When `data-stacked="true"`, the content receives the scale+blur treatment:

Add to `DialogPrimitive.Popup` className (conditional via data attribute):

```tsx
'data-[stacked=true]:scale-[0.90] data-[stacked=true]:blur-[1.5px] data-[stacked=true]:opacity-50 data-[stacked=true]:transition-all data-[stacked=true]:duration-200',
```

Also add a `stacked` prop to `DialogContent`:

```typescript
function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  stacked = false,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  overlayClassName?: string;
  stacked?: boolean;
}) {
```

And apply it:
```tsx
<DialogPrimitive.Popup
  data-slot="dialog-content"
  data-stacked={stacked || undefined}
  // ... existing className
```

- [ ] **Step 2: Update FormModal to detect nested dialog**

In `web/src/components/shared/FormModal.tsx`:

The FormModal already renders a nested `ConfirmDialog` (AlertDialog) when the user tries to close with unsaved changes. Track when this confirmation is open:

Add state:
```typescript
const [confirmOpen, setConfirmOpen] = useState(false);
```

Pass `stacked={confirmOpen}` to the `DialogContent`:
```tsx
<DialogContent showCloseButton={false} className="sm:max-w-lg" overlayClassName={overlayClassName} stacked={confirmOpen}>
```

Wire `confirmOpen` to the nested AlertDialog's open state — the confirmation dialog's `onOpenChange` should update `confirmOpen`.

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/components/ui/dialog.tsx web/src/components/shared/FormModal.tsx
git commit -m "feat(web): add scale+blur modal stacking when nested dialog opens"
```

---

## Task 9: Storybook Stories

**Files:**
- Create: `web/src/components/shared/Breadcrumb.stories.tsx`
- Create: `web/src/components/shared/InfoCard.stories.tsx`
- Create: `web/src/components/shared/LinkedEntityCard.stories.tsx`
- Create: `web/src/components/shared/DetailPageHeader.stories.tsx`
- Create: `web/src/components/shared/StackedModal.stories.tsx`

- [ ] **Step 1: Create Breadcrumb story**

Create `web/src/components/shared/Breadcrumb.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb.js';

const meta = {
  component: Breadcrumb,
  decorators: [
    Story => (
      <div className="max-w-md">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Companies: Story = {
  args: {
    parentLabel: 'Companies',
    parentTo: '/companies',
    current: 'Acme Corporation'
  }
};

export const Experiences: Story = {
  args: {
    parentLabel: 'Experiences',
    parentTo: '/experiences',
    current: 'Senior Software Engineer'
  }
};
```

- [ ] **Step 2: Create InfoCard story**

Create `web/src/components/shared/InfoCard.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoCard, InfoRow } from './InfoCard.js';

const meta = {
  component: InfoCard,
  decorators: [
    Story => (
      <div className="max-w-sm">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof InfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Description: Story = {
  args: {
    label: 'About',
    children: (
      <p className="text-[14px] leading-relaxed tracking-[0.01em]">
        Acme Corporation is a leading SaaS platform helping businesses streamline their operations through AI-powered
        workflow automation.
      </p>
    )
  }
};

export const KeyValueRows: Story = {
  args: {
    label: 'Details',
    children: (
      <>
        <InfoRow label="Website" value="acme.com" href="https://acme.com" />
        <InfoRow label="Industry" value="Technology" />
        <InfoRow label="Stage" value="Series B" />
        <InfoRow label="Business Type" value={null} />
      </>
    )
  }
};
```

- [ ] **Step 3: Create LinkedEntityCard story**

Create `web/src/components/shared/LinkedEntityCard.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkedEntityCard } from './LinkedEntityCard.js';

const meta = {
  component: LinkedEntityCard,
  decorators: [
    Story => (
      <div className="max-w-xs">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof LinkedEntityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInitial: Story = {
  args: {
    to: '/companies/1',
    logo: 'A',
    name: 'Acme Corporation',
    meta: 'SaaS · Series B'
  }
};

export const MinimalMeta: Story = {
  args: {
    to: '/companies/2',
    logo: 'T',
    name: 'Tiny Startup',
    meta: ''
  }
};
```

- [ ] **Step 4: Create DetailPageHeader story**

Create `web/src/components/shared/DetailPageHeader.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from './DetailPageHeader.js';
import { Button } from '../ui/button';

const meta = {
  component: DetailPageHeader,
  decorators: [
    Story => (
      <div className="max-w-2xl">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof DetailPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompanyHeader: Story = {
  args: {
    logo: (
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
        A
      </div>
    ),
    title: 'Acme Corporation',
    meta: (
      <>
        <MetaBadge>SaaS</MetaBadge>
        <MetaDot />
        <MetaText>Series B</MetaText>
        <MetaDot />
        <MetaText>Technology</MetaText>
      </>
    ),
    actions: (
      <>
        <Button variant="outline" size="sm">Website</Button>
        <Button size="sm">Edit</Button>
      </>
    )
  }
};

export const ExperienceHeader: Story = {
  args: {
    logo: (
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
        A
      </div>
    ),
    title: 'Senior Software Engineer',
    meta: (
      <>
        <span className="text-[13px] text-primary">↗ Acme Corporation</span>
        <MetaDot />
        <MetaText>San Francisco, CA</MetaText>
        <MetaDot />
        <MetaText>Mar 2022 – Present</MetaText>
      </>
    ),
    actions: <Button size="sm">Edit</Button>
  }
};
```

- [ ] **Step 5: Create StackedModal story**

Create `web/src/components/shared/StackedModal.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../ui/button';
import { FormModal } from './FormModal.js';

function StackedModalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Edit Company"
        description="Update company information"
        dirtyCount={1}
        isSaving={false}
        onSave={() => {}}
        onDiscard={() => setOpen(false)}
      >
        <div className="space-y-3 p-2">
          <p className="text-sm text-muted-foreground">
            Make a change, then click Cancel to see the stacked modal effect.
          </p>
          <div className="rounded-lg border p-3">
            <label className="text-xs text-muted-foreground">Company name</label>
            <div className="mt-1 rounded-md border border-l-2 border-l-primary/30 px-3 py-1.5 text-sm">
              Acme Corporation (modified)
            </div>
          </div>
        </div>
      </FormModal>
    </>
  );
}

const meta = {
  component: StackedModalDemo,
  parameters: {
    layout: 'centered'
  }
} satisfies Meta<typeof StackedModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

- [ ] **Step 6: Run storybook build check**

Run: `bun run --cwd web storybook build --quiet 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add web/src/components/shared/Breadcrumb.stories.tsx web/src/components/shared/InfoCard.stories.tsx web/src/components/shared/LinkedEntityCard.stories.tsx web/src/components/shared/DetailPageHeader.stories.tsx web/src/components/shared/StackedModal.stories.tsx
git commit -m "feat(web): add storybook stories for detail page components and stacked modal"
```

---

## Task 10: Update Design Documents

**Files:**
- Modify: `web/design/ux-guidelines.md`
- Modify: `web/design/design-system.md`

- [ ] **Step 1: Update ux-guidelines.md**

Add a new section **"5. Detail Pages"** after the existing section 4:

```markdown
---

## 5. Detail Pages

### When to Use Detail Pages

Use a dedicated detail page (full route) for entities that have:
- Nested sub-entities (e.g., experiences with accomplishments, companies with job descriptions)
- Cross-entity references (e.g., experiences linking to companies)
- Enough content to warrant tabbed organization

Keep modal/inline editing for entities that are simple and flat (headlines, education).

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
```

Update existing **section 1 → "Modal Forms"** subsection to add stacking rules:

```markdown
### Stacked Modals

When a second dialog opens over an existing modal (e.g., discard confirmation over an edit form):

- **Background modal:** `scale(0.90)`, `blur(1.5px)`, `opacity: 0.5`, with `200ms` transition
- **Between-modal overlay:** `rgba(0, 0, 0, 0.15)`
- **Foreground modal:** enhanced shadow `0 16px 48px rgba(0,0,0,0.2)`
- Triggered automatically when `FormModal` detects a nested dialog is open
- Does **not** apply to popovers, dropdowns, or tooltips overlapping a modal
```

- [ ] **Step 2: Update design-system.md**

Add to the **"Component Patterns"** section:

```markdown
### Detail Page Header

- Logo/avatar: 52×52px, 12px border-radius, `bg-accent` with `text-accent-foreground`
- Title: h1 (22px, medium 500, -0.01em tracking)
- Meta row: flex wrap, 8px gap, badges + dots + text
- Action buttons: right-aligned, 8px gap

### Breadcrumb

- Font: 13px, `text-muted-foreground`
- Parent link: `text-primary`, hover underline
- Separator: `/` in `text-border`, 6px gap

### Info Card (Read-Only)

- Same card base: `bg-card`, 1px `border`, 14px border-radius, 20px padding
- Section label: 11px uppercase, 0.06em letter-spacing, `text-muted-foreground`, 12px bottom margin
- Description variant: 14px body text, 1.6 line-height
- Key-value variant: `InfoRow` pairs with flex space-between, 8px vertical padding, `border-border/50` bottom border

### Linked Entity Card

- Card base with 14px border-radius
- Logo: 36×36px, 8px border-radius, `bg-accent`
- Name: 13px medium, `text-foreground`
- Meta: 11px, `text-muted-foreground`
- Arrow: lucide `ArrowRight`, 16px, `text-muted-foreground`
- Hover: `bg-accent/40`, `border-primary/30`

### Stacked Modal

- Background modal: `scale(0.90)`, `blur(1.5px)`, `opacity: 0.5`
- Transition: `200ms ease` on transform, filter, opacity
- Between-modal overlay: `rgba(0, 0, 0, 0.15)`
- Foreground modal shadow: `0 16px 48px rgba(0,0,0,0.2)`
```

- [ ] **Step 3: Commit**

```bash
git add web/design/ux-guidelines.md web/design/design-system.md
git commit -m "docs(web): add detail page patterns and modal stacking rules to design docs"
```

---

## Task 11: Quality Checks & Verification

- [ ] **Step 1: Run full quality suite**

```bash
bun run typecheck && bun run check && bun run test
```

Expected: All pass

- [ ] **Step 2: Fix any Biome issues**

If `check` reports formatting/lint issues:

```bash
bun run check:fix
```

- [ ] **Step 3: Run Knip for dead code**

```bash
bun run knip
```

Verify no new unused exports from the changes.

- [ ] **Step 4: Run dep:check for architecture boundaries**

```bash
bun run dep:check
```

Verify detail page routes don't violate Onion Architecture boundaries.

- [ ] **Step 5: Regenerate diagrams**

```bash
bun run domain:diagram && bun run app:diagram
```

Commit any diagram changes.

- [ ] **Step 6: Final commit if needed**

```bash
git add -A
git status
# Commit any remaining changes (diagrams, formatting fixes)
```
