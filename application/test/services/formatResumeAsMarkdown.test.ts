import { describe, expect, it } from 'bun:test';
import type { ResumeContentDto } from '../../src/dtos/ResumeContentDto.js';
import { formatResumeAsMarkdown } from '../../src/services/formatResumeAsMarkdown.js';

const content: ResumeContentDto = {
  personal: {
    first_name: 'Jane',
    last_name: 'Doe',
    github: 'janedoe',
    linkedin: 'janedoe',
    email: 'jane@example.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    header_quote: 'Full-Stack Engineer'
  },
  keywords: ['TypeScript', 'React'],
  experience: [
    {
      title: 'Senior Engineer',
      society: 'Acme Corp',
      date: 'Jan 2023 – Present',
      location: 'Remote',
      summary: 'Led platform team.',
      highlights: ['Built the API gateway.', 'Reduced latency by 40%.']
    },
    {
      title: 'Engineer',
      society: 'StartupCo',
      date: 'Mar 2020 – Dec 2022',
      location: 'NYC',
      summary: '',
      highlights: ['Shipped v2 launch.']
    }
  ],
  skills: [
    { type: 'Languages', info: 'TypeScript, Python, Go' },
    { type: 'Frameworks', info: 'React, Node.js' }
  ],
  education: [
    {
      title: 'B.S. Computer Science',
      society: 'UC Berkeley',
      date: '2016 – 2020',
      location: 'Berkeley, CA'
    }
  ]
};

describe('formatResumeAsMarkdown', () => {
  const md = formatResumeAsMarkdown(content);

  it('starts with the full name as H1', () => {
    expect(md).toStartWith('# Jane Doe\n');
  });

  it('includes the header quote as a blockquote', () => {
    expect(md).toContain('> Full-Stack Engineer');
  });

  it('includes contact info line with middle-dot separators', () => {
    expect(md).toContain('San Francisco, CA');
    expect(md).toContain('jane@example.com');
    expect(md).toContain('(555) 123-4567');
    expect(md).toContain('[GitHub](https://github.com/janedoe)');
    expect(md).toContain('[LinkedIn](https://linkedin.com/in/janedoe)');
    expect(md).toContain(' · ');
  });

  it('includes experience section with titles and companies', () => {
    expect(md).toContain('## Experience');
    expect(md).toContain('### Senior Engineer — Acme Corp');
    expect(md).toContain('*Jan 2023 – Present · Remote*');
    expect(md).toContain('Led platform team.');
    expect(md).toContain('- Built the API gateway.');
    expect(md).toContain('- Reduced latency by 40%.');
  });

  it('omits empty summaries', () => {
    const engineerSection = md.split('### Engineer — StartupCo')[1]!.split('---')[0]!;
    const lines = engineerSection
      .split('\n')
      .filter(l => l.trim() !== '' && !l.startsWith('*') && !l.startsWith('-'));
    expect(lines).toHaveLength(0);
  });

  it('includes skills section with bold category names', () => {
    expect(md).toContain('## Skills');
    expect(md).toContain('**Languages:** TypeScript, Python, Go');
    expect(md).toContain('**Frameworks:** React, Node.js');
  });

  it('includes education section', () => {
    expect(md).toContain('## Education');
    expect(md).toContain('### B.S. Computer Science — UC Berkeley');
    expect(md).toContain('*2016 – 2020 · Berkeley, CA*');
  });

  it('separates major sections with horizontal rules', () => {
    expect(md).toContain('---\n\n## Experience');
    expect(md).toContain('---\n\n## Skills');
    expect(md).toContain('---\n\n## Education');
  });

  it('omits sections with no entries', () => {
    const empty: ResumeContentDto = {
      personal: content.personal,
      keywords: [],
      experience: [],
      skills: [],
      education: []
    };
    const result = formatResumeAsMarkdown(empty);
    expect(result).not.toContain('## Experience');
    expect(result).not.toContain('## Skills');
    expect(result).not.toContain('## Education');
  });
});
