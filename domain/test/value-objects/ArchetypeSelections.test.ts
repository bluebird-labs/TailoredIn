import { describe, expect, test } from 'bun:test';
import {
  ArchetypeEducationSelection,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection
} from '../../src/value-objects/ArchetypeSelections.js';

describe('ArchetypeEducationSelection', () => {
  test('stores educationId and ordinal', () => {
    const sel = new ArchetypeEducationSelection('edu-1', 0);
    expect(sel.educationId).toBe('edu-1');
    expect(sel.ordinal).toBe(0);
  });

  test('equals compares by value', () => {
    const a = new ArchetypeEducationSelection('edu-1', 0);
    const b = new ArchetypeEducationSelection('edu-1', 0);
    expect(a.equals(b)).toBe(true);
  });

  test('not equal with different educationId', () => {
    const a = new ArchetypeEducationSelection('edu-1', 0);
    const b = new ArchetypeEducationSelection('edu-2', 0);
    expect(a.equals(b)).toBe(false);
  });
});

describe('ArchetypeSkillCategorySelection', () => {
  test('stores categoryId and ordinal', () => {
    const sel = new ArchetypeSkillCategorySelection('cat-1', 2);
    expect(sel.categoryId).toBe('cat-1');
    expect(sel.ordinal).toBe(2);
  });

  test('equals compares by value', () => {
    const a = new ArchetypeSkillCategorySelection('cat-1', 2);
    const b = new ArchetypeSkillCategorySelection('cat-1', 2);
    expect(a.equals(b)).toBe(true);
  });
});

describe('ArchetypeSkillItemSelection', () => {
  test('stores itemId and ordinal', () => {
    const sel = new ArchetypeSkillItemSelection('item-1', 3);
    expect(sel.itemId).toBe('item-1');
    expect(sel.ordinal).toBe(3);
  });

  test('equals compares by value', () => {
    const a = new ArchetypeSkillItemSelection('item-1', 3);
    const b = new ArchetypeSkillItemSelection('item-1', 3);
    expect(a.equals(b)).toBe(true);
  });
});
