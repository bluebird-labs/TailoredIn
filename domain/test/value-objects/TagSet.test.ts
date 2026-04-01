import { describe, expect, test } from 'bun:test';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('TagSet', () => {
  test('creates with role and skill tags', () => {
    const tagSet = new TagSet({ roleTags: ['leadership', 'mentoring'], skillTags: ['typescript'] });
    expect(tagSet.roleTags).toEqual(['leadership', 'mentoring']);
    expect(tagSet.skillTags).toEqual(['typescript']);
  });

  test('creates empty by default', () => {
    const tagSet = TagSet.empty();
    expect(tagSet.roleTags).toEqual([]);
    expect(tagSet.skillTags).toEqual([]);
  });

  test('equality by content', () => {
    const a = new TagSet({ roleTags: ['ic'], skillTags: ['react'] });
    const b = new TagSet({ roleTags: ['ic'], skillTags: ['react'] });
    expect(a.equals(b)).toBe(true);
  });

  test('isEmpty returns true for empty TagSet', () => {
    expect(TagSet.empty().isEmpty).toBe(true);
  });

  test('isEmpty returns false for non-empty TagSet', () => {
    const tagSet = new TagSet({ roleTags: ['ic'], skillTags: [] });
    expect(tagSet.isEmpty).toBe(false);
  });

  test('merges two TagSets with deduplication', () => {
    const a = new TagSet({ roleTags: ['ic', 'hands-on'], skillTags: ['typescript'] });
    const b = new TagSet({ roleTags: ['ic', 'architecture'], skillTags: ['react'] });
    const merged = a.merge(b);
    expect(merged.roleTags).toEqual(['architecture', 'hands-on', 'ic']);
    expect(merged.skillTags).toEqual(['react', 'typescript']);
  });
});
