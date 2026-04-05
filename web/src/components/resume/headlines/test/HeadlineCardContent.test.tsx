import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { HeadlineCardContent } from '../HeadlineCardContent.js';

afterEach(() => {
  cleanup();
});

describe('HeadlineCardContent', () => {
  test('renders label and summary text', () => {
    render(
      <HeadlineCardContent
        headline={{ id: '1', label: 'Software Engineer', summaryText: 'Building great products.' }}
      />
    );

    expect(screen.getByText('Software Engineer')).toBeDefined();
    expect(screen.getByText('Building great products.')).toBeDefined();
  });

  test('does not render summary paragraph when summaryText is empty', () => {
    const { container } = render(
      <HeadlineCardContent headline={{ id: '2', label: 'Product Manager', summaryText: '' }} />
    );

    expect(screen.getByText('Product Manager')).toBeDefined();
    // Only 1 <p> element (the label) — no summary paragraph rendered
    expect(container.querySelectorAll('p').length).toBe(1);
  });

  test('renders with data-slot attribute', () => {
    const { container } = render(
      <HeadlineCardContent headline={{ id: '3', label: 'Designer', summaryText: 'Creating experiences.' }} />
    );

    const slot = container.querySelector('[data-slot="headline-card-content"]');
    expect(slot).not.toBeNull();
  });
});
