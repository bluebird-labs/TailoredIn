import { describe, expect, test } from 'bun:test';
import { Headline } from '../../src/entities/Headline.js';
import { Tag, TagDimension } from '../../src/entities/Tag.js';

describe('Headline', () => {
  test('creates headline with label and summary, no tags', () => {
    const headline = Headline.create({
      profileId: 'profile-1',
      label: 'Senior Engineer',
      summaryText: 'Building scalable systems.'
    });

    expect(headline.profileId).toBe('profile-1');
    expect(headline.label).toBe('Senior Engineer');
    expect(headline.summaryText).toBe('Building scalable systems.');
    expect(headline.roleTags).toEqual([]);
    expect(headline.id).toBeDefined();
    expect(headline.createdAt).toBeInstanceOf(Date);
    expect(headline.updatedAt).toBeInstanceOf(Date);
  });

  test('creates headline with role tags', () => {
    const tag = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const headline = Headline.create({
      profileId: 'profile-2',
      label: 'Tech Lead',
      summaryText: 'Leading engineering teams.',
      roleTags: [tag]
    });

    expect(headline.roleTags).toHaveLength(1);
    expect(headline.roleTags[0].name).toBe('leadership');
  });

  test('updates mutable fields', () => {
    const headline = Headline.create({
      profileId: 'profile-3',
      label: 'Engineer',
      summaryText: 'Original summary.'
    });

    const newUpdatedAt = new Date();
    headline.label = 'Staff Engineer';
    headline.summaryText = 'Updated summary.';
    headline.updatedAt = newUpdatedAt;

    expect(headline.label).toBe('Staff Engineer');
    expect(headline.summaryText).toBe('Updated summary.');
    expect(headline.updatedAt).toBe(newUpdatedAt);
    expect(headline.profileId).toBe('profile-3'); // readonly unchanged
  });

  test('replaces role tags', () => {
    const tag1 = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    const headline = Headline.create({
      profileId: 'profile-4',
      label: 'Director',
      summaryText: 'Leading teams.',
      roleTags: [tag1]
    });

    const tag2 = Tag.create({ name: 'strategy', dimension: TagDimension.ROLE });
    headline.roleTags = [tag2];

    expect(headline.roleTags).toHaveLength(1);
    expect(headline.roleTags[0].name).toBe('strategy');
  });
});
