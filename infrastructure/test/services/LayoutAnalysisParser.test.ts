import { describe, expect, it } from 'bun:test';
import type { ResumeContentDto } from '@tailoredin/application';
import { parseLayoutAnalysis } from '../../src/services/LayoutAnalysisParser.js';
import { BrilliantCvTemplate } from '../../src/templates/BrilliantCvTemplate.js';

const SIMPLE_CONTENT: ResumeContentDto = {
  personal: {
    first_name: 'Jane',
    last_name: 'Doe',
    github: 'janedoe',
    linkedin: 'janedoe',
    email: 'jane@example.com',
    phone: '555-0100',
    location: 'New York, NY',
    header_quote: 'Engineer'
  },
  keywords: [],
  experience: [
    {
      title: 'Senior Engineer',
      society: 'Acme Corp',
      date: 'Jan 2020 – Dec 2021',
      location: 'Remote',
      summary: 'Led platform team',
      highlights: ['Built API gateway', 'Reduced latency 40%']
    }
  ],
  skills: [{ type: 'Languages', info: 'TypeScript' }],
  education: [{ title: 'BS CS', society: 'MIT', date: '2016', location: 'Cambridge, MA' }]
};

const FAKE_POSITIONS = JSON.stringify([
  {
    'exp-0-company-start': { page: 1, y: 100.0 },
    'exp-0-company-end': { page: 1, y: 200.0 },
    'exp-0-role-0-title-start': { page: 1, y: 100.0 },
    'exp-0-role-0-title-end': { page: 1, y: 115.875 }, // ~2 body lines (7.875pt each)
    'exp-0-role-0-bullet-0-start': { page: 1, y: 120.0 },
    'exp-0-role-0-bullet-0-end': { page: 1, y: 127.875 }, // 1 body line (7.875pt = 10.5 * 0.75)
    'exp-0-role-0-bullet-1-start': { page: 1, y: 130.0 },
    'exp-0-role-0-bullet-1-end': { page: 1, y: 137.875 }, // 1 body line
    'skill-0-start': { page: 1, y: 210.0 },
    'skill-0-end': { page: 1, y: 217.875 },
    'edu-0-start': { page: 1, y: 230.0 },
    'edu-0-end': { page: 1, y: 237.875 }
  }
]);

describe('parseLayoutAnalysis', () => {
  it('returns totalPages from max page in positions', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.totalPages).toBe(1);
  });

  it('computes experience company block layout', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0].company.pageNumbers).toEqual([1]);
    expect(result.experiences[0].company.lineCount).toBeGreaterThan(0);
  });

  it('computes lineCount=1 for a single-line bullet (7.875pt = 10.5 * 0.75)', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].roles[0].bullets[0].lineCount).toBe(1);
  });

  it('maps bullets indexed 1:1 with highlights array', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].roles[0].bullets).toHaveLength(2);
  });

  it('maps skills indexed to non-interests entries', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].lineCount).toBe(1);
  });

  it('maps education indexed 1:1 with content.education', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.education).toHaveLength(1);
  });

  it('returns empty blockLayout for missing marker keys', () => {
    const emptyPositions = JSON.stringify([{}]);
    const result = parseLayoutAnalysis(emptyPositions, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].company.lineCount).toBe(0);
    expect(result.experiences[0].company.pageNumbers).toEqual([]);
  });

  it('reports totalPages=2 when markers span two pages', () => {
    const multiPage = JSON.stringify([
      {
        'exp-0-company-start': { page: 1, y: 700.0 },
        'exp-0-company-end': { page: 2, y: 50.0 },
        'exp-0-role-0-title-start': { page: 1, y: 700.0 },
        'exp-0-role-0-title-end': { page: 1, y: 715.0 },
        'exp-0-role-0-bullet-0-start': { page: 2, y: 10.0 },
        'exp-0-role-0-bullet-0-end': { page: 2, y: 18.0 },
        'exp-0-role-0-bullet-1-start': { page: 2, y: 20.0 },
        'exp-0-role-0-bullet-1-end': { page: 2, y: 28.0 }
      }
    ]);
    const result = parseLayoutAnalysis(multiPage, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.totalPages).toBe(2);
  });

  it('computes lineCount correctly for a block that spans two pages', () => {
    // US Letter height = 792pt, lineHeight = 10.5 * 0.75 = 7.875pt
    // block: page 1, y=700 → page 2, y=50
    // height = (2-1)*792 + (50-700) = 792 - 650 = 142pt
    // lineCount = ceil(142 / 7.875) = 19
    const fixture = JSON.stringify([
      {
        'exp-0-company-start': { page: 1, y: 700.0 },
        'exp-0-company-end': { page: 2, y: 50.0 },
        'exp-0-role-0-title-start': { page: 1, y: 700.0 },
        'exp-0-role-0-title-end': { page: 1, y: 715.0 },
        'exp-0-role-0-bullet-0-start': { page: 2, y: 10.0 },
        'exp-0-role-0-bullet-0-end': { page: 2, y: 18.0 },
        'exp-0-role-0-bullet-1-start': { page: 2, y: 20.0 },
        'exp-0-role-0-bullet-1-end': { page: 2, y: 28.0 }
      }
    ]);
    const result = parseLayoutAnalysis(fixture, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].company.lineCount).toBe(19);
    expect(result.experiences[0].company.pageNumbers).toEqual([1, 2]);
  });
});
