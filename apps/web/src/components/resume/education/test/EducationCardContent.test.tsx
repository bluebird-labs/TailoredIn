import { cleanup, render, screen } from '@testing-library/react';
import type { Education } from '@/hooks/use-educations';
import { EducationCardContent } from '../EducationCardContent.js';

const fullEducation: Education = {
  id: '1',
  degreeTitle: 'B.S. Computer Science',
  institutionName: 'Stanford University',
  graduationYear: 2018,
  location: 'Stanford, CA',
  honors: 'Magna Cum Laude',
  ordinal: 0,
  hiddenByDefault: false
};

const minimalEducation: Education = {
  id: '2',
  degreeTitle: 'M.S. Data Science',
  institutionName: 'MIT',
  graduationYear: 2020,
  location: null,
  honors: null,
  ordinal: 1,
  hiddenByDefault: false
};

afterEach(() => {
  cleanup();
});

describe('EducationCardContent', () => {
  test('renders all fields when provided', () => {
    render(<EducationCardContent education={fullEducation} />);

    expect(screen.getByText('B.S. Computer Science')).toBeDefined();
    expect(screen.getByText(/Stanford University/)).toBeDefined();
    expect(screen.getByText(/2018/)).toBeDefined();
    expect(screen.getByText(/Stanford, CA/)).toBeDefined();
    expect(screen.getByText('Magna Cum Laude')).toBeDefined();
  });

  test('does not render location span when location is null', () => {
    render(<EducationCardContent education={minimalEducation} />);

    expect(screen.queryByText(/MIT/)).toBeDefined();
    expect(screen.queryByText(/null/)).toBeNull();
    // No location text present
    expect(screen.queryByText('MIT · 2020 · undefined')).toBeNull();
  });

  test('does not render honors paragraph when honors is null', () => {
    const { container } = render(<EducationCardContent education={minimalEducation} />);

    // Only 2 <p> elements: degreeTitle and institution/year line
    expect(container.querySelectorAll('p').length).toBe(2);
  });

  test('renders with data-slot attribute', () => {
    const { container } = render(<EducationCardContent education={fullEducation} />);

    const slot = container.querySelector('[data-slot="education-card-content"]');
    expect(slot).not.toBeNull();
  });

  test('renders all 3 paragraphs when honors is set', () => {
    const { container } = render(<EducationCardContent education={fullEducation} />);

    expect(container.querySelectorAll('p').length).toBe(3);
  });
});
