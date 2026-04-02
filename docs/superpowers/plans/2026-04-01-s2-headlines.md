# S2 Headlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/resume/headlines` with a new Headline entity supporting role tags, backed by the new `headlines` + `headline_tags` tables from the S0 migration.

**Architecture:** Full vertical slice — domain entity → application use cases → infrastructure repository → API routes → web page. The new Headline entity carries role tags (references to Tag entities with dimension=ROLE). The new API uses flat `/headlines` routes instead of the old `/users/:userId/resume/headlines` paths. A `GET /tags?dimension=ROLE` endpoint exposes the tag vocabulary for the role tag picker.

**Tech Stack:** Bun, MikroORM (PostgreSQL), Elysia, React 19, TanStack Query/Router, shadcn/ui, react-hook-form + zod

**Worktree:** `.claude/worktrees/dr-s2-headlines`

---

## File Map

```
domain/
  src/entities/Headline.ts              — NEW: Headline aggregate root
  src/ports/HeadlineRepository.ts       — NEW: HeadlineRepository port
  src/index.ts                          — MODIFY: add Headline + HeadlineRepository exports
  test/entities/Headline.test.ts        — NEW: unit tests

application/
  src/use-cases/headline/               — NEW directory
    CreateHeadline2.ts                  — NEW (suffixed to avoid collision with existing CreateHeadline)
    UpdateHeadline2.ts                  — NEW
    DeleteHeadline2.ts                  — NEW
    ListHeadlines2.ts                   — NEW
    index.ts                            — NEW: barrel
  src/use-cases/tag/                    — NEW directory
    ListTags.ts                         — NEW
    index.ts                            — NEW: barrel
  src/dtos/HeadlineDto.ts               — NEW
  src/dtos/TagDto.ts                    — NEW
  src/dtos/index.ts                     — MODIFY: add new DTO exports
  src/use-cases/index.ts                — MODIFY: add new use case exports
  test/use-cases/headline/              — NEW directory
    CreateHeadline2.test.ts             — NEW
    UpdateHeadline2.test.ts             — NEW
    DeleteHeadline2.test.ts             — NEW
    ListHeadlines2.test.ts              — NEW
  test/use-cases/tag/                   — NEW directory
    ListTags.test.ts                    — NEW

infrastructure/
  src/db/entities/headline/             — NEW directory
    Headline.ts                         — NEW: ORM entity
    HeadlineTag.ts                      — NEW: ORM join entity
  src/db/orm-config.ts                  — MODIFY: register new ORM entities
  src/repositories/PostgresHeadlineRepository.ts  — NEW
  src/DI.ts                             — MODIFY: add Headline + Tag DI tokens
  src/index.ts                          — MODIFY: add PostgresHeadlineRepository export

api/
  src/routes/headline/                  — NEW directory
    ListHeadlines2Route.ts              — NEW
    CreateHeadline2Route.ts             — NEW
    UpdateHeadline2Route.ts             — NEW
    DeleteHeadline2Route.ts             — NEW
  src/routes/tag/                       — NEW directory
    ListTagsRoute.ts                    — NEW
  src/container.ts                      — MODIFY: bind new DI tokens
  src/index.ts                          — MODIFY: register new routes

web/
  src/routes/resume/headlines.tsx       — REWRITE
  src/hooks/use-headlines.ts            — REWRITE
  src/hooks/use-tags.ts                 — NEW
  src/lib/query-keys.ts                 — MODIFY: add tags key
```

> **Note on "2" suffix:** The existing codebase has `CreateHeadline`, `UpdateHeadline`, etc. for the old `ResumeHeadline` entity. The new use cases use a `2` suffix to coexist during the transition. After all slices are merged, old code will be cleaned up.

---

## Task 1: Domain — Headline Entity

**Files:**
- Create: `domain/src/entities/Headline.ts`
- Create: `domain/src/ports/HeadlineRepository.ts`
- Modify: `domain/src/index.ts`
- Test: `domain/test/entities/Headline.test.ts`

### Steps

- [ ] **Step 1: Write the failing tests**

Create `domain/test/entities/Headline.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Tag, TagDimension } from '../../src/entities/Tag.js';
import { Headline } from '../../src/entities/Headline.js';

describe('Headline', () => {
  test('creates a headline with label, summary, and no tags', () => {
    const headline = Headline.create({
      profileId: 'profile-1',
      label: 'Full-Stack Engineer',
      summaryText: 'Experienced engineer with 10 years in web development.'
    });

    expect(headline.id.value).toBeString();
    expect(headline.profileId).toBe('profile-1');
    expect(headline.label).toBe('Full-Stack Engineer');
    expect(headline.summaryText).toBe('Experienced engineer with 10 years in web development.');
    expect(headline.roleTags).toEqual([]);
    expect(headline.createdAt).toBeInstanceOf(Date);
    expect(headline.updatedAt).toBeInstanceOf(Date);
  });

  test('creates a headline with role tags', () => {
    const tag1 = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const tag2 = Tag.create({ name: 'architecture', dimension: TagDimension.ROLE });

    const headline = Headline.create({
      profileId: 'profile-1',
      label: 'Engineering Manager',
      summaryText: 'Technical leader focused on team growth.',
      roleTags: [tag1, tag2]
    });

    expect(headline.roleTags).toHaveLength(2);
    expect(headline.roleTags[0].name).toBe('leadership');
    expect(headline.roleTags[1].name).toBe('architecture');
  });

  test('updates mutable fields', () => {
    const headline = Headline.create({
      profileId: 'profile-1',
      label: 'Old Label',
      summaryText: 'Old summary.'
    });

    headline.label = 'New Label';
    headline.summaryText = 'New summary.';
    headline.updatedAt = new Date();

    expect(headline.label).toBe('New Label');
    expect(headline.summaryText).toBe('New summary.');
  });

  test('replaces role tags', () => {
    const tag1 = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const headline = Headline.create({
      profileId: 'profile-1',
      label: 'Test',
      summaryText: 'Test summary.',
      roleTags: [tag1]
    });

    const tag2 = Tag.create({ name: 'mentoring', dimension: TagDimension.ROLE });
    headline.roleTags = [tag2];

    expect(headline.roleTags).toHaveLength(1);
    expect(headline.roleTags[0].name).toBe('mentoring');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd .claude/worktrees/dr-s2-headlines/domain && bun test test/entities/Headline.test.ts`
Expected: FAIL — `Cannot find module '../../src/entities/Headline.js'`

- [ ] **Step 3: Implement Headline entity**

Create `domain/src/entities/Headline.ts`:

```typescript
import { AggregateRoot } from '../AggregateRoot.js';
import { HeadlineId } from '../value-objects/HeadlineId.js';
import type { Tag } from './Tag.js';

export type HeadlineCreateProps = {
  profileId: string;
  label: string;
  summaryText: string;
  roleTags?: Tag[];
};

export class Headline extends AggregateRoot<HeadlineId> {
  public readonly profileId: string;
  public label: string;
  public summaryText: string;
  public roleTags: Tag[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: HeadlineId;
    profileId: string;
    label: string;
    summaryText: string;
    roleTags: Tag[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.label = props.label;
    this.summaryText = props.summaryText;
    this.roleTags = props.roleTags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: HeadlineCreateProps): Headline {
    const now = new Date();
    return new Headline({
      id: HeadlineId.generate(),
      profileId: props.profileId,
      label: props.label,
      summaryText: props.summaryText,
      roleTags: props.roleTags ?? [],
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Create HeadlineRepository port**

Create `domain/src/ports/HeadlineRepository.ts`:

```typescript
import type { Headline } from '../entities/Headline.js';

export interface HeadlineRepository {
  findByIdOrFail(id: string): Promise<Headline>;
  findAll(): Promise<Headline[]>;
  save(headline: Headline): Promise<void>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 5: Update domain barrel export**

Add to `domain/src/index.ts`:

```typescript
// After existing entity exports:
export type { HeadlineCreateProps } from './entities/Headline.js';
export { Headline } from './entities/Headline.js';

// After existing port exports:
export type { HeadlineRepository } from './ports/HeadlineRepository.js';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd .claude/worktrees/dr-s2-headlines/domain && bun test test/entities/Headline.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 7: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add domain/src/entities/Headline.ts domain/src/ports/HeadlineRepository.ts domain/src/index.ts domain/test/entities/Headline.test.ts
git commit -m "feat(domain): add Headline entity with role tags and HeadlineRepository port"
```

---

## Task 2: Application — DTOs

**Files:**
- Create: `application/src/dtos/HeadlineDto.ts`
- Create: `application/src/dtos/TagDto.ts`
- Modify: `application/src/dtos/index.ts`

### Steps

- [ ] **Step 1: Create TagDto**

Create `application/src/dtos/TagDto.ts`:

```typescript
export type TagDto = {
  id: string;
  name: string;
  dimension: string;
};
```

- [ ] **Step 2: Create HeadlineDto**

Create `application/src/dtos/HeadlineDto.ts`:

```typescript
import type { TagDto } from './TagDto.js';

export type HeadlineDto = {
  id: string;
  label: string;
  summaryText: string;
  roleTags: TagDto[];
};
```

- [ ] **Step 3: Update dtos barrel export**

Add to `application/src/dtos/index.ts`:

```typescript
export type { HeadlineDto } from './HeadlineDto.js';
export type { TagDto } from './TagDto.js';
```

- [ ] **Step 4: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add application/src/dtos/HeadlineDto.ts application/src/dtos/TagDto.ts application/src/dtos/index.ts
git commit -m "feat(application): add HeadlineDto and TagDto"
```

---

## Task 3: Application — ListTags Use Case

**Files:**
- Create: `application/src/use-cases/tag/ListTags.ts`
- Create: `application/src/use-cases/tag/index.ts`
- Modify: `application/src/use-cases/index.ts`
- Test: `application/test/use-cases/tag/ListTags.test.ts`

### Steps

- [ ] **Step 1: Write the failing test**

Create `application/test/use-cases/tag/ListTags.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Tag, TagDimension } from '@tailoredin/domain';
import type { TagRepository } from '@tailoredin/domain';
import { ListTags } from '../../../src/use-cases/tag/ListTags.js';

describe('ListTags', () => {
  test('returns tags filtered by dimension', async () => {
    const roleTag = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const skillTag = Tag.create({ name: 'typescript', dimension: TagDimension.SKILL });

    const repo: TagRepository = {
      findByIdOrFail: async () => { throw new Error('Not implemented'); },
      findByNameAndDimension: async () => null,
      findAllByDimension: async (dimension) => {
        if (dimension === TagDimension.ROLE) return [roleTag];
        return [skillTag];
      },
      findAll: async () => [roleTag, skillTag],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new ListTags(repo);
    const result = await useCase.execute({ dimension: 'ROLE' });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('leadership');
    expect(result[0].dimension).toBe('ROLE');
  });

  test('returns all tags when no dimension specified', async () => {
    const roleTag = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const skillTag = Tag.create({ name: 'typescript', dimension: TagDimension.SKILL });

    const repo: TagRepository = {
      findByIdOrFail: async () => { throw new Error('Not implemented'); },
      findByNameAndDimension: async () => null,
      findAllByDimension: async () => [],
      findAll: async () => [roleTag, skillTag],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new ListTags(repo);
    const result = await useCase.execute({});

    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/worktrees/dr-s2-headlines/application && bun test test/use-cases/tag/ListTags.test.ts`
Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Implement ListTags use case**

Create `application/src/use-cases/tag/ListTags.ts`:

```typescript
import type { TagRepository } from '@tailoredin/domain';
import { TagDimension } from '@tailoredin/domain';
import type { TagDto } from '../../dtos/TagDto.js';

export type ListTagsInput = {
  dimension?: string;
};

export class ListTags {
  public constructor(private readonly tagRepository: TagRepository) {}

  public async execute(input: ListTagsInput): Promise<TagDto[]> {
    const tags = input.dimension
      ? await this.tagRepository.findAllByDimension(input.dimension as TagDimension)
      : await this.tagRepository.findAll();

    return tags.map(tag => ({
      id: tag.id.value,
      name: tag.name,
      dimension: tag.dimension
    }));
  }
}
```

- [ ] **Step 4: Create barrel export**

Create `application/src/use-cases/tag/index.ts`:

```typescript
export type { ListTagsInput } from './ListTags.js';
export { ListTags } from './ListTags.js';
```

- [ ] **Step 5: Update use-cases barrel**

Add to `application/src/use-cases/index.ts`:

```typescript
export type { ListTagsInput } from './tag/ListTags.js';
export { ListTags } from './tag/ListTags.js';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd .claude/worktrees/dr-s2-headlines/application && bun test test/use-cases/tag/ListTags.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add application/src/use-cases/tag/ application/src/use-cases/index.ts application/test/use-cases/tag/
git commit -m "feat(application): add ListTags use case"
```

---

## Task 4: Application — Headline Use Cases (Create, List, Update, Delete)

**Files:**
- Create: `application/src/use-cases/headline/CreateHeadline2.ts`
- Create: `application/src/use-cases/headline/ListHeadlines2.ts`
- Create: `application/src/use-cases/headline/UpdateHeadline2.ts`
- Create: `application/src/use-cases/headline/DeleteHeadline2.ts`
- Create: `application/src/use-cases/headline/index.ts`
- Modify: `application/src/use-cases/index.ts`
- Test: `application/test/use-cases/headline/CreateHeadline2.test.ts`
- Test: `application/test/use-cases/headline/ListHeadlines2.test.ts`
- Test: `application/test/use-cases/headline/UpdateHeadline2.test.ts`
- Test: `application/test/use-cases/headline/DeleteHeadline2.test.ts`

### Steps

- [ ] **Step 1: Write CreateHeadline2 failing test**

Create `application/test/use-cases/headline/CreateHeadline2.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Tag, TagDimension } from '@tailoredin/domain';
import type { HeadlineRepository, TagRepository } from '@tailoredin/domain';
import type { Headline } from '@tailoredin/domain';
import { CreateHeadline2 } from '../../../src/use-cases/headline/CreateHeadline2.js';

function mockHeadlineRepo(onSave?: (h: Headline) => void): HeadlineRepository {
  return {
    findByIdOrFail: async () => { throw new Error('Not implemented'); },
    findAll: async () => [],
    save: async (h) => { onSave?.(h); },
    delete: async () => {}
  };
}

function mockTagRepo(tags: Tag[]): TagRepository {
  return {
    findByIdOrFail: async (id) => {
      const tag = tags.find(t => t.id.value === id);
      if (!tag) throw new Error(`Tag not found: ${id}`);
      return tag;
    },
    findByNameAndDimension: async () => null,
    findAllByDimension: async () => [],
    findAll: async () => tags,
    save: async () => {},
    delete: async () => {}
  };
}

describe('CreateHeadline2', () => {
  test('creates headline without tags', async () => {
    let saved: Headline | undefined;
    const useCase = new CreateHeadline2(mockHeadlineRepo(h => { saved = h; }), mockTagRepo([]));

    const dto = await useCase.execute({
      profileId: 'profile-1',
      label: 'Full-Stack Engineer',
      summaryText: 'Experienced developer.',
      roleTagIds: []
    });

    expect(dto.id).toBeString();
    expect(dto.label).toBe('Full-Stack Engineer');
    expect(dto.summaryText).toBe('Experienced developer.');
    expect(dto.roleTags).toEqual([]);
    expect(saved).toBeDefined();
  });

  test('creates headline with role tags', async () => {
    const tag = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const useCase = new CreateHeadline2(mockHeadlineRepo(), mockTagRepo([tag]));

    const dto = await useCase.execute({
      profileId: 'profile-1',
      label: 'Engineering Manager',
      summaryText: 'Technical leader.',
      roleTagIds: [tag.id.value]
    });

    expect(dto.roleTags).toHaveLength(1);
    expect(dto.roleTags[0].name).toBe('leadership');
  });
});
```

- [ ] **Step 2: Write ListHeadlines2 failing test**

Create `application/test/use-cases/headline/ListHeadlines2.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Headline } from '@tailoredin/domain';
import type { HeadlineRepository } from '@tailoredin/domain';
import { ListHeadlines2 } from '../../../src/use-cases/headline/ListHeadlines2.js';

describe('ListHeadlines2', () => {
  test('returns all headlines as DTOs', async () => {
    const h1 = Headline.create({ profileId: 'p1', label: 'Engineer', summaryText: 'Summary 1' });
    const h2 = Headline.create({ profileId: 'p1', label: 'Manager', summaryText: 'Summary 2' });

    const repo: HeadlineRepository = {
      findByIdOrFail: async () => { throw new Error('Not implemented'); },
      findAll: async () => [h1, h2],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new ListHeadlines2(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Engineer');
    expect(result[1].label).toBe('Manager');
    expect(result[0].roleTags).toEqual([]);
  });
});
```

- [ ] **Step 3: Write UpdateHeadline2 failing test**

Create `application/test/use-cases/headline/UpdateHeadline2.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Headline, Tag, TagDimension } from '@tailoredin/domain';
import type { HeadlineRepository, TagRepository } from '@tailoredin/domain';
import { UpdateHeadline2 } from '../../../src/use-cases/headline/UpdateHeadline2.js';

describe('UpdateHeadline2', () => {
  test('updates headline fields and tags', async () => {
    const existing = Headline.create({ profileId: 'p1', label: 'Old', summaryText: 'Old summary' });
    const tag = Tag.create({ name: 'mentoring', dimension: TagDimension.ROLE });

    const headlineRepo: HeadlineRepository = {
      findByIdOrFail: async () => existing,
      findAll: async () => [],
      save: async () => {},
      delete: async () => {}
    };

    const tagRepo: TagRepository = {
      findByIdOrFail: async (id) => {
        if (id === tag.id.value) return tag;
        throw new Error('Not found');
      },
      findByNameAndDimension: async () => null,
      findAllByDimension: async () => [],
      findAll: async () => [],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new UpdateHeadline2(headlineRepo, tagRepo);
    const result = await useCase.execute({
      headlineId: existing.id.value,
      label: 'New Label',
      summaryText: 'New summary',
      roleTagIds: [tag.id.value]
    });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.label).toBe('New Label');
      expect(result.value.summaryText).toBe('New summary');
      expect(result.value.roleTags).toHaveLength(1);
      expect(result.value.roleTags[0].name).toBe('mentoring');
    }
  });

  test('returns error when headline not found', async () => {
    const headlineRepo: HeadlineRepository = {
      findByIdOrFail: async () => { throw new Error('Not found'); },
      findAll: async () => [],
      save: async () => {},
      delete: async () => {}
    };

    const tagRepo: TagRepository = {
      findByIdOrFail: async () => { throw new Error('Not found'); },
      findByNameAndDimension: async () => null,
      findAllByDimension: async () => [],
      findAll: async () => [],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new UpdateHeadline2(headlineRepo, tagRepo);
    const result = await useCase.execute({
      headlineId: 'nonexistent',
      label: 'X',
      summaryText: 'X',
      roleTagIds: []
    });

    expect(result.isOk).toBe(false);
  });
});
```

- [ ] **Step 4: Write DeleteHeadline2 failing test**

Create `application/test/use-cases/headline/DeleteHeadline2.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import type { HeadlineRepository } from '@tailoredin/domain';
import { DeleteHeadline2 } from '../../../src/use-cases/headline/DeleteHeadline2.js';

describe('DeleteHeadline2', () => {
  test('deletes headline and returns ok', async () => {
    let deletedId: string | undefined;

    const repo: HeadlineRepository = {
      findByIdOrFail: async () => { throw new Error('Not implemented'); },
      findAll: async () => [],
      save: async () => {},
      delete: async (id) => { deletedId = id; }
    };

    const useCase = new DeleteHeadline2(repo);
    const result = await useCase.execute({ headlineId: 'headline-1' });

    expect(result.isOk).toBe(true);
    expect(deletedId).toBe('headline-1');
  });

  test('returns error when headline not found', async () => {
    const repo: HeadlineRepository = {
      findByIdOrFail: async () => { throw new Error('Not implemented'); },
      findAll: async () => [],
      save: async () => {},
      delete: async () => { throw new Error('Not found'); }
    };

    const useCase = new DeleteHeadline2(repo);
    const result = await useCase.execute({ headlineId: 'nonexistent' });

    expect(result.isOk).toBe(false);
  });
});
```

- [ ] **Step 5: Run all tests to verify they fail**

Run: `cd .claude/worktrees/dr-s2-headlines/application && bun test test/use-cases/headline/`
Expected: FAIL — `Cannot find module`

- [ ] **Step 6: Implement CreateHeadline2**

Create `application/src/use-cases/headline/CreateHeadline2.ts`:

```typescript
import type { HeadlineRepository, TagRepository } from '@tailoredin/domain';
import { Headline } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export type CreateHeadline2Input = {
  profileId: string;
  label: string;
  summaryText: string;
  roleTagIds: string[];
};

export class CreateHeadline2 {
  public constructor(
    private readonly headlineRepository: HeadlineRepository,
    private readonly tagRepository: TagRepository
  ) {}

  public async execute(input: CreateHeadline2Input): Promise<HeadlineDto> {
    const roleTags = await Promise.all(
      input.roleTagIds.map(id => this.tagRepository.findByIdOrFail(id))
    );

    const headline = Headline.create({
      profileId: input.profileId,
      label: input.label,
      summaryText: input.summaryText,
      roleTags
    });

    await this.headlineRepository.save(headline);

    return {
      id: headline.id.value,
      label: headline.label,
      summaryText: headline.summaryText,
      roleTags: headline.roleTags.map(t => ({ id: t.id.value, name: t.name, dimension: t.dimension }))
    };
  }
}
```

- [ ] **Step 7: Implement ListHeadlines2**

Create `application/src/use-cases/headline/ListHeadlines2.ts`:

```typescript
import type { HeadlineRepository } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export class ListHeadlines2 {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(): Promise<HeadlineDto[]> {
    const headlines = await this.headlineRepository.findAll();
    return headlines.map(h => ({
      id: h.id.value,
      label: h.label,
      summaryText: h.summaryText,
      roleTags: h.roleTags.map(t => ({ id: t.id.value, name: t.name, dimension: t.dimension }))
    }));
  }
}
```

- [ ] **Step 8: Implement UpdateHeadline2**

Create `application/src/use-cases/headline/UpdateHeadline2.ts`:

```typescript
import type { HeadlineRepository, TagRepository } from '@tailoredin/domain';
import type { Result } from '@tailoredin/domain';
import { ok, err } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export type UpdateHeadline2Input = {
  headlineId: string;
  label: string;
  summaryText: string;
  roleTagIds: string[];
};

export class UpdateHeadline2 {
  public constructor(
    private readonly headlineRepository: HeadlineRepository,
    private readonly tagRepository: TagRepository
  ) {}

  public async execute(input: UpdateHeadline2Input): Promise<Result<HeadlineDto, Error>> {
    let headline;
    try {
      headline = await this.headlineRepository.findByIdOrFail(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }

    const roleTags = await Promise.all(
      input.roleTagIds.map(id => this.tagRepository.findByIdOrFail(id))
    );

    headline.label = input.label;
    headline.summaryText = input.summaryText;
    headline.roleTags = roleTags;
    headline.updatedAt = new Date();

    await this.headlineRepository.save(headline);

    return ok({
      id: headline.id.value,
      label: headline.label,
      summaryText: headline.summaryText,
      roleTags: headline.roleTags.map(t => ({ id: t.id.value, name: t.name, dimension: t.dimension }))
    });
  }
}
```

- [ ] **Step 9: Implement DeleteHeadline2**

Create `application/src/use-cases/headline/DeleteHeadline2.ts`:

```typescript
import type { HeadlineRepository } from '@tailoredin/domain';
import type { Result } from '@tailoredin/domain';
import { ok, err } from '@tailoredin/domain';

export type DeleteHeadline2Input = {
  headlineId: string;
};

export class DeleteHeadline2 {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(input: DeleteHeadline2Input): Promise<Result<void, Error>> {
    try {
      await this.headlineRepository.delete(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }
    return ok(undefined);
  }
}
```

- [ ] **Step 10: Create headline barrel export**

Create `application/src/use-cases/headline/index.ts`:

```typescript
export type { CreateHeadline2Input } from './CreateHeadline2.js';
export { CreateHeadline2 } from './CreateHeadline2.js';
export type { DeleteHeadline2Input } from './DeleteHeadline2.js';
export { DeleteHeadline2 } from './DeleteHeadline2.js';
export { ListHeadlines2 } from './ListHeadlines2.js';
export type { UpdateHeadline2Input } from './UpdateHeadline2.js';
export { UpdateHeadline2 } from './UpdateHeadline2.js';
```

- [ ] **Step 11: Update use-cases barrel**

Add to `application/src/use-cases/index.ts`:

```typescript
export type { CreateHeadline2Input } from './headline/CreateHeadline2.js';
export { CreateHeadline2 } from './headline/CreateHeadline2.js';
export type { DeleteHeadline2Input } from './headline/DeleteHeadline2.js';
export { DeleteHeadline2 } from './headline/DeleteHeadline2.js';
export { ListHeadlines2 } from './headline/ListHeadlines2.js';
export type { UpdateHeadline2Input } from './headline/UpdateHeadline2.js';
export { UpdateHeadline2 } from './headline/UpdateHeadline2.js';
```

- [ ] **Step 12: Run all headline use case tests**

Run: `cd .claude/worktrees/dr-s2-headlines/application && bun test test/use-cases/headline/`
Expected: PASS — all tests green

- [ ] **Step 13: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add application/src/use-cases/headline/ application/src/use-cases/index.ts application/test/use-cases/headline/
git commit -m "feat(application): add Headline CRUD use cases (Create, List, Update, Delete)"
```

---

## Task 5: Infrastructure — ORM Entities + Repository

**Files:**
- Create: `infrastructure/src/db/entities/headline/Headline.ts`
- Create: `infrastructure/src/db/entities/headline/HeadlineTag.ts`
- Modify: `infrastructure/src/db/orm-config.ts`
- Create: `infrastructure/src/repositories/PostgresHeadlineRepository.ts`
- Modify: `infrastructure/src/DI.ts`
- Modify: `infrastructure/src/index.ts`

### Steps

- [ ] **Step 1: Create Headline ORM entity**

Create `infrastructure/src/db/entities/headline/Headline.ts`:

```typescript
import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';

@Entity({ tableName: 'headlines' })
export class Headline extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ name: 'label', type: 'text' })
  public label: string;

  @Property({ name: 'summary_text', type: 'text' })
  public summaryText: string;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'headline_tags',
    joinColumn: 'headline_id',
    inverseJoinColumn: 'tag_id'
  })
  public roleTags = new Collection<Tag>(this);

  public constructor(props: {
    id: string;
    profileId: string;
    label: string;
    summaryText: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profileId = props.profileId;
    this.label = props.label;
    this.summaryText = props.summaryText;
  }
}
```

- [ ] **Step 2: Register ORM entity in orm-config.ts**

Add `Headline` (aliased as `OrmHeadline`) to the imports and entities array in `infrastructure/src/db/orm-config.ts`:

```typescript
// Add import:
import { Headline as OrmHeadline } from './entities/headline/Headline.js';

// Add to entities array:
OrmHeadline,
```

Also add the S0 `Tag` ORM entity if not already registered:

```typescript
import { Tag as OrmTag } from './entities/tag/Tag.js';

// Add to entities array:
OrmTag,
```

- [ ] **Step 3: Create PostgresHeadlineRepository**

Create `infrastructure/src/repositories/PostgresHeadlineRepository.ts`:

```typescript
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Headline as DomainHeadline, HeadlineId, Tag as DomainTag, TagDimension, TagId } from '@tailoredin/domain';
import type { HeadlineRepository } from '@tailoredin/domain';
import { Headline as OrmHeadline } from '../db/entities/headline/Headline.js';
import { Tag as OrmTag } from '../db/entities/tag/Tag.js';

@injectable()
export class PostgresHeadlineRepository implements HeadlineRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainHeadline> {
    const orm = await this.orm.em.findOneOrFail(OrmHeadline, id, { populate: ['roleTags'] });
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainHeadline[]> {
    const ormEntities = await this.orm.em.find(OrmHeadline, {}, { populate: ['roleTags'], orderBy: { createdAt: 'ASC' } });
    return ormEntities.map(e => this.toDomain(e));
  }

  public async save(headline: DomainHeadline): Promise<void> {
    const existing = await this.orm.em.findOne(OrmHeadline, headline.id.value, { populate: ['roleTags'] });

    if (existing) {
      existing.label = headline.label;
      existing.summaryText = headline.summaryText;
      existing.updatedAt = headline.updatedAt;

      // Replace role tags
      existing.roleTags.removeAll();
      for (const tag of headline.roleTags) {
        const tagRef = this.orm.em.getReference(OrmTag, tag.id.value);
        existing.roleTags.add(tagRef);
      }

      this.orm.em.persist(existing);
    } else {
      const orm = new OrmHeadline({
        id: headline.id.value,
        profileId: headline.profileId,
        label: headline.label,
        summaryText: headline.summaryText,
        createdAt: headline.createdAt,
        updatedAt: headline.updatedAt
      });

      for (const tag of headline.roleTags) {
        const tagRef = this.orm.em.getReference(OrmTag, tag.id.value);
        orm.roleTags.add(tagRef);
      }

      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmHeadline, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmHeadline): DomainHeadline {
    const roleTags = orm.roleTags.isInitialized()
      ? orm.roleTags.getItems().map(t => new DomainTag({
          id: new TagId(t.id),
          name: t.name,
          dimension: t.dimension as TagDimension,
          createdAt: t.createdAt
        }))
      : [];

    return new DomainHeadline({
      id: new HeadlineId(orm.id),
      profileId: orm.profileId,
      label: orm.label,
      summaryText: orm.summaryText,
      roleTags,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
```

- [ ] **Step 4: Update DI tokens**

Add to `infrastructure/src/DI.ts`:

Import the new use case types at the top:

```typescript
import type {
  // ... existing imports ...
  CreateHeadline2,
  DeleteHeadline2,
  ListHeadlines2,
  ListTags,
  UpdateHeadline2,
} from '@tailoredin/application';
import type { HeadlineRepository } from '@tailoredin/domain';
```

Add new DI tokens in the `DI` object:

```typescript
Headline: {
  Repository: new InjectionToken<HeadlineRepository>('DI.Headline.Repository'),
  List: new InjectionToken<ListHeadlines2>('DI.Headline.List'),
  Create: new InjectionToken<CreateHeadline2>('DI.Headline.Create'),
  Update: new InjectionToken<UpdateHeadline2>('DI.Headline.Update'),
  Delete: new InjectionToken<DeleteHeadline2>('DI.Headline.Delete')
},

// Extend existing Tag section:
Tag: {
  Repository: new InjectionToken<TagRepository>('DI.Tag.Repository'),
  List: new InjectionToken<ListTags>('DI.Tag.List')
},
```

- [ ] **Step 5: Update infrastructure barrel**

Add to `infrastructure/src/index.ts`:

```typescript
export { PostgresHeadlineRepository } from './repositories/PostgresHeadlineRepository.js';
```

- [ ] **Step 6: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add infrastructure/src/db/entities/headline/ infrastructure/src/db/orm-config.ts infrastructure/src/repositories/PostgresHeadlineRepository.ts infrastructure/src/DI.ts infrastructure/src/index.ts
git commit -m "feat(infrastructure): add Headline ORM entity, PostgresHeadlineRepository, and DI tokens"
```

---

## Task 6: API — Routes + Container Bindings

**Files:**
- Create: `api/src/routes/headline/ListHeadlines2Route.ts`
- Create: `api/src/routes/headline/CreateHeadline2Route.ts`
- Create: `api/src/routes/headline/UpdateHeadline2Route.ts`
- Create: `api/src/routes/headline/DeleteHeadline2Route.ts`
- Create: `api/src/routes/tag/ListTagsRoute.ts`
- Modify: `api/src/container.ts`
- Modify: `api/src/index.ts`

### Steps

- [ ] **Step 1: Create ListHeadlines2Route**

Create `api/src/routes/headline/ListHeadlines2Route.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { ListHeadlines2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListHeadlines2Route {
  public constructor(private readonly listHeadlines: ListHeadlines2 = inject(DI.Headline.List)) {}

  public plugin() {
    return new Elysia().get('/headlines', async () => {
      const headlines = await this.listHeadlines.execute();
      return { data: headlines };
    });
  }
}
```

- [ ] **Step 2: Create CreateHeadline2Route**

Create `api/src/routes/headline/CreateHeadline2Route.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { CreateHeadline2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateHeadline2Route {
  public constructor(private readonly createHeadline: CreateHeadline2 = inject(DI.Headline.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/headlines',
      async ({ body, set }) => {
        const headline = await this.createHeadline.execute({
          profileId: body.profile_id,
          label: body.label,
          summaryText: body.summary_text,
          roleTagIds: body.role_tag_ids
        });
        set.status = 201;
        return { data: headline };
      },
      {
        body: t.Object({
          profile_id: t.String({ format: 'uuid' }),
          label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 }),
          role_tag_ids: t.Array(t.String({ format: 'uuid' }))
        })
      }
    );
  }
}
```

- [ ] **Step 3: Create UpdateHeadline2Route**

Create `api/src/routes/headline/UpdateHeadline2Route.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { UpdateHeadline2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateHeadline2Route {
  public constructor(private readonly updateHeadline: UpdateHeadline2 = inject(DI.Headline.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/headlines/:id',
      async ({ params, body, set }) => {
        const result = await this.updateHeadline.execute({
          headlineId: params.id,
          label: body.label,
          summaryText: body.summary_text,
          roleTagIds: body.role_tag_ids
        });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 }),
          role_tag_ids: t.Array(t.String({ format: 'uuid' }))
        })
      }
    );
  }
}
```

- [ ] **Step 4: Create DeleteHeadline2Route**

Create `api/src/routes/headline/DeleteHeadline2Route.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { DeleteHeadline2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteHeadline2Route {
  public constructor(private readonly deleteHeadline: DeleteHeadline2 = inject(DI.Headline.Delete)) {}

  public plugin() {
    return new Elysia().delete(
      '/headlines/:id',
      async ({ params, set }) => {
        const result = await this.deleteHeadline.execute({ headlineId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
```

- [ ] **Step 5: Create ListTagsRoute**

Create `api/src/routes/tag/ListTagsRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { ListTags } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListTagsRoute {
  public constructor(private readonly listTags: ListTags = inject(DI.Tag.List)) {}

  public plugin() {
    return new Elysia().get(
      '/tags',
      async ({ query }) => {
        const tags = await this.listTags.execute({ dimension: query.dimension });
        return { data: tags };
      },
      {
        query: t.Object({
          dimension: t.Optional(t.String())
        })
      }
    );
  }
}
```

- [ ] **Step 6: Update container.ts — bind new DI tokens**

Add imports and bindings to `api/src/container.ts`:

```typescript
// Add imports:
import { CreateHeadline2, DeleteHeadline2, ListHeadlines2, ListTags, UpdateHeadline2 } from '@tailoredin/application';
import { PostgresHeadlineRepository, PostgresTagRepository } from '@tailoredin/infrastructure';

// Add bindings after existing headline section:

// S2 Headline (new domain model)
container.bind({ provide: DI.Headline.Repository, useClass: PostgresHeadlineRepository });
container.bind({ provide: DI.Tag.Repository, useClass: PostgresTagRepository });
container.bind({
  provide: DI.Headline.List,
  useFactory: () => new ListHeadlines2(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Create,
  useFactory: () => new CreateHeadline2(container.get(DI.Headline.Repository), container.get(DI.Tag.Repository))
});
container.bind({
  provide: DI.Headline.Update,
  useFactory: () => new UpdateHeadline2(container.get(DI.Headline.Repository), container.get(DI.Tag.Repository))
});
container.bind({
  provide: DI.Headline.Delete,
  useFactory: () => new DeleteHeadline2(container.get(DI.Headline.Repository))
});

// Tags
container.bind({
  provide: DI.Tag.List,
  useFactory: () => new ListTags(container.get(DI.Tag.Repository))
});
```

- [ ] **Step 7: Update index.ts — register routes**

Add imports and `.use()` calls to `api/src/index.ts`:

```typescript
// Add imports:
import { CreateHeadline2Route } from './routes/headline/CreateHeadline2Route.js';
import { DeleteHeadline2Route } from './routes/headline/DeleteHeadline2Route.js';
import { ListHeadlines2Route } from './routes/headline/ListHeadlines2Route.js';
import { UpdateHeadline2Route } from './routes/headline/UpdateHeadline2Route.js';
import { ListTagsRoute } from './routes/tag/ListTagsRoute.js';

// Add .use() calls before the .onError() chain:
  // S2 Headlines (new domain)
  .use(container.get(ListHeadlines2Route).plugin())
  .use(container.get(CreateHeadline2Route).plugin())
  .use(container.get(UpdateHeadline2Route).plugin())
  .use(container.get(DeleteHeadline2Route).plugin())
  // Tags
  .use(container.get(ListTagsRoute).plugin())
```

- [ ] **Step 8: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add api/src/routes/headline/ api/src/routes/tag/ api/src/container.ts api/src/index.ts
git commit -m "feat(api): add Headline CRUD routes and ListTags route"
```

---

## Task 7: Web — Rewrite Headlines Page

**Files:**
- Rewrite: `web/src/routes/resume/headlines.tsx`
- Rewrite: `web/src/hooks/use-headlines.ts`
- Create: `web/src/hooks/use-tags.ts`
- Modify: `web/src/lib/query-keys.ts`

### Steps

- [ ] **Step 1: Add tags query key**

Add to `web/src/lib/query-keys.ts`:

```typescript
tags: {
  all: ['tags'] as const,
  byDimension: (dimension: string) => ['tags', dimension] as const
},
```

- [ ] **Step 2: Create use-tags hook**

Create `web/src/hooks/use-tags.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useTags(dimension?: string) {
  return useQuery({
    queryKey: dimension ? queryKeys.tags.byDimension(dimension) : queryKeys.tags.all,
    queryFn: async () => {
      const { data } = await api.tags.get({ query: { dimension } });
      return data;
    }
  });
}
```

- [ ] **Step 3: Rewrite use-headlines hook**

Rewrite `web/src/hooks/use-headlines.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useHeadlines() {
  return useQuery({
    queryKey: queryKeys.resume.headlines(),
    queryFn: async () => {
      const { data } = await api.headlines.get();
      return data;
    }
  });
}
```

- [ ] **Step 4: Rewrite headlines page**

Rewrite `web/src/routes/resume/headlines.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useHeadlines } from '@/hooks/use-headlines';
import { useTags } from '@/hooks/use-tags';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/resume/headlines')({
  component: HeadlinesPage
});

const headlineSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  summaryText: z.string().min(1, 'Summary is required')
});

type HeadlineFormValues = z.infer<typeof headlineSchema>;

type TagOption = { id: string; name: string };

type Headline = {
  id: string;
  label: string;
  summaryText: string;
  roleTags: TagOption[];
};

function HeadlinesPage() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Headline | null>(null);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const { data: headlinesResponse, isLoading } = useHeadlines();
  const { data: tagsResponse } = useTags('ROLE');

  const headlines: Headline[] = headlinesResponse?.data ?? [];
  const availableTags: TagOption[] = (tagsResponse?.data ?? []).map((t: { id: string; name: string }) => ({
    id: t.id,
    name: t.name
  }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HeadlineFormValues>({
    resolver: zodResolver(headlineSchema),
    defaultValues: { label: '', summaryText: '' }
  });

  useEffect(() => {
    if (editingHeadline) {
      reset({ label: editingHeadline.label, summaryText: editingHeadline.summaryText });
      setSelectedTags(editingHeadline.roleTags);
    } else {
      reset({ label: '', summaryText: '' });
      setSelectedTags([]);
    }
  }, [editingHeadline, reset]);

  const createMutation = useMutation({
    mutationFn: async (values: HeadlineFormValues) => {
      return api.headlines.post({
        profile_id: '00000000-0000-0000-0000-000000000001', // Default profile — replaced when S1 merges
        label: values.label,
        summary_text: values.summaryText,
        role_tag_ids: selectedTags.map(t => t.id)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
      setDialogOpen(false);
      toast.success('Headline created');
    },
    onError: () => {
      toast.error('Failed to create headline');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: HeadlineFormValues }) => {
      return api.headlines({ id }).put({
        label: values.label,
        summary_text: values.summaryText,
        role_tag_ids: selectedTags.map(t => t.id)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
      setDialogOpen(false);
      setEditingHeadline(null);
      toast.success('Headline updated');
    },
    onError: () => {
      toast.error('Failed to update headline');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.headlines({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
      setDeleteTarget(null);
      toast.success('Headline deleted');
    },
    onError: () => {
      toast.error('Failed to delete headline');
    }
  });

  function openAdd() {
    setEditingHeadline(null);
    setDialogOpen(true);
  }

  function openEdit(headline: Headline) {
    setEditingHeadline(headline);
    setDialogOpen(true);
  }

  function onSubmit(values: HeadlineFormValues) {
    if (editingHeadline) {
      updateMutation.mutate({ id: editingHeadline.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  function toggleTag(tag: TagOption) {
    setSelectedTags(prev =>
      prev.some(t => t.id === tag.id) ? prev.filter(t => t.id !== tag.id) : [...prev, tag]
    );
  }

  function removeTag(tagId: string) {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Headlines</h1>
      <p className="text-muted-foreground mt-2">Resume headline and summary variations for different archetypes.</p>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Headlines</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Headline
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Role Tags</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : headlines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No headlines yet. Add your first headline.
                  </TableCell>
                </TableRow>
              ) : (
                headlines.map((headline: Headline) => (
                  <TableRow key={headline.id}>
                    <TableCell className="font-medium">{headline.label}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{headline.summaryText}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {headline.roleTags.map(tag => (
                          <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(headline)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(headline)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setEditingHeadline(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHeadline ? 'Edit Headline' : 'Add Headline'}</DialogTitle>
            <DialogDescription>
              {editingHeadline
                ? 'Update the headline label, summary text, and role tags.'
                : 'Create a new headline for your resume.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder='e.g. "Full-Stack Engineer"' {...register('label')} />
              {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="summaryText">Summary</Label>
              <textarea
                id="summaryText"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A brief professional summary..."
                {...register('summaryText')}
              />
              {errors.summaryText && <p className="text-sm text-destructive">{errors.summaryText.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role Tags</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedTags.map(tag => (
                  <Badge key={tag.id} variant="secondary" className="gap-1">
                    {tag.name}
                    <button type="button" onClick={() => removeTag(tag.id)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        {availableTags
                          .filter(tag => !selectedTags.some(s => s.id === tag.id))
                          .map(tag => (
                            <CommandItem
                              key={tag.id}
                              value={tag.name}
                              onSelect={() => {
                                toggleTag(tag);
                                setTagPopoverOpen(false);
                              }}
                            >
                              {tag.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Headline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.label}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add web/src/routes/resume/headlines.tsx web/src/hooks/use-headlines.ts web/src/hooks/use-tags.ts web/src/lib/query-keys.ts
git commit -m "feat(web): rewrite headlines page with role tag multi-select"
```

---

## Task 8: Verification — Lint + Type Check

**Files:** None (verification only)

### Steps

- [ ] **Step 1: Run Biome check**

Run: `cd .claude/worktrees/dr-s2-headlines && bun run check`
Expected: Clean (no errors). Fix any issues before proceeding.

- [ ] **Step 2: Run domain tests**

Run: `cd .claude/worktrees/dr-s2-headlines/domain && bun test`
Expected: All tests pass (including existing + new Headline tests)

- [ ] **Step 3: Run application tests**

Run: `cd .claude/worktrees/dr-s2-headlines/application && bun test`
Expected: All tests pass (including existing + new headline/tag use case tests)

- [ ] **Step 4: Run knip (dead code detection)**

Run: `cd .claude/worktrees/dr-s2-headlines && bun run knip`
Expected: No new dead code introduced. Note: old headline code may be flagged — that's expected since we're replacing in-place but not removing old code yet.

- [ ] **Step 5: Verify shadcn components exist**

The headlines page uses `Command`, `Popover`, and `Badge` from shadcn. Verify they exist:

Run: `ls .claude/worktrees/dr-s2-headlines/web/src/components/ui/{command,popover,badge}.tsx 2>&1`

If any are missing, install them:

Run: `cd .claude/worktrees/dr-s2-headlines/web && bunx shadcn@latest add command popover badge`

- [ ] **Step 6: Fix any issues and commit**

```bash
cd .claude/worktrees/dr-s2-headlines
git add -A
git commit -m "fix: resolve lint and type errors"
```

---

## Task 9: UI Verification

**Prerequisite:** Dev environment running

### Steps

- [ ] **Step 1: Start dev environment**

Run: `cd .claude/worktrees/dr-s2-headlines && bun dev:up`
Wait for API + web to start. Note the local URL.

- [ ] **Step 2: Run migration**

Run: `cd .claude/worktrees/dr-s2-headlines/infrastructure && bun run db:migration:up`
Expected: Migration applies successfully (S0 migration creates headlines + headline_tags tables)

- [ ] **Step 3: Seed a profile row** (needed for profile_id FK)

Run:
```bash
cd .claude/worktrees/dr-s2-headlines
# Insert a default profile if one doesn't exist
bun --eval "
import { MikroORM } from '@mikro-orm/postgresql';
import { createOrmConfig } from '@tailoredin/infrastructure';
import { env, envInt } from '@tailoredin/core';

const orm = await MikroORM.init(createOrmConfig({
  timezone: env('TZ'),
  user: env('POSTGRES_USER'),
  password: env('POSTGRES_PASSWORD'),
  dbName: env('POSTGRES_DB'),
  schema: env('POSTGRES_SCHEMA'),
  host: env('POSTGRES_HOST'),
  port: envInt('POSTGRES_PORT')
}));

await orm.em.execute(\`
  INSERT INTO profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000001', 'dev@example.com', 'Dev', 'User', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING
\`);
await orm.close();
console.log('Profile seeded');
"
```

- [ ] **Step 4: Seed some role tags**

```bash
cd .claude/worktrees/dr-s2-headlines
bun --eval "
import { MikroORM } from '@mikro-orm/postgresql';
import { createOrmConfig } from '@tailoredin/infrastructure';
import { env, envInt } from '@tailoredin/core';

const orm = await MikroORM.init(createOrmConfig({
  timezone: env('TZ'),
  user: env('POSTGRES_USER'),
  password: env('POSTGRES_PASSWORD'),
  dbName: env('POSTGRES_DB'),
  schema: env('POSTGRES_SCHEMA'),
  host: env('POSTGRES_HOST'),
  port: envInt('POSTGRES_PORT')
}));

const tags = ['leadership', 'ic', 'architecture', 'mentoring', 'hands-on', 'strategy', 'cross-functional', 'management'];
for (const name of tags) {
  await orm.em.execute(\`
    INSERT INTO tags (id, name, dimension, created_at)
    VALUES (gen_random_uuid(), '\${name}', 'ROLE', NOW())
    ON CONFLICT (name, dimension) DO NOTHING
  \`);
}
await orm.close();
console.log('Role tags seeded');
"
```

- [ ] **Step 5: Manual UI testing**

Open the local URL at `/resume/headlines` and verify:
1. Table loads (empty initially)
2. Click "Add Headline" — dialog opens with label, summary, and role tag picker
3. Create headline with label + summary + role tags — appears in table with tag badges
4. Click edit — form pre-populates including tags
5. Change role tags, save — tags update in table
6. Delete headline — removed from table
7. Create headline without tags — works fine

- [ ] **Step 6: Stop dev environment**

Run: `cd .claude/worktrees/dr-s2-headlines && bun dev:down`
