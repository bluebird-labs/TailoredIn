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
