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
