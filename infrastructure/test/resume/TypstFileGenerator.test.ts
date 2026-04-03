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
    helpers: await FS.readFile(Path.join(tmpDir, 'helpers.typ'), 'utf8'),
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

  it('sets awesome_color to #3E6B8A (Corporate Polished steel blue) in metadata.toml', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.metadata).toContain('awesome_color = "#3E6B8A"');
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

describe('helpers.typ', () => {
  it('generates helpers.typ alongside cv.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.helpers).toContain('#3E6B8A');
    await files.cleanup();
  });

  it('helpers.typ defines a custom cv-section with accent divider', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.helpers).toContain('let cv-section');
    expect(files.helpers).toContain('stroke: 0.9pt + _accent');
    await files.cleanup();
  });

  it('helpers.typ re-exports cv-entry, cv-skill, h-bar from brilliant-cv', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.helpers).toContain('cv-entry');
    expect(files.helpers).toContain('cv-skill');
    expect(files.helpers).toContain('h-bar');
    await files.cleanup();
  });
});

describe('module imports', () => {
  it('professional.typ imports cv-section from helpers.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.professional).toContain('#import "../helpers.typ"');
    expect(files.professional).not.toContain('#import "@preview/brilliant-cv');
    await files.cleanup();
  });

  it('skills.typ imports cv-section from helpers.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.skills).toContain('#import "../helpers.typ"');
    expect(files.skills).not.toContain('#import "@preview/brilliant-cv');
    await files.cleanup();
  });

  it('education.typ imports cv-section from helpers.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.education).toContain('#import "../helpers.typ"');
    expect(files.education).not.toContain('#import "@preview/brilliant-cv');
    await files.cleanup();
  });
});
