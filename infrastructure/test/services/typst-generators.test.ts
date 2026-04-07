import { describe, expect, test } from 'bun:test';
import type { ResumeRenderEducation, ResumeRenderExperience } from '@tailoredin/application';
import type { ResumeTemplate } from '@tailoredin/domain';
import {
  analyzeLayout,
  generateConfigTyp,
  generateEducationTyp,
  generateProfessionalTyp
} from '../../src/services/typst-generators.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEMPLATE: ResumeTemplate = {
  id: 'test',
  pageSize: 'us-letter',
  margins: { top: 1.1, bottom: 1.1, left: 1.1, right: 1.1 },
  bodyFontSizePt: 10,
  lineHeightEm: 0.65,
  headerFontSizePt: 32,
  sectionSpacingPt: 2,
  entrySpacingPt: 2
};

function fakePdf(pageCount: number): Uint8Array {
  const lines = ['%PDF-1.4'];
  // /Type /Pages — should NOT be counted as a page
  lines.push(`1 0 obj << /Type /Pages /Count ${pageCount} >> endobj`);
  // /Type /Page — one per page
  for (let i = 0; i < pageCount; i++) {
    lines.push(`${i + 2} 0 obj << /Type /Page >> endobj`);
  }
  return new TextEncoder().encode(lines.join('\n'));
}

function makeExperience(overrides: Partial<ResumeRenderExperience> = {}): ResumeRenderExperience {
  return {
    title: 'Software Engineer',
    companyName: 'Acme Corp',
    companyAccent: null,
    location: 'New York, NY',
    startDate: '2022-01-01',
    endDate: null,
    summary: null,
    bullets: ['Built things', 'Shipped features'],
    ...overrides
  };
}

function makeEducation(overrides: Partial<ResumeRenderEducation> = {}): ResumeRenderEducation {
  return {
    degreeTitle: 'BSc Computer Science',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: null,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// generateConfigTyp
// ---------------------------------------------------------------------------

describe('generateConfigTyp', () => {
  test('renders font size, leading, and margin from template', () => {
    const result = generateConfigTyp(TEMPLATE);
    expect(result).toContain('cfg-body-font-size = 10pt');
    expect(result).toContain('cfg-leading = 0.65em');
    expect(result).toContain('cfg-margin');
    expect(result).toContain('1.1cm');
    expect(result).toContain('cfg-header-font-size = 32pt');
  });

  test('uses a4 page size when specified', () => {
    const result = generateConfigTyp({ ...TEMPLATE, pageSize: 'a4' });
    // Config does not encode page size (set in metadata.toml), so just verify it compiles
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// generateProfessionalTyp
// ---------------------------------------------------------------------------

describe('generateProfessionalTyp', () => {
  test('renders cv-entry for each experience', () => {
    const result = generateProfessionalTyp([makeExperience()]);
    expect(result).toContain('#cv-entry');
  });

  test('includes all bullet text', () => {
    const result = generateProfessionalTyp([makeExperience({ bullets: ['First bullet', 'Second bullet'] })]);
    expect(result).toContain('First bullet');
    expect(result).toContain('Second bullet');
  });

  test('renders summary as italic when present', () => {
    const result = generateProfessionalTyp([makeExperience({ summary: 'Led the team' })]);
    expect(result).toContain('_Led the team_');
  });

  test('returns import-only string when experiences array is empty', () => {
    const result = generateProfessionalTyp([]);
    expect(result).toContain('#import');
    expect(result).not.toContain('cv-section');
  });

  test('includes experiences with no bullets without list block', () => {
    const result = generateProfessionalTyp([makeExperience({ bullets: [] })]);
    expect(result).toContain('cv-entry');
    expect(result).not.toContain('#list');
  });

  test('renders company accent with styled Typst markup', () => {
    const result = generateProfessionalTyp([makeExperience({ companyAccent: 'acquired by Volvo Cars' })]);
    expect(result).toContain('Acme Corp #h(4pt)');
    expect(result).toContain('· acquired by Volvo Cars');
    expect(result).toContain('weight: "regular"');
    expect(result).toContain('style: "italic"');
  });

  test('renders plain company name when accent is null', () => {
    const result = generateProfessionalTyp([makeExperience({ companyAccent: null })]);
    expect(result).toContain('society: [Acme Corp]');
    expect(result).not.toContain('#h(4pt)');
  });
});

// ---------------------------------------------------------------------------
// generateEducationTyp
// ---------------------------------------------------------------------------

describe('generateEducationTyp', () => {
  test('renders cv-entry for each education', () => {
    const result = generateEducationTyp([makeEducation()]);
    expect(result).toContain('#cv-entry');
  });

  test('renders honors as italic description when present', () => {
    const result = generateEducationTyp([makeEducation({ honors: 'Magna Cum Laude' })]);
    expect(result).toContain('_Magna Cum Laude_');
  });

  test('renders empty description when honors is null', () => {
    const result = generateEducationTyp([makeEducation({ honors: null })]);
    // Should not contain any italic content in description
    expect(result).not.toContain('_');
  });

  test('returns import-only string when educations array is empty', () => {
    const result = generateEducationTyp([]);
    expect(result).toContain('#import');
    expect(result).not.toContain('cv-section');
  });
});

// ---------------------------------------------------------------------------
// analyzeLayout
// ---------------------------------------------------------------------------

describe('analyzeLayout', () => {
  test('counts 1 page correctly', () => {
    const { totalPages } = analyzeLayout(fakePdf(1));
    expect(totalPages).toBe(1);
  });

  test('counts 2 pages correctly', () => {
    const { totalPages } = analyzeLayout(fakePdf(2));
    expect(totalPages).toBe(2);
  });

  test('counts 3 pages correctly', () => {
    const { totalPages } = analyzeLayout(fakePdf(3));
    expect(totalPages).toBe(3);
  });

  test('/Type /Pages node is not counted as a page', () => {
    // fakePdf always includes one /Type /Pages node — verify it's excluded
    const { totalPages } = analyzeLayout(fakePdf(2));
    expect(totalPages).toBe(2); // not 3
  });
});
