import { describe, expect, test } from 'bun:test';
import { Headline } from '../../src/entities/Headline.js';

describe('Headline', () => {
  test('creates headline with label and summary', () => {
    const headline = Headline.create({
      profileId: 'profile-1',
      label: 'Senior Engineer',
      summaryText: 'Building scalable systems.'
    });

    expect(headline.profileId).toBe('profile-1');
    expect(headline.label).toBe('Senior Engineer');
    expect(headline.summaryText).toBe('Building scalable systems.');
    expect(headline.id).toBeDefined();
    expect(headline.createdAt).toBeInstanceOf(Date);
    expect(headline.updatedAt).toBeInstanceOf(Date);
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
    expect(headline.profileId).toBe('profile-3');
  });
});
