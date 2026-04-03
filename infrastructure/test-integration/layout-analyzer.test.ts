import { beforeEach, describe, expect, it } from 'bun:test';
import type { ResumeContentDto } from '@tailoredin/application';
import { TypstTemplateLayoutAnalyzer } from '../src/services/TypstTemplateLayoutAnalyzer.js';
import { BrilliantCvTemplate } from '../src/templates/BrilliantCvTemplate.js';

const ONE_LINER_CONTENT: ResumeContentDto = {
  personal: {
    first_name: 'Jane',
    last_name: 'Doe',
    github: 'janedoe',
    linkedin: 'janedoe',
    email: 'jane@example.com',
    phone: '555-0100',
    location: 'NYC',
    header_quote: 'Engineer'
  },
  keywords: [],
  experience: [
    {
      title: 'Senior Engineer',
      society: 'Acme Corp',
      date: 'Jan 2020 – Dec 2021',
      location: 'Remote',
      summary: '',
      highlights: ['Built API gateway.']
    }
  ],
  skills: [{ type: 'Languages', info: 'TypeScript' }],
  education: [{ title: 'BS CS', society: 'MIT', date: '2016', location: 'Cambridge, MA' }]
};

const LONG_BULLET_CONTENT: ResumeContentDto = {
  ...ONE_LINER_CONTENT,
  experience: [
    {
      title: 'Senior Engineer',
      society: 'Acme Corp',
      date: 'Jan 2020 – Dec 2021',
      location: 'Remote',
      summary: '',
      highlights: [
        'Architected and delivered a horizontally scalable distributed event-streaming platform ' +
          'that reduced end-to-end processing latency by 40% while cutting infrastructure costs by 30% annually.'
      ]
    }
  ]
};

describe('TypstTemplateLayoutAnalyzer integration', () => {
  let analyzer: TypstTemplateLayoutAnalyzer;

  beforeEach(() => {
    analyzer = new TypstTemplateLayoutAnalyzer();
  });

  it('returns totalPages=1 for a minimal resume', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    expect(result.totalPages).toBe(1);
  }, 60_000);

  it('returns lineCount>0 for a short single-line bullet', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    expect(result.experiences[0].roles[0].bullets[0].lineCount).toBeGreaterThan(0);
  }, 60_000);

  it('returns lineCount>1 for a known-long bullet that wraps', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, LONG_BULLET_CONTENT);
    expect(result.experiences[0].roles[0].bullets[0].lineCount).toBeGreaterThan(1);
  }, 60_000);

  it('short bullet renders fewer lines than long wrapping bullet', async () => {
    const r1 = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    const r2 = await analyzer.analyze(BrilliantCvTemplate, LONG_BULLET_CONTENT);
    expect(r1.experiences[0].roles[0].bullets[0].lineCount).toBeLessThan(
      r2.experiences[0].roles[0].bullets[0].lineCount
    );
  }, 60_000);

  it('reports pageNumbers=[1] for all blocks in a single-page resume', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    for (const exp of result.experiences) {
      expect(exp.company.pageNumbers).toEqual([1]);
    }
  }, 60_000);

  it('caches: calling analyze twice with the same input returns the same promise', async () => {
    const r1 = analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    const r2 = analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    expect(r1).toBe(r2); // same Promise reference — only one typst process spawned
  }, 60_000);

  it('returns different results for different content', async () => {
    const r1 = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    const r2 = await analyzer.analyze(BrilliantCvTemplate, LONG_BULLET_CONTENT);
    expect(r1).not.toBe(r2);
    expect(r1.experiences[0].roles[0].bullets[0].lineCount).not.toBe(r2.experiences[0].roles[0].bullets[0].lineCount);
  }, 60_000);
});
