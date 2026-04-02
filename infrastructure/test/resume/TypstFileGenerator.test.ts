import { describe, expect, it } from 'bun:test';
import FS from 'node:fs/promises';
import OS from 'node:os';
import Path from 'node:path';
import type { BrilliantCVContent } from '../../src/brilliant-cv/types.js';
import { TypstFileGenerator } from '../../src/resume/TypstFileGenerator.js';

const MINIMAL_CONTENT: BrilliantCVContent = {
  personal: {
    first_name: 'Jane',
    last_name: 'Doe',
    github: 'janedoe',
    linkedin: 'janedoe',
    email: 'jane@example.com',
    phone: '555-0100',
    location: 'New York, NY',
    header_quote: 'Software Engineer'
  },
  keywords: ['TypeScript', 'React'],
  experience: [
    {
      title: 'Senior Engineer',
      society: 'Acme Corp',
      date: '2020 — Present',
      location: 'Remote',
      summary: 'Led platform team',
      highlights: [
        'Built API gateway',
        'Reduced latency 40%',
        'Migrated to k8s',
        'Mentored 3 engineers',
        'Wrote RFCs',
        'Shipped v2'
      ]
    }
  ],
  skills: [{ type: 'Languages', info: 'TypeScript #h-bar() Go' }],
  education: [{ title: 'BS Computer Science', society: 'MIT', date: '2016', location: 'Cambridge, MA' }]
};

async function generateInTmpDir(content: BrilliantCVContent) {
  const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-gen-'));
  await TypstFileGenerator.generate(content, tmpDir);
  return {
    metadata: await FS.readFile(Path.join(tmpDir, 'metadata.toml'), 'utf8'),
    cv: await FS.readFile(Path.join(tmpDir, 'cv.typ'), 'utf8'),
    professional: await FS.readFile(Path.join(tmpDir, 'modules_en', 'professional.typ'), 'utf8'),
    skills: await FS.readFile(Path.join(tmpDir, 'modules_en', 'skills.typ'), 'utf8'),
    education: await FS.readFile(Path.join(tmpDir, 'modules_en', 'education.typ'), 'utf8'),
    cleanup: () => FS.rm(tmpDir, { recursive: true })
  };
}

describe('TypstFileGenerator', () => {
  it('injects hardcoded ARCHITECT spacing values into metadata.toml', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.metadata).toContain('before_section_skip = "4pt"');
    expect(files.metadata).toContain('before_entry_skip = "3pt"');
    expect(files.metadata).toContain('before_entry_description_skip = "2pt"');
    await files.cleanup();
  });

  it('hardcodes awesome_color to #333333 in metadata.toml', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.metadata).toContain('awesome_color = "#333333"');
    await files.cleanup();
  });

  it('sets ARCHITECT font size and spacing in cv.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.cv).toContain('#set text(size: 10.5pt)');
    expect(files.cv).toContain('#set par(leading: 0.75em)');
    expect(files.cv).toContain('#set page(margin: 1.5cm)');
    await files.cleanup();
  });

  it('orders sections as professional, skills, education', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    const profIdx = files.cv.indexOf('modules_en/professional.typ');
    const skillsIdx = files.cv.indexOf('modules_en/skills.typ');
    const eduIdx = files.cv.indexOf('modules_en/education.typ');
    expect(profIdx).toBeLessThan(skillsIdx);
    expect(skillsIdx).toBeLessThan(eduIdx);
    await files.cleanup();
  });

  it('includes summary line in professional.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.professional).toContain('_Led platform team_');
    await files.cleanup();
  });

  it('renders all highlights without truncation', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.professional).toContain('Built API gateway');
    expect(files.professional).toContain('Wrote RFCs');
    expect(files.professional).toContain('Shipped v2');
    await files.cleanup();
  });
});
