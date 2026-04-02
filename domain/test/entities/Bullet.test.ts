import { describe, expect, test } from 'bun:test';
import { Bullet } from '../../src/entities/Bullet.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('Bullet', () => {
  test('creates with canonical text and empty tags', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    expect(bullet.content).toBe('Built a thing');
    expect(bullet.tags.isEmpty).toBe(true);
  });

  test('updates tags', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const tags = new TagSet({ roleTags: ['ic'], skillTags: ['typescript'] });
    bullet.updateTags(tags);
    expect(bullet.tags.roleTags).toEqual(['ic']);
  });
});
