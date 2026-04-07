// infrastructure/test/services/renderers/modern-cv-generators.test.ts
import { describe, expect, test } from 'bun:test';
import type { ResumeRenderInput } from '@tailoredin/application';
import { DEFAULT_RESUME_TEMPLATE } from '@tailoredin/domain';
import { generateModernCvTyp } from '../../../src/services/renderers/modern-cv-generators.js';

function makeInput(overrides: Partial<ResumeRenderInput> = {}): ResumeRenderInput {
  return {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0100',
      location: 'New York, NY',
      linkedin: 'johndoe',
      github: 'johndoe',
      website: null
    },
    headlineSummary: 'Staff Engineer',
    experiences: [
      {
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        companyAccent: null,
        location: 'New York, NY',
        startDate: '2022-01-15',
        endDate: null,
        summary: null,
        bullets: ['Built distributed systems', 'Reduced latency by 40%']
      }
    ],
    educations: [
      {
        degreeTitle: 'BSc Computer Science',
        institutionName: 'MIT',
        graduationYear: 2020,
        location: 'Cambridge, MA',
        honors: null
      }
    ],
    template: DEFAULT_RESUME_TEMPLATE,
    ...overrides
  };
}

describe('generateModernCvTyp', () => {
  test('imports modern-cv package', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('@preview/modern-cv');
  });

  test('includes author firstname and lastname', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('firstname: "John"');
    expect(typ).toContain('lastname: "Doe"');
  });

  test('includes email', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('john@example.com');
  });

  test('includes linkedin slug', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('johndoe');
  });

  test('includes experience entry with company and title', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('Acme Corp');
    expect(typ).toContain('Staff Engineer');
  });

  test('includes bullet as list item', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('- Built distributed systems');
    expect(typ).toContain('- Reduced latency by 40%');
  });

  test('includes experiences with no bullets without resume-item block', () => {
    const input = makeInput();
    input.experiences[0].bullets = [];
    const typ = generateModernCvTyp(input);
    expect(typ).toContain('Acme Corp');
    expect(typ).not.toContain('#resume-item');
  });

  test('formats date range correctly', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('Jan 2022');
    expect(typ).toContain('Present');
  });

  test('includes education section', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('MIT');
    expect(typ).toContain('BSc Computer Science');
    expect(typ).toContain('2020');
  });

  test('escapes Typst special characters in bullet text', () => {
    const input = makeInput();
    input.experiences[0].bullets = ['Used #hash and [brackets]'];
    const typ = generateModernCvTyp(input);
    expect(typ).toContain('\\#hash');
    expect(typ).toContain('\\[brackets\\]');
  });
});
