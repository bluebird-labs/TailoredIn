import { describe, expect, test } from 'bun:test';
import { Bullet } from '../../src/entities/Bullet.js';
import { ApprovalStatus } from '../../src/value-objects/ApprovalStatus.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('Bullet', () => {
  test('creates with canonical text and empty tags', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    expect(bullet.content).toBe('Built a thing');
    expect(bullet.tags.isEmpty).toBe(true);
    expect(bullet.variants).toEqual([]);
  });

  test('adds a variant', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const variant = bullet.addVariant({
      text: 'Led team building a thing',
      angle: 'leadership',
      tags: new TagSet({ roleTags: ['leadership'], skillTags: [] }),
      source: 'llm'
    });
    expect(bullet.variants).toHaveLength(1);
    expect(variant.text).toBe('Led team building a thing');
    expect(variant.approvalStatus).toBe(ApprovalStatus.PENDING);
  });

  test('removes a variant', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const variant = bullet.addVariant({
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'llm'
    });
    bullet.removeVariant(variant.id.value);
    expect(bullet.variants).toHaveLength(0);
  });

  test('throws when removing non-existent variant', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    expect(() => bullet.removeVariant('nonexistent')).toThrow('Variant not found');
  });

  test('finds variant or fails', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const variant = bullet.addVariant({
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    const found = bullet.findVariantOrFail(variant.id.value);
    expect(found.id.equals(variant.id)).toBe(true);
  });

  test('approvedVariants filters correctly', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const v1 = bullet.addVariant({ text: 'a', angle: 'ic', tags: TagSet.empty(), source: 'llm' });
    bullet.addVariant({ text: 'b', angle: 'lead', tags: TagSet.empty(), source: 'llm' });
    v1.approve();
    expect(bullet.approvedVariants).toHaveLength(1);
    expect(bullet.approvedVariants[0].text).toBe('a');
  });

  test('updates tags', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const tags = new TagSet({ roleTags: ['ic'], skillTags: ['typescript'] });
    bullet.updateTags(tags);
    expect(bullet.tags.roleTags).toEqual(['ic']);
  });
});
