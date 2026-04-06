import { describe, expect, test } from 'bun:test';
import type { ResumeRenderInput } from '@tailoredin/application';
import { DEFAULT_RESUME_TEMPLATE } from '@tailoredin/domain';
import {
  escapeYamlString,
  generateImprecvTemplateTyp,
  generateImprecvYaml
} from '../../../src/services/renderers/imprecv-generators.js';

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
    headlineSummary: 'Staff Engineer focused on platform',
    experiences: [
      {
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        location: 'New York, NY',
        startDate: '2022-01-15',
        endDate: null,
        summary: 'Led platform team',
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

describe('escapeYamlString', () => {
  test('escapes double quotes', () => {
    expect(escapeYamlString('say "hello"')).toBe('say \\"hello\\"');
  });

  test('escapes backslashes', () => {
    expect(escapeYamlString('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  test('leaves normal text unchanged', () => {
    expect(escapeYamlString('normal text')).toBe('normal text');
  });
});

describe('generateImprecvYaml', () => {
  test('includes personal name fields', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('first: "John"');
    expect(yaml).toContain('last: "Doe"');
  });

  test('includes email and phone', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('john@example.com');
    expect(yaml).toContain('+1-555-0100');
  });

  test('includes LinkedIn profile', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('linkedin.com/in/johndoe');
  });

  test('omits GitHub profile when null', () => {
    const yaml = generateImprecvYaml(makeInput({ personal: { ...makeInput().personal, github: null } }));
    expect(yaml).not.toContain('github.com');
  });

  test('includes work organization and position', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('organization: "Acme Corp"');
    expect(yaml).toContain('position: "Staff Engineer"');
  });

  test('formats startDate as ISO 8601', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('startDate: "2022-01-15"');
  });

  test('uses "present" for current role', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('endDate: "present"');
  });

  test('includes bullet highlights', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('Built distributed systems');
    expect(yaml).toContain('Reduced latency by 40%');
  });

  test('skips experiences with no bullets', () => {
    const input = makeInput();
    input.experiences[0].bullets = [];
    const yaml = generateImprecvYaml(input);
    expect(yaml).not.toContain('position: "Staff Engineer"');
  });

  test('includes education institution', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('institution: "MIT"');
  });

  test('includes graduation year as endDate year', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('"2020-');
  });

  test('includes headline summary', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('Staff Engineer focused on platform');
  });
});

describe('generateImprecvTemplateTyp', () => {
  test('imports imprecv package', () => {
    const typ = generateImprecvTemplateTyp();
    expect(typ).toContain('@preview/imprecv');
  });

  test('references cv.yaml data file', () => {
    const typ = generateImprecvTemplateTyp();
    expect(typ).toContain('cv.yaml');
  });
});
