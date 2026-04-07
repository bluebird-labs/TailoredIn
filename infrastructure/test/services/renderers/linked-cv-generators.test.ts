// infrastructure/test/services/renderers/linked-cv-generators.test.ts
import { describe, expect, test } from 'bun:test';
import type { ResumeRenderExperience, ResumeRenderInput } from '@tailoredin/application';
import { DEFAULT_RESUME_TEMPLATE } from '@tailoredin/domain';
import {
  formatLinkedCvDate,
  generateLinkedCvTyp,
  groupExperiencesByCompany
} from '../../../src/services/renderers/linked-cv-generators.js';

function makeExp(overrides: Partial<ResumeRenderExperience> = {}): ResumeRenderExperience {
  return {
    title: 'Staff Engineer',
    companyName: 'Acme Corp',
    companyAccent: null,
    location: 'New York, NY',
    startDate: '2022-01-15',
    endDate: null,
    summary: null,
    bullets: ['Built systems'],
    ...overrides
  };
}

function makeInput(exps: ResumeRenderExperience[] = [makeExp()]): ResumeRenderInput {
  return {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
      location: 'New York, NY',
      linkedin: 'johndoe',
      github: null,
      website: null
    },
    headlineSummary: 'Platform engineer',
    experiences: exps,
    educations: [
      {
        degreeTitle: 'BSc CS',
        institutionName: 'MIT',
        graduationYear: 2020,
        location: 'Cambridge, MA',
        honors: null
      }
    ],
    template: DEFAULT_RESUME_TEMPLATE
  };
}

describe('formatLinkedCvDate', () => {
  test('formats YYYY-MM-DD as MM-YYYY', () => {
    expect(formatLinkedCvDate('2022-01-15')).toBe('01-2022');
  });

  test('formats YYYY-MM as MM-YYYY', () => {
    expect(formatLinkedCvDate('2022-01')).toBe('01-2022');
  });

  test('zero-pads single-digit months', () => {
    expect(formatLinkedCvDate('2022-03')).toBe('03-2022');
  });
});

describe('groupExperiencesByCompany', () => {
  test('groups two roles at same company into one entry', () => {
    const exps = [
      makeExp({ title: 'Staff Engineer', companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ title: 'Senior Engineer', companyName: 'Acme', startDate: '2021-01', endDate: '2022-12' })
    ];
    const groups = groupExperiencesByCompany(exps);
    expect(groups).toHaveLength(1);
    expect(groups[0].companyName).toBe('Acme');
    expect(groups[0].roles).toHaveLength(2);
  });

  test('keeps different companies as separate groups, preserving input order', () => {
    const exps = [
      makeExp({ companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ companyName: 'Beta', startDate: '2021-01' })
    ];
    const groups = groupExperiencesByCompany(exps);
    expect(groups).toHaveLength(2);
    expect(groups[0].companyName).toBe('Acme');
    expect(groups[1].companyName).toBe('Beta');
  });

  test('skips experiences with no bullets', () => {
    const exps = [makeExp({ bullets: [] })];
    const groups = groupExperiencesByCompany(exps);
    expect(groups).toHaveLength(0);
  });

  test('sets overallStart to the earliest role start date', () => {
    const exps = [
      makeExp({ title: 'Staff Engineer', companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ title: 'Senior Engineer', companyName: 'Acme', startDate: '2021-01', endDate: '2022-12' })
    ];
    const groups = groupExperiencesByCompany(exps);
    expect(groups[0].overallStart).toBe('01-2021');
  });
});

describe('generateLinkedCvTyp', () => {
  test('imports linked-cv package', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('@preview/linked-cv');
  });

  test('includes name', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('John');
    expect(typ).toContain('Doe');
  });

  test('includes employer name', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('Acme Corp');
  });

  test('uses MM-YYYY format for dates', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('"01-2022"');
  });

  test('uses "current" for ongoing roles', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('"current"');
  });

  test('includes bullet text', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('Built systems');
  });

  test('groups multiple roles at same company into one connected-frames block', () => {
    const exps = [
      makeExp({ title: 'Staff Engineer', companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ title: 'Senior Engineer', companyName: 'Acme', startDate: '2021-01', endDate: '2022-12' })
    ];
    const typ = generateLinkedCvTyp(makeInput(exps));
    // Acme group + MIT education = 2 employer-info blocks total; grouping is proved because there are
    // 2 roles at Acme but still only 1 Acme employer-info
    const employerInfoCount = (typ.match(/employer-info/g) ?? []).length;
    expect(employerInfoCount).toBe(2);
    // Both titles appear
    expect(typ).toContain('Staff Engineer');
    expect(typ).toContain('Senior Engineer');
  });
});
