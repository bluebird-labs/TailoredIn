# S4: Skills Vertical Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `/resume/skills` page with new SkillCategory/SkillItem domain entities backed by the `skill_categories`/`skill_items` tables from the S0 migration.

**Architecture:** Full vertical slice through all Onion Architecture layers. New domain entities (SkillCategory, SkillItem) replace old ones (ResumeSkillCategory, ResumeSkillItem). New ORM entities map to the S0 migration tables (`skill_categories`, `skill_items` with `profile_id` FK). API routes change from `/resume/skills` to `/skill-categories`. Existing use case class names are preserved but rewritten to use new types. Old code for resume generation (ResumeSkillCategory*) is left untouched.

**Tech Stack:** Bun, TypeScript, MikroORM, Elysia, React 19 + TanStack Query + dnd-kit + shadcn/ui

**Worktree:** `.claude/worktrees/dr-s4-skills` on branch `feat/dr-s4-skills`

**Key schema differences (old → new):**

| Aspect | Old | New |
|---|---|---|
| Tables | `resume_skill_categories`, `resume_skill_items` | `skill_categories`, `skill_items` |
| Owner FK | `user_id → users` | `profile_id → profiles` |
| Category name col | `category_name` | `name` |
| Item name col | `skill_name` | `name` |
| Domain entity | `ResumeSkillCategory` / `ResumeSkillItem` | `SkillCategory` / `SkillItem` |
| API routes | `/resume/skills/*` | `/skill-categories/*`, `/skill-items/*` |

---

### Task 1: Domain — SkillItem entity

**Files:**
- Create: `domain/src/entities/SkillItem.ts`
- Test: `domain/test/entities/SkillItem.test.ts`

- [ ] **Step 1: Write SkillItem tests**

```typescript
// domain/test/entities/SkillItem.test.ts
import { describe, expect, test } from 'bun:test';
import { SkillItem } from '../../src/entities/SkillItem.js';
import { SkillItemId } from '../../src/value-objects/SkillItemId.js';

describe('SkillItem', () => {
  test('create generates id and timestamps', () => {
    const item = SkillItem.create({ categoryId: 'cat-1', name: 'PostgreSQL', ordinal: 3 });

    expect(item.id).toBeInstanceOf(SkillItemId);
    expect(item.categoryId).toBe('cat-1');
    expect(item.name).toBe('PostgreSQL');
    expect(item.ordinal).toBe(3);
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  test('constructor reconstitutes from persisted data', () => {
    const id = SkillItemId.generate();
    const now = new Date();
    const item = new SkillItem({ id, categoryId: 'cat-1', name: 'React', ordinal: 0, createdAt: now, updatedAt: now });

    expect(item.id).toBe(id);
    expect(item.name).toBe('React');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/SkillItem.test.ts`
Expected: FAIL — `SkillItem` not found

- [ ] **Step 3: Implement SkillItem entity**

```typescript
// domain/src/entities/SkillItem.ts
import { Entity } from '../Entity.js';
import { SkillItemId } from '../value-objects/SkillItemId.js';

export type SkillItemCreateProps = {
  categoryId: string;
  name: string;
  ordinal: number;
};

export class SkillItem extends Entity<SkillItemId> {
  public readonly categoryId: string;
  public name: string;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillItemId;
    categoryId: string;
    name: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.categoryId = props.categoryId;
    this.name = props.name;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillItemCreateProps): SkillItem {
    const now = new Date();
    return new SkillItem({
      id: SkillItemId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd domain && bun test test/entities/SkillItem.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/SkillItem.ts domain/test/entities/SkillItem.test.ts
git commit -m "feat(domain): add SkillItem entity"
```

---

### Task 2: Domain — SkillCategory entity

**Files:**
- Create: `domain/src/entities/SkillCategory.ts`
- Test: `domain/test/entities/SkillCategory.test.ts`

- [ ] **Step 1: Write SkillCategory tests**

```typescript
// domain/test/entities/SkillCategory.test.ts
import { describe, expect, test } from 'bun:test';
import { SkillCategory } from '../../src/entities/SkillCategory.js';
import { SkillCategoryId } from '../../src/value-objects/SkillCategoryId.js';

describe('SkillCategory', () => {
  test('create generates id, starts with empty items', () => {
    const category = SkillCategory.create({ profileId: 'profile-1', name: 'Languages', ordinal: 0 });

    expect(category.id).toBeInstanceOf(SkillCategoryId);
    expect(category.profileId).toBe('profile-1');
    expect(category.name).toBe('Languages');
    expect(category.ordinal).toBe(0);
    expect(category.items).toHaveLength(0);
    expect(category.createdAt).toBeInstanceOf(Date);
  });
});

describe('SkillCategory.addItem', () => {
  test('creates item with correct categoryId', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    const item = category.addItem({ name: 'Node.js', ordinal: 0 });
    expect(item.categoryId).toBe(category.id.value);
  });

  test('pushes to items array', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    category.addItem({ name: 'Node.js', ordinal: 0 });
    category.addItem({ name: 'Bun', ordinal: 1 });
    expect(category.items).toHaveLength(2);
  });

  test('updates updatedAt', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    const before = category.updatedAt;
    category.addItem({ name: 'Node.js', ordinal: 0 });
    expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('SkillCategory.updateItem', () => {
  test('updates name when provided', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    const item = category.addItem({ name: 'Old', ordinal: 0 });
    category.updateItem(item.id.value, { name: 'New' });
    expect(item.name).toBe('New');
  });

  test('updates ordinal when provided', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    const item = category.addItem({ name: 'Test', ordinal: 0 });
    category.updateItem(item.id.value, { ordinal: 7 });
    expect(item.ordinal).toBe(7);
  });

  test('throws when itemId not found', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    expect(() => category.updateItem('nonexistent', { name: 'X' })).toThrow('Skill item not found');
  });
});

describe('SkillCategory.removeItem', () => {
  test('removes the correct item', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    const i1 = category.addItem({ name: 'Keep', ordinal: 0 });
    const i2 = category.addItem({ name: 'Remove', ordinal: 1 });
    category.removeItem(i2.id.value);
    expect(category.items).toHaveLength(1);
    expect(category.items[0].id.value).toBe(i1.id.value);
  });

  test('throws when itemId not found', () => {
    const category = SkillCategory.create({ profileId: 'p-1', name: 'Backend', ordinal: 0 });
    expect(() => category.removeItem('nonexistent')).toThrow('Skill item not found');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/SkillCategory.test.ts`
Expected: FAIL — `SkillCategory` not found

- [ ] **Step 3: Implement SkillCategory entity**

```typescript
// domain/src/entities/SkillCategory.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { SkillCategoryId } from '../value-objects/SkillCategoryId.js';
import { SkillItem } from './SkillItem.js';

export type SkillCategoryCreateProps = {
  profileId: string;
  name: string;
  ordinal: number;
};

export class SkillCategory extends AggregateRoot<SkillCategoryId> {
  public readonly profileId: string;
  public name: string;
  public ordinal: number;
  public readonly items: SkillItem[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillCategoryId;
    profileId: string;
    name: string;
    ordinal: number;
    items: SkillItem[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.name = props.name;
    this.ordinal = props.ordinal;
    this.items = props.items;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addItem(props: { name: string; ordinal: number }): SkillItem {
    const item = SkillItem.create({ categoryId: this.id.value, ...props });
    this.items.push(item);
    this.updatedAt = new Date();
    return item;
  }

  public updateItem(itemId: string, update: { name?: string; ordinal?: number }): void {
    const item = this.items.find(i => i.id.value === itemId);
    if (!item) throw new Error(`Skill item not found: ${itemId}`);
    if (update.name !== undefined) item.name = update.name;
    if (update.ordinal !== undefined) item.ordinal = update.ordinal;
    item.updatedAt = new Date();
    this.updatedAt = new Date();
  }

  public removeItem(itemId: string): void {
    const index = this.items.findIndex(i => i.id.value === itemId);
    if (index === -1) throw new Error(`Skill item not found: ${itemId}`);
    this.items.splice(index, 1);
    this.updatedAt = new Date();
  }

  public static create(props: SkillCategoryCreateProps): SkillCategory {
    const now = new Date();
    return new SkillCategory({
      id: SkillCategoryId.generate(),
      ...props,
      items: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd domain && bun test test/entities/SkillCategory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/SkillCategory.ts domain/test/entities/SkillCategory.test.ts
git commit -m "feat(domain): add SkillCategory aggregate root"
```

---

### Task 3: Domain — SkillCategoryRepository port + barrel exports

**Files:**
- Create: `domain/src/ports/SkillCategoryRepository.ts`
- Modify: `domain/src/index.ts`

- [ ] **Step 1: Create SkillCategoryRepository port**

```typescript
// domain/src/ports/SkillCategoryRepository.ts
import type { SkillCategory } from '../entities/SkillCategory.js';

export interface SkillCategoryRepository {
  findByIdOrFail(id: string): Promise<SkillCategory>;
  findByItemIdOrFail(itemId: string): Promise<SkillCategory>;
  findAll(): Promise<SkillCategory[]>;
  save(category: SkillCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Note: `findByItemIdOrFail` is needed because the API has `PUT /skill-items/:id` and `DELETE /skill-items/:id` — item-level routes that don't include the category ID. The repo must look up the parent category by item ID.

- [ ] **Step 2: Add barrel exports for new entities and port**

Add to `domain/src/index.ts`:
```typescript
// After the existing SkillItem entity export (around line 37):
export type { SkillCategoryCreateProps } from './entities/SkillCategory.js';
export { SkillCategory } from './entities/SkillCategory.js';
export type { SkillItemCreateProps as NewSkillItemCreateProps } from './entities/SkillItem.js';
export { SkillItem as NewSkillItem } from './entities/SkillItem.js';

// In the ports section (after ResumeSkillCategoryRepository, around line 62):
export type { SkillCategoryRepository } from './ports/SkillCategoryRepository.js';
```

Note: The new `SkillItem` entity is exported as `NewSkillItem` to avoid collision with the existing `SkillItem` (from `ResumeSkillItem`). However, check if there is already a `SkillItem` export — if not, export directly as `SkillItem`. The `SkillItem` name doesn't conflict with anything in the existing barrel (the old one is `ResumeSkillItem`), so export it directly:

```typescript
export type { SkillItemCreateProps } from './entities/SkillItem.js';
export { SkillItem } from './entities/SkillItem.js';
```

- [ ] **Step 3: Run domain tests**

Run: `cd domain && bun test`
Expected: All tests pass (existing + new)

- [ ] **Step 4: Commit**

```bash
git add domain/src/ports/SkillCategoryRepository.ts domain/src/index.ts
git commit -m "feat(domain): add SkillCategoryRepository port + barrel exports"
```

---

### Task 4: Application — SkillCategoryDto

**Files:**
- Create: `application/src/dtos/SkillCategoryDto.ts`
- Modify: `application/src/dtos/index.ts`

- [ ] **Step 1: Create SkillCategoryDto**

```typescript
// application/src/dtos/SkillCategoryDto.ts
export type SkillItemDto = {
  id: string;
  name: string;
  ordinal: number;
};

export type SkillCategoryDto = {
  id: string;
  name: string;
  ordinal: number;
  items: SkillItemDto[];
};
```

- [ ] **Step 2: Add barrel export**

Add to `application/src/dtos/index.ts`:
```typescript
export type { SkillCategoryDto, SkillItemDto } from './SkillCategoryDto.js';
```

- [ ] **Step 3: Commit**

```bash
git add application/src/dtos/SkillCategoryDto.ts application/src/dtos/index.ts
git commit -m "feat(application): add SkillCategoryDto"
```

---

### Task 5: Application — Rewrite use cases

**Files:**
- Modify: `application/src/use-cases/ListSkillCategories.ts`
- Modify: `application/src/use-cases/CreateSkillCategory.ts`
- Modify: `application/src/use-cases/UpdateSkillCategory.ts`
- Modify: `application/src/use-cases/DeleteSkillCategory.ts`
- Modify: `application/src/use-cases/AddSkillItem.ts`
- Modify: `application/src/use-cases/UpdateSkillItem.ts`
- Modify: `application/src/use-cases/DeleteSkillItem.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Rewrite ListSkillCategories**

Replace entire contents of `application/src/use-cases/ListSkillCategories.ts`:

```typescript
import type { SkillCategory, SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillCategoryDto } from '../dtos/SkillCategoryDto.js';

export class ListSkillCategories {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(): Promise<SkillCategoryDto[]> {
    const categories = await this.skillCategoryRepository.findAll();
    return categories.map(toCategoryDto);
  }
}

function toCategoryDto(category: SkillCategory): SkillCategoryDto {
  return {
    id: category.id.value,
    name: category.name,
    ordinal: category.ordinal,
    items: category.items.map(i => ({ id: i.id.value, name: i.name, ordinal: i.ordinal }))
  };
}
```

- [ ] **Step 2: Rewrite CreateSkillCategory**

Replace entire contents of `application/src/use-cases/CreateSkillCategory.ts`:

```typescript
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillCategoryDto } from '../dtos/SkillCategoryDto.js';

export type CreateSkillCategoryInput = {
  profileId: string;
  name: string;
  ordinal: number;
  items?: { name: string; ordinal: number }[];
};

export class CreateSkillCategory {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: CreateSkillCategoryInput): Promise<SkillCategoryDto> {
    const category = SkillCategory.create({
      profileId: input.profileId,
      name: input.name,
      ordinal: input.ordinal
    });
    for (const item of input.items ?? []) {
      category.addItem({ name: item.name, ordinal: item.ordinal });
    }
    await this.skillCategoryRepository.save(category);
    return {
      id: category.id.value,
      name: category.name,
      ordinal: category.ordinal,
      items: category.items.map(i => ({ id: i.id.value, name: i.name, ordinal: i.ordinal }))
    };
  }
}
```

- [ ] **Step 3: Rewrite UpdateSkillCategory**

Replace entire contents of `application/src/use-cases/UpdateSkillCategory.ts`:

```typescript
import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

export type UpdateSkillCategoryInput = {
  categoryId: string;
  name?: string;
  ordinal?: number;
};

export class UpdateSkillCategory {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: UpdateSkillCategoryInput): Promise<Result<void, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    if (input.name !== undefined) category.name = input.name;
    if (input.ordinal !== undefined) category.ordinal = input.ordinal;
    category.updatedAt = new Date();

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
```

- [ ] **Step 4: Rewrite DeleteSkillCategory**

Replace entire contents of `application/src/use-cases/DeleteSkillCategory.ts`:

```typescript
import { err, ok, type Result, type SkillCategoryRepository } from '@tailoredin/domain';

export type DeleteSkillCategoryInput = { categoryId: string };

export class DeleteSkillCategory {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: DeleteSkillCategoryInput): Promise<Result<void, Error>> {
    try {
      await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }
    await this.skillCategoryRepository.delete(input.categoryId);
    return ok(undefined);
  }
}
```

- [ ] **Step 5: Rewrite AddSkillItem**

Replace entire contents of `application/src/use-cases/AddSkillItem.ts`:

```typescript
import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillItemDto } from '../dtos/SkillCategoryDto.js';

export type AddSkillItemInput = {
  categoryId: string;
  name: string;
  ordinal: number;
};

export class AddSkillItem {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: AddSkillItemInput): Promise<Result<SkillItemDto, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    const item = category.addItem({ name: input.name, ordinal: input.ordinal });
    await this.skillCategoryRepository.save(category);

    return ok({ id: item.id.value, name: item.name, ordinal: item.ordinal });
  }
}
```

- [ ] **Step 6: Rewrite UpdateSkillItem**

Replace entire contents of `application/src/use-cases/UpdateSkillItem.ts`:

```typescript
import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

export type UpdateSkillItemInput = {
  itemId: string;
  name?: string;
  ordinal?: number;
};

export class UpdateSkillItem {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: UpdateSkillItemInput): Promise<Result<void, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByItemIdOrFail(input.itemId);
    } catch {
      return err(new Error(`Skill item not found: ${input.itemId}`));
    }

    try {
      category.updateItem(input.itemId, { name: input.name, ordinal: input.ordinal });
    } catch (e) {
      return err(e as Error);
    }

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
```

- [ ] **Step 7: Rewrite DeleteSkillItem**

Replace entire contents of `application/src/use-cases/DeleteSkillItem.ts`:

```typescript
import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

export type DeleteSkillItemInput = {
  itemId: string;
};

export class DeleteSkillItem {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: DeleteSkillItemInput): Promise<Result<void, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByItemIdOrFail(input.itemId);
    } catch {
      return err(new Error(`Skill item not found: ${input.itemId}`));
    }

    try {
      category.removeItem(input.itemId);
    } catch (e) {
      return err(e as Error);
    }

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
```

- [ ] **Step 8: Update use-cases barrel — remove old input types that changed**

In `application/src/use-cases/index.ts`, the existing exports for these use cases reference old types like `ListSkillCategoriesInput`. Since `ListSkillCategories` no longer has an input type, remove that export. The `UpdateSkillItemInput` and `DeleteSkillItemInput` changed shape (no longer have `categoryId`). The barrel should re-export whatever each file now exports. Verify the barrel matches the new file contents. Key changes:

- Remove: `export type { ListSkillCategoriesInput } from './ListSkillCategories.js';` (no longer exists)
- `UpdateSkillItemInput` no longer has `categoryId` — the type export stays, consumers update
- `DeleteSkillItemInput` no longer has `categoryId` — same

- [ ] **Step 9: Commit**

```bash
git add application/src/use-cases/ application/src/dtos/
git commit -m "feat(application): rewrite skill use cases for new domain model"
```

---

### Task 6: Infrastructure — ORM entities

**Files:**
- Create: `infrastructure/src/db/entities/profile/Profile.ts` (minimal — just `id` for FK reference)
- Create: `infrastructure/src/db/entities/skills/SkillCategory.ts`
- Create: `infrastructure/src/db/entities/skills/SkillItem.ts`
- Modify: `infrastructure/src/db/orm-config.ts`

- [ ] **Step 1: Create minimal Profile ORM entity**

Since S1 (Profile slice) runs in parallel and may not be merged yet, create a minimal Profile entity with just the `id` field for the FK reference. When S1 merges, reconcile.

```typescript
// infrastructure/src/db/entities/profile/Profile.ts
import { Entity } from '@mikro-orm/decorators/es';
import { BaseEntity as MikroOrmBaseEntity } from '@mikro-orm/postgresql';
import { UuidPrimaryKey } from '../../helpers.js';

@Entity({ tableName: 'profiles' })
export class Profile extends MikroOrmBaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  public constructor(id: string) {
    super();
    this.id = id;
  }
}
```

- [ ] **Step 2: Create SkillCategory ORM entity**

```typescript
// infrastructure/src/db/entities/skills/SkillCategory.ts
import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';
import { SkillItem } from './SkillItem.js';

export type SkillCategoryProps = {
  id: string;
  profile: RefOrEntity<Profile>;
  name: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'skill_categories' })
export class SkillCategory extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { lazy: true, name: 'profile_id' })
  public readonly profile: RefOrEntity<Profile>;

  @Property({ name: 'name', type: 'text' })
  public name: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => SkillItem,
    item => item.category,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly items: Collection<SkillItem> = new Collection<SkillItem>(this);

  public constructor(props: SkillCategoryProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.name = props.name;
    this.ordinal = props.ordinal;
  }
}
```

- [ ] **Step 3: Create SkillItem ORM entity**

```typescript
// infrastructure/src/db/entities/skills/SkillItem.ts
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { SkillCategory } from './SkillCategory.js';

export type SkillItemProps = {
  id: string;
  category: RefOrEntity<SkillCategory>;
  name: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'skill_items' })
export class SkillItem extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => SkillCategory, { lazy: true, name: 'skill_category_id' })
  public readonly category: RefOrEntity<SkillCategory>;

  @Property({ name: 'name', type: 'text' })
  public name: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: SkillItemProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.category = props.category;
    this.name = props.name;
    this.ordinal = props.ordinal;
  }
}
```

- [ ] **Step 4: Register new entities in orm-config.ts**

Add imports to `infrastructure/src/db/orm-config.ts`:
```typescript
import { Profile } from './entities/profile/Profile.js';
import { SkillCategory as OrmSkillCategory } from './entities/skills/SkillCategory.js';
import { SkillItem as OrmSkillItem } from './entities/skills/SkillItem.js';
```

Add to the `entities` array (after `ArchetypePositionBullet`):
```typescript
Profile,
OrmSkillCategory,
OrmSkillItem
```

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/db/entities/profile/Profile.ts \
      infrastructure/src/db/entities/skills/SkillCategory.ts \
      infrastructure/src/db/entities/skills/SkillItem.ts \
      infrastructure/src/db/orm-config.ts
git commit -m "feat(infrastructure): add SkillCategory + SkillItem ORM entities"
```

---

### Task 7: Infrastructure — PostgresSkillCategoryRepository

**Files:**
- Create: `infrastructure/src/repositories/PostgresSkillCategoryRepository.ts`
- Modify: `infrastructure/src/index.ts`

- [ ] **Step 1: Implement PostgresSkillCategoryRepository**

```typescript
// infrastructure/src/repositories/PostgresSkillCategoryRepository.ts
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  SkillCategory as DomainSkillCategory,
  SkillItem as DomainSkillItem,
  SkillCategoryId,
  type SkillCategoryRepository,
  SkillItemId
} from '@tailoredin/domain';
import { Profile } from '../db/entities/profile/Profile.js';
import { SkillCategory as OrmSkillCategory } from '../db/entities/skills/SkillCategory.js';
import { SkillItem as OrmSkillItem } from '../db/entities/skills/SkillItem.js';

@injectable()
export class PostgresSkillCategoryRepository implements SkillCategoryRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainSkillCategory> {
    const orm = await this.orm.em.findOneOrFail(OrmSkillCategory, id, { populate: ['profile'] });
    return this.toDomain(orm);
  }

  public async findByItemIdOrFail(itemId: string): Promise<DomainSkillCategory> {
    const ormItem = await this.orm.em.findOneOrFail(OrmSkillItem, itemId, { populate: ['category'] });
    const categoryId = typeof ormItem.category === 'string'
      ? ormItem.category
      : (ormItem.category as { id: string }).id;
    return this.findByIdOrFail(categoryId);
  }

  public async findAll(): Promise<DomainSkillCategory[]> {
    const ormCategories = await this.orm.em.find(
      OrmSkillCategory,
      {},
      { orderBy: { ordinal: 'ASC' } }
    );
    return Promise.all(ormCategories.map(c => this.toDomain(c)));
  }

  public async save(category: DomainSkillCategory): Promise<void> {
    const existing = await this.orm.em.findOne(OrmSkillCategory, category.id.value);

    if (existing) {
      existing.name = category.name;
      existing.ordinal = category.ordinal;
      existing.updatedAt = category.updatedAt;
      this.orm.em.persist(existing);
      await this.syncItems(category);
    } else {
      const profileRef = this.orm.em.getReference(Profile, category.profileId);
      const orm = new OrmSkillCategory({
        id: category.id.value,
        profile: profileRef,
        name: category.name,
        ordinal: category.ordinal,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      });
      this.orm.em.persist(orm);

      for (const item of category.items) {
        const ormItem = new OrmSkillItem({
          id: item.id.value,
          category: orm,
          name: item.name,
          ordinal: item.ordinal,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
        this.orm.em.persist(ormItem);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmSkillCategory, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async syncItems(domain: DomainSkillCategory): Promise<void> {
    const existingItems = await this.orm.em.find(OrmSkillItem, { category: domain.id.value });
    const domainItemIds = new Set(domain.items.map(i => i.id.value));
    const existingItemIds = new Set(existingItems.map(i => i.id));

    for (const existing of existingItems) {
      if (!domainItemIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    for (const item of domain.items) {
      if (existingItemIds.has(item.id.value)) {
        const ormItem = existingItems.find(i => i.id === item.id.value)!;
        ormItem.name = item.name;
        ormItem.ordinal = item.ordinal;
        ormItem.updatedAt = item.updatedAt;
        this.orm.em.persist(ormItem);
      } else {
        const categoryRef = this.orm.em.getReference(OrmSkillCategory, domain.id.value);
        const ormItem = new OrmSkillItem({
          id: item.id.value,
          category: categoryRef,
          name: item.name,
          ordinal: item.ordinal,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        });
        this.orm.em.persist(ormItem);
      }
    }
  }

  private async toDomain(orm: OrmSkillCategory): Promise<DomainSkillCategory> {
    const profileId = typeof orm.profile === 'string'
      ? orm.profile
      : (orm.profile as { id: string }).id;

    const ormItems = await this.orm.em.find(
      OrmSkillItem,
      { category: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const items = ormItems.map(
      i =>
        new DomainSkillItem({
          id: new SkillItemId(i.id),
          categoryId: orm.id,
          name: i.name,
          ordinal: i.ordinal,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt
        })
    );

    return new DomainSkillCategory({
      id: new SkillCategoryId(orm.id),
      profileId,
      name: orm.name,
      ordinal: orm.ordinal,
      items,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
```

- [ ] **Step 2: Add barrel export**

Add to `infrastructure/src/index.ts`:
```typescript
export { PostgresSkillCategoryRepository } from './repositories/PostgresSkillCategoryRepository.js';
```

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/repositories/PostgresSkillCategoryRepository.ts infrastructure/src/index.ts
git commit -m "feat(infrastructure): add PostgresSkillCategoryRepository"
```

---

### Task 8: Infrastructure — DI tokens

**Files:**
- Modify: `infrastructure/src/DI.ts`

- [ ] **Step 1: Add new DI tokens**

Add a new `SkillCategory` namespace to the DI object in `infrastructure/src/DI.ts`. Add the import for `SkillCategoryRepository` from domain:

```typescript
// Add to imports:
import type { SkillCategoryRepository } from '@tailoredin/domain';

// Add new namespace after Tag:
SkillCategory: {
  Repository: new InjectionToken<SkillCategoryRepository>('DI.SkillCategory.Repository'),
  ListSkillCategories: new InjectionToken<ListSkillCategories>('DI.SkillCategory.ListSkillCategories'),
  CreateSkillCategory: new InjectionToken<CreateSkillCategory>('DI.SkillCategory.CreateSkillCategory'),
  UpdateSkillCategory: new InjectionToken<UpdateSkillCategory>('DI.SkillCategory.UpdateSkillCategory'),
  DeleteSkillCategory: new InjectionToken<DeleteSkillCategory>('DI.SkillCategory.DeleteSkillCategory'),
  AddSkillItem: new InjectionToken<AddSkillItem>('DI.SkillCategory.AddSkillItem'),
  UpdateSkillItem: new InjectionToken<UpdateSkillItem>('DI.SkillCategory.UpdateSkillItem'),
  DeleteSkillItem: new InjectionToken<DeleteSkillItem>('DI.SkillCategory.DeleteSkillItem')
}
```

Note: The old `DI.Resume.SkillCategoryRepository` and related tokens are kept for backward compatibility (resume generation). The new tokens live under `DI.SkillCategory`.

- [ ] **Step 2: Commit**

```bash
git add infrastructure/src/DI.ts
git commit -m "feat(infrastructure): add DI tokens for new SkillCategory"
```

---

### Task 9: API — New routes

**Files:**
- Create: `api/src/routes/skill-categories/ListSkillCategoriesRoute.ts`
- Create: `api/src/routes/skill-categories/CreateSkillCategoryRoute.ts`
- Create: `api/src/routes/skill-categories/UpdateSkillCategoryRoute.ts`
- Create: `api/src/routes/skill-categories/DeleteSkillCategoryRoute.ts`
- Create: `api/src/routes/skill-categories/AddSkillItemRoute.ts`
- Create: `api/src/routes/skill-categories/UpdateSkillItemRoute.ts`
- Create: `api/src/routes/skill-categories/DeleteSkillItemRoute.ts`
- Create: `api/src/helpers/profile-id.ts`
- Modify: `api/src/container.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create profile ID helper**

The `skill_categories` table uses `profile_id` (not `user_id`). Since S1 (Profile) runs in parallel, create a lightweight helper to resolve the single profile's ID.

```typescript
// api/src/helpers/profile-id.ts
import { MikroORM } from '@mikro-orm/postgresql';

export async function getProfileId(orm: MikroORM): Promise<string> {
  const result = await orm.em.getConnection().execute<[{ id: string }]>(
    'SELECT id FROM profiles LIMIT 1'
  );
  if (!result.length) throw new Error('No profile found. Run seeds first.');
  return result[0].id;
}
```

- [ ] **Step 2: Create ListSkillCategoriesRoute**

```typescript
// api/src/routes/skill-categories/ListSkillCategoriesRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { ListSkillCategories } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListSkillCategoriesRoute {
  public constructor(
    private readonly listSkillCategories: ListSkillCategories = inject(DI.SkillCategory.ListSkillCategories)
  ) {}

  public plugin() {
    return new Elysia().get('/skill-categories', async () => {
      const data = await this.listSkillCategories.execute();
      return { data };
    });
  }
}
```

- [ ] **Step 3: Create CreateSkillCategoryRoute**

```typescript
// api/src/routes/skill-categories/CreateSkillCategoryRoute.ts
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { CreateSkillCategory } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class CreateSkillCategoryRoute {
  public constructor(
    private readonly createSkillCategory: CreateSkillCategory = inject(DI.SkillCategory.CreateSkillCategory),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/skill-categories',
      async ({ body, set }) => {
        const profileId = await getProfileId(this.orm);
        const data = await this.createSkillCategory.execute({
          profileId,
          name: body.name,
          ordinal: body.ordinal,
          items: body.items?.map(i => ({ name: i.name, ordinal: i.ordinal }))
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 }),
          items: t.Optional(
            t.Array(t.Object({ name: t.String({ minLength: 1 }), ordinal: t.Integer({ minimum: 0 }) }))
          )
        })
      }
    );
  }
}
```

- [ ] **Step 4: Create UpdateSkillCategoryRoute**

```typescript
// api/src/routes/skill-categories/UpdateSkillCategoryRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { UpdateSkillCategory } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateSkillCategoryRoute {
  public constructor(
    private readonly updateSkillCategory: UpdateSkillCategory = inject(DI.SkillCategory.UpdateSkillCategory)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/skill-categories/:id',
      async ({ params, body, set }) => {
        const result = await this.updateSkillCategory.execute({
          categoryId: params.id,
          name: body.name,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1 })),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
```

- [ ] **Step 5: Create DeleteSkillCategoryRoute**

```typescript
// api/src/routes/skill-categories/DeleteSkillCategoryRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { DeleteSkillCategory } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteSkillCategoryRoute {
  public constructor(
    private readonly deleteSkillCategory: DeleteSkillCategory = inject(DI.SkillCategory.DeleteSkillCategory)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/skill-categories/:id',
      async ({ params, set }) => {
        const result = await this.deleteSkillCategory.execute({ categoryId: params.id });
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

- [ ] **Step 6: Create AddSkillItemRoute**

```typescript
// api/src/routes/skill-categories/AddSkillItemRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { AddSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class AddSkillItemRoute {
  public constructor(
    private readonly addSkillItem: AddSkillItem = inject(DI.SkillCategory.AddSkillItem)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/skill-categories/:id/items',
      async ({ params, body, set }) => {
        const result = await this.addSkillItem.execute({
          categoryId: params.id,
          name: body.name,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          name: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
```

- [ ] **Step 7: Create UpdateSkillItemRoute**

```typescript
// api/src/routes/skill-categories/UpdateSkillItemRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { UpdateSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateSkillItemRoute {
  public constructor(
    private readonly updateSkillItem: UpdateSkillItem = inject(DI.SkillCategory.UpdateSkillItem)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/skill-items/:id',
      async ({ params, body, set }) => {
        const result = await this.updateSkillItem.execute({
          itemId: params.id,
          name: body.name,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1 })),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
```

- [ ] **Step 8: Create DeleteSkillItemRoute**

```typescript
// api/src/routes/skill-categories/DeleteSkillItemRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { DeleteSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteSkillItemRoute {
  public constructor(
    private readonly deleteSkillItem: DeleteSkillItem = inject(DI.SkillCategory.DeleteSkillItem)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/skill-items/:id',
      async ({ params, set }) => {
        const result = await this.deleteSkillItem.execute({ itemId: params.id });
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

- [ ] **Step 9: Wire new routes in container.ts**

Add new DI bindings to `api/src/container.ts`. Add imports for new route classes and `PostgresSkillCategoryRepository`. Add after the existing "Skills use cases" section:

```typescript
// New SkillCategory bindings (new domain model)
container.bind({ provide: DI.SkillCategory.Repository, useClass: PostgresSkillCategoryRepository });
container.bind({
  provide: DI.SkillCategory.ListSkillCategories,
  useFactory: () => new ListSkillCategories(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.CreateSkillCategory,
  useFactory: () => new CreateSkillCategory(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.UpdateSkillCategory,
  useFactory: () => new UpdateSkillCategory(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.DeleteSkillCategory,
  useFactory: () => new DeleteSkillCategory(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.AddSkillItem,
  useFactory: () => new AddSkillItem(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.UpdateSkillItem,
  useFactory: () => new UpdateSkillItem(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.DeleteSkillItem,
  useFactory: () => new DeleteSkillItem(container.get(DI.SkillCategory.Repository))
});
```

Import the new route classes at the top:
```typescript
import { ListSkillCategoriesRoute as NewListSkillCategoriesRoute } from './routes/skill-categories/ListSkillCategoriesRoute.js';
import { CreateSkillCategoryRoute as NewCreateSkillCategoryRoute } from './routes/skill-categories/CreateSkillCategoryRoute.js';
import { UpdateSkillCategoryRoute as NewUpdateSkillCategoryRoute } from './routes/skill-categories/UpdateSkillCategoryRoute.js';
import { DeleteSkillCategoryRoute as NewDeleteSkillCategoryRoute } from './routes/skill-categories/DeleteSkillCategoryRoute.js';
import { AddSkillItemRoute as NewAddSkillItemRoute } from './routes/skill-categories/AddSkillItemRoute.js';
import { UpdateSkillItemRoute as NewUpdateSkillItemRoute } from './routes/skill-categories/UpdateSkillItemRoute.js';
import { DeleteSkillItemRoute as NewDeleteSkillItemRoute } from './routes/skill-categories/DeleteSkillItemRoute.js';
```

- [ ] **Step 10: Replace old skill routes in index.ts**

In `api/src/index.ts`, replace the old `// Skills` section (lines 119-127) with the new routes:

```typescript
  // Skills (new domain model)
  .use(container.get(NewListSkillCategoriesRoute).plugin())
  .use(container.get(NewCreateSkillCategoryRoute).plugin())
  .use(container.get(NewUpdateSkillCategoryRoute).plugin())
  .use(container.get(NewDeleteSkillCategoryRoute).plugin())
  .use(container.get(NewAddSkillItemRoute).plugin())
  .use(container.get(NewUpdateSkillItemRoute).plugin())
  .use(container.get(NewDeleteSkillItemRoute).plugin())
```

Add the imports at the top of `index.ts` for the new route classes.

- [ ] **Step 11: Commit**

```bash
git add api/src/routes/skill-categories/ api/src/helpers/profile-id.ts api/src/container.ts api/src/index.ts
git commit -m "feat(api): add /skill-categories + /skill-items routes"
```

---

### Task 10: Seed — Profile row

**Files:**
- Modify: `infrastructure/src/db/seeds/ResumeDataSeeder.ts`

The `skill_categories` table has a FK to `profiles`. The existing seeder creates a `User` but not a `Profile`. We need a profile row so the new routes work.

- [ ] **Step 1: Add profile creation to ResumeDataSeeder**

After the User upsert in `ResumeDataSeeder.run()`, add a raw SQL upsert for the profile:

```typescript
// After the user is created/upserted, insert a profile row:
await em.getConnection().execute(`
  INSERT INTO profiles (id, email, first_name, last_name, phone, location, linkedin_url, github_url, website_url)
  VALUES (
    gen_random_uuid(),
    '${userData.email}',
    '${userData.firstName}',
    '${userData.lastName}',
    ${userData.phoneNumber ? `'${userData.phoneNumber}'` : 'NULL'},
    ${userData.locationLabel ? `'${userData.locationLabel}'` : 'NULL'},
    ${userData.linkedinHandle ? `'https://linkedin.com/in/${userData.linkedinHandle}'` : 'NULL'},
    ${userData.githubHandle ? `'https://github.com/${userData.githubHandle}'` : 'NULL'},
    NULL
  )
  ON CONFLICT DO NOTHING
`);
```

Note: Use `ON CONFLICT DO NOTHING` so re-running seeds is safe. If S1 adds a proper profile seed, this becomes redundant and can be removed.

- [ ] **Step 2: Commit**

```bash
git add infrastructure/src/db/seeds/ResumeDataSeeder.ts
git commit -m "feat(infrastructure): seed profile row for new skill_categories FK"
```

---

### Task 11: Web — Hooks

**Files:**
- Modify: `web/src/hooks/use-skills.ts`
- Modify: `web/src/lib/query-keys.ts`

- [ ] **Step 1: Update query keys**

In `web/src/lib/query-keys.ts`, rename the `skills` key to `skillCategories`:

```typescript
resume: {
  all: ['resume'] as const,
  companies: () => [...queryKeys.resume.all, 'companies'] as const,
  education: () => [...queryKeys.resume.all, 'education'] as const,
  skillCategories: () => [...queryKeys.resume.all, 'skill-categories'] as const,
  headlines: () => [...queryKeys.resume.all, 'headlines'] as const
}
```

- [ ] **Step 2: Rewrite use-skills.ts**

Replace entire contents of `web/src/hooks/use-skills.ts`. Key changes:
- API paths: `api.resume.skills` → `api['skill-categories']`
- Field names: `category_name` → `name`, `skill_name` → `name`
- Item update/delete: no longer need `categoryId` — use `api['skill-items']({ id })` directly

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useSkillCategories() {
  return useQuery({
    queryKey: queryKeys.resume.skillCategories(),
    queryFn: async () => {
      const { data } = await api['skill-categories'].get();
      return data;
    }
  });
}

export function useCreateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      ordinal: number;
      items?: { name: string; ordinal: number }[];
    }) => {
      const { data } = await api['skill-categories'].post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useUpdateSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; ordinal?: number }) => {
      await api['skill-categories']({ id }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useDeleteSkillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api['skill-categories']({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useAddSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      name,
      ordinal
    }: {
      categoryId: string;
      name: string;
      ordinal: number;
    }) => {
      const { data } = await api['skill-categories']({ id: categoryId }).items.post({ name, ordinal });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useUpdateSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      ...body
    }: {
      itemId: string;
      name?: string;
      ordinal?: number;
    }) => {
      await api['skill-items']({ id: itemId }).put(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}

export function useDeleteSkillItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api['skill-items']({ id: itemId }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.skillCategories() });
    }
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/use-skills.ts web/src/lib/query-keys.ts
git commit -m "feat(web): update skill hooks for new API endpoints"
```

---

### Task 12: Web — Rewrite skills page + components

**Files:**
- Modify: `web/src/routes/resume/skills.tsx`
- Modify: `web/src/components/resume/skills/category-form-dialog.tsx`
- Modify: `web/src/components/resume/skills/skill-category-card.tsx`
- Modify: `web/src/components/resume/skills/skill-item-list.tsx`

Property name changes across all components: `categoryName` → `name`, `skillName` → `name`.

- [ ] **Step 1: Update skills.tsx page**

Change the `SkillCategory` type and update property references:

```typescript
type SkillCategory = {
  id: string;
  name: string;
  ordinal: number;
  items: { id: string; name: string; ordinal: number }[];
};
```

Update all references: `category.categoryName` → `category.name`, etc.
The rest of the page logic (drag-and-drop, dialog state) stays the same.

Replace the `useUpdateSkillCategory` call ordinal mutation — the input field changes from `category_name` to `name`:
```typescript
updateCategory.mutate({ id: cat.id, ordinal: i });
```
This stays the same since it only sends `ordinal`.

- [ ] **Step 2: Update category-form-dialog.tsx**

Change the `Category` type: `categoryName` → `name`.
Update the form schema field: `categoryName` → `name`.
Update the mutation calls: `category_name: data.categoryName` → `name: data.name`.
Update the `register('categoryName')` → `register('name')`.
Update `defaultValues`: `{ categoryName: '' }` → `{ name: '' }`.
Update `reset`: `{ categoryName: category?.categoryName ?? '' }` → `{ name: category?.name ?? '' }`.

```typescript
const categorySchema = z.object({
  name: z.string().min(1, 'Required')
});

type CategoryFormData = z.infer<typeof categorySchema>;

type Category = {
  id: string;
  name: string;
  ordinal: number;
};
```

Mutation calls:
```typescript
// Edit
updateCategory.mutate(
  { id: category.id, name: data.name },
  { onSuccess: () => { toast.success('Category updated'); onOpenChange(false); } }
);

// Create
createCategory.mutate(
  { name: data.name, ordinal: nextOrdinal },
  { onSuccess: () => { toast.success('Category created'); onOpenChange(false); } }
);
```

- [ ] **Step 3: Update skill-category-card.tsx**

Change the types: `categoryName` → `name`, `skillName` → `name`.

```typescript
type SkillItem = {
  id: string;
  name: string;
  ordinal: number;
};

type SkillCategory = {
  id: string;
  name: string;
  ordinal: number;
  items: SkillItem[];
};
```

Update references: `category.categoryName` → `category.name` in `<CardTitle>`, toast, and delete dialog.

- [ ] **Step 4: Update skill-item-list.tsx**

Change the type: `skillName` → `name`.

```typescript
type SkillItem = {
  id: string;
  name: string;
  ordinal: number;
};
```

Update `addItem.mutate` call: `skill_name: name` → `name: name` (the field changed).
Update `useUpdateSkillItem` call: `categoryId` is no longer needed, use `itemId` only.
Update `useDeleteSkillItem` call: no longer needs `categoryId`, just pass `deleteTarget.id` directly.

Key changes in mutation calls:
```typescript
// addItem — categoryId stays (it's the parent), field name changes
addItem.mutate({ categoryId, name: name, ordinal }, { onSuccess: () => setNewName('') });

// updateItem — no longer needs categoryId
updateItem.mutate({ itemId: item.id, ordinal: i });

// deleteItem — just the item ID
deleteItem.mutate(deleteTarget.id, {
  onSuccess: () => {
    toast.success(`${deleteTarget.name} removed`);
    setDeleteTarget(null);
  }
});
```

Update display: `item.skillName` → `item.name` in Badge and delete dialog.

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/resume/skills.tsx \
      web/src/components/resume/skills/category-form-dialog.tsx \
      web/src/components/resume/skills/skill-category-card.tsx \
      web/src/components/resume/skills/skill-item-list.tsx
git commit -m "feat(web): rewrite skills page for new domain model"
```

---

### Task 13: Verification

- [ ] **Step 1: Run domain tests**

Run: `cd domain && bun test`
Expected: All pass

- [ ] **Step 2: Run Biome check**

Run: `bun run check`
Expected: Clean (fix any issues)

- [ ] **Step 3: Run dependency boundary check**

Run: `bun run dep:check`
Expected: No circular dependencies or cross-layer violations

- [ ] **Step 4: Run knip**

Run: `bun run knip`
Expected: No new dead code from changes (old Resume* code may flag — that's expected and not part of this slice)

- [ ] **Step 5: Start dev environment and test**

Run: `bun dev:up`

Then start api + web:
Run: `bun run dev`

- [ ] **Step 6: UI testing checklist**

Open the URL printed by `dev:up` in a browser. Navigate to `/resume/skills`.

- [ ] Categories load with items
- [ ] Create a category — appears in list
- [ ] Add skill items to category — items appear
- [ ] Drag to reorder categories — reload, ordinals persist
- [ ] Edit category name — persists after reload
- [ ] Delete an item — removed
- [ ] Delete a category — category and items removed

- [ ] **Step 7: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address verification issues"
```
