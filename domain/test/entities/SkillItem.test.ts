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
