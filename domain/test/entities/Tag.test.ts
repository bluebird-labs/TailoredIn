import { describe, expect, test } from 'bun:test';
import { Tag, TagDimension } from '../../src/entities/Tag.js';

describe('Tag', () => {
  test('creates a role tag', () => {
    const tag = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    expect(tag.name).toBe('leadership');
    expect(tag.dimension).toBe(TagDimension.ROLE);
  });

  test('creates a skill tag', () => {
    const tag = Tag.create({ name: 'typescript', dimension: TagDimension.SKILL });
    expect(tag.name).toBe('typescript');
    expect(tag.dimension).toBe(TagDimension.SKILL);
  });

  test('normalizes name to lowercase kebab-case', () => {
    const tag = Tag.create({ name: 'Distributed Systems', dimension: TagDimension.SKILL });
    expect(tag.name).toBe('distributed-systems');
  });
});
