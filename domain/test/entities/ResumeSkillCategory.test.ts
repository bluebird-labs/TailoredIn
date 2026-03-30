import { describe, expect, test } from 'bun:test';
import { ResumeSkillCategory } from '../../src/entities/ResumeSkillCategory.js';
import { ResumeSkillItem } from '../../src/entities/ResumeSkillItem.js';
import { ResumeSkillCategoryId } from '../../src/value-objects/ResumeSkillCategoryId.js';

describe('ResumeSkillCategory', () => {
  test('create generates id, includes items', () => {
    const item = ResumeSkillItem.create({ categoryId: 'temp', skillName: 'TypeScript', ordinal: 0 });
    const category = ResumeSkillCategory.create({
      userId: 'user-1',
      categoryName: 'backend',
      ordinal: 1,
      items: [item]
    });

    expect(category.id).toBeInstanceOf(ResumeSkillCategoryId);
    expect(category.userId).toBe('user-1');
    expect(category.categoryName).toBe('backend');
    expect(category.ordinal).toBe(1);
    expect(category.items).toHaveLength(1);
    expect(category.items[0].skillName).toBe('TypeScript');
    expect(category.createdAt).toBeInstanceOf(Date);
  });

  test('create with empty items', () => {
    const category = ResumeSkillCategory.create({
      userId: 'user-1',
      categoryName: 'frontend',
      ordinal: 0,
      items: []
    });

    expect(category.items).toHaveLength(0);
  });
});

describe('ResumeSkillCategory.addItem', () => {
  test('creates an item with the correct categoryId', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const item = category.addItem({ skillName: 'Node.js', ordinal: 0 });
    expect(item.categoryId).toBe(category.id.value);
  });

  test('pushes to items array', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    category.addItem({ skillName: 'Node.js', ordinal: 0 });
    category.addItem({ skillName: 'Bun', ordinal: 1 });
    expect(category.items).toHaveLength(2);
  });

  test('updates updatedAt', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const before = category.updatedAt;
    category.addItem({ skillName: 'Node.js', ordinal: 0 });
    expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('returns the created item', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const item = category.addItem({ skillName: 'TypeScript', ordinal: 3 });
    expect(item.skillName).toBe('TypeScript');
    expect(item.ordinal).toBe(3);
  });
});

describe('ResumeSkillCategory.updateItem', () => {
  test('updates skillName when provided', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const item = category.addItem({ skillName: 'Old', ordinal: 0 });
    category.updateItem(item.id.value, { skillName: 'New' });
    expect(item.skillName).toBe('New');
  });

  test('updates ordinal when provided', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const item = category.addItem({ skillName: 'Test', ordinal: 0 });
    category.updateItem(item.id.value, { ordinal: 7 });
    expect(item.ordinal).toBe(7);
  });

  test('updates item.updatedAt', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const item = category.addItem({ skillName: 'Test', ordinal: 0 });
    const before = item.updatedAt;
    category.updateItem(item.id.value, { skillName: 'Changed' });
    expect(item.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('throws when itemId not found', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    expect(() => category.updateItem('nonexistent', { skillName: 'X' })).toThrow('Skill item not found');
  });
});

describe('ResumeSkillCategory.removeItem', () => {
  test('removes the correct item', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const i1 = category.addItem({ skillName: 'Keep', ordinal: 0 });
    const i2 = category.addItem({ skillName: 'Remove', ordinal: 1 });
    category.removeItem(i2.id.value);
    expect(category.items).toHaveLength(1);
    expect(category.items[0].id.value).toBe(i1.id.value);
  });

  test('updates updatedAt', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    const item = category.addItem({ skillName: 'Test', ordinal: 0 });
    const before = category.updatedAt;
    category.removeItem(item.id.value);
    expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('throws when itemId not found', () => {
    const category = ResumeSkillCategory.create({ userId: 'user-1', categoryName: 'backend', ordinal: 0, items: [] });
    expect(() => category.removeItem('nonexistent')).toThrow('Skill item not found');
  });
});

describe('ResumeSkillItem', () => {
  test('create generates id and timestamps', () => {
    const item = ResumeSkillItem.create({
      categoryId: 'cat-1',
      skillName: 'PostgreSQL',
      ordinal: 3
    });

    expect(item.categoryId).toBe('cat-1');
    expect(item.skillName).toBe('PostgreSQL');
    expect(item.ordinal).toBe(3);
    expect(item.createdAt).toBeInstanceOf(Date);
  });
});
