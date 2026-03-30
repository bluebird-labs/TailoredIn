import { describe, expect, test } from 'bun:test';
import { ResumeHeadline } from '../../src/entities/ResumeHeadline.js';
import { ResumeHeadlineId } from '../../src/value-objects/ResumeHeadlineId.js';

describe('ResumeHeadline', () => {
  const createProps = {
    userId: 'user-1',
    headlineLabel: 'IC / Lead IC headline',
    summaryText: 'Experienced software engineer with a decade of experience.'
  };

  test('create generates id and timestamps', () => {
    const headline = ResumeHeadline.create(createProps);

    expect(headline.id).toBeInstanceOf(ResumeHeadlineId);
    expect(headline.userId).toBe('user-1');
    expect(headline.headlineLabel).toBe('IC / Lead IC headline');
    expect(headline.summaryText).toBe('Experienced software engineer with a decade of experience.');
    expect(headline.createdAt).toBeInstanceOf(Date);
  });

  test('constructor reconstitutes from full props', () => {
    const id = new ResumeHeadlineId('fixed-id');
    const now = new Date('2025-01-01');
    const headline = new ResumeHeadline({ id, ...createProps, createdAt: now, updatedAt: now });

    expect(headline.id.value).toBe('fixed-id');
    expect(headline.headlineLabel).toBe('IC / Lead IC headline');
  });
});
