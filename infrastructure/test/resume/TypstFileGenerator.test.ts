import { describe, expect, it } from 'bun:test';
import FS from 'node:fs/promises';
import OS from 'node:os';
import Path from 'node:path';
import type { BrilliantCVContent } from '../../src/brilliant-cv/types.js';
import type { TemplateLayoutConfig } from '../../src/resume/TemplateLayoutConfig.js';
import { TypstFileGenerator } from '../../src/resume/TypstFileGenerator.js';
import { TEMPLATE_LAYOUTS } from '../../src/resume/templateLayouts.js';

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
  awesome_color: '#178FEA',
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

async function generateInTmpDir(content: BrilliantCVContent, layout: TemplateLayoutConfig) {
  const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-gen-'));
  await TypstFileGenerator.generate(content, tmpDir, layout);
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
  describe('IC layout', () => {
    const layout = TEMPLATE_LAYOUTS.ic;

    it('injects IC spacing values into metadata.toml', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.metadata).toContain('before_section_skip = "1pt"');
      expect(files.metadata).toContain('before_entry_skip = "1pt"');
      expect(files.metadata).toContain('before_entry_description_skip = "1pt"');
      await files.cleanup();
    });

    it('sets IC font size and spacing in cv.typ', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.cv).toContain('#set text(size: 10pt)');
      expect(files.cv).toContain('#set par(leading: 0.65em)');
      expect(files.cv).toContain('#set page(margin: 1.2cm)');
      await files.cleanup();
    });

    it('orders sections as professional, skills, education', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      const profIdx = files.cv.indexOf('modules_en/professional.typ');
      const skillsIdx = files.cv.indexOf('modules_en/skills.typ');
      const eduIdx = files.cv.indexOf('modules_en/education.typ');
      expect(profIdx).toBeLessThan(skillsIdx);
      expect(skillsIdx).toBeLessThan(eduIdx);
      await files.cleanup();
    });

    it('includes summary line in professional.typ', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.professional).toContain('[_Led platform team_]');
      await files.cleanup();
    });

    it('includes all 6 highlights when maxBulletsPerEntry is 6', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.professional).toContain('Built API gateway');
      expect(files.professional).toContain('Shipped v2');
      await files.cleanup();
    });
  });

  describe('EXECUTIVE layout', () => {
    const layout = TEMPLATE_LAYOUTS.executive;

    it('injects EXECUTIVE spacing values into metadata.toml', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.metadata).toContain('before_section_skip = "6pt"');
      expect(files.metadata).toContain('before_entry_skip = "5pt"');
      expect(files.metadata).toContain('before_entry_description_skip = "3pt"');
      await files.cleanup();
    });

    it('sets EXECUTIVE font size and spacing in cv.typ', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.cv).toContain('#set text(size: 11pt)');
      expect(files.cv).toContain('#set par(leading: 0.85em)');
      expect(files.cv).toContain('#set page(margin: 2cm)');
      await files.cleanup();
    });

    it('orders sections as skills, professional, education', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      const skillsIdx = files.cv.indexOf('modules_en/skills.typ');
      const profIdx = files.cv.indexOf('modules_en/professional.typ');
      const eduIdx = files.cv.indexOf('modules_en/education.typ');
      expect(skillsIdx).toBeLessThan(profIdx);
      expect(profIdx).toBeLessThan(eduIdx);
      await files.cleanup();
    });

    it('omits summary line in professional.typ', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.professional).not.toContain('[_Led platform team_]');
      await files.cleanup();
    });

    it('truncates highlights to maxBulletsPerEntry (3)', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.professional).toContain('Built API gateway');
      expect(files.professional).toContain('Reduced latency 40%');
      expect(files.professional).toContain('Migrated to k8s');
      expect(files.professional).not.toContain('Mentored 3 engineers');
      expect(files.professional).not.toContain('Wrote RFCs');
      expect(files.professional).not.toContain('Shipped v2');
      await files.cleanup();
    });
  });

  describe('ARCHITECT layout', () => {
    const layout = TEMPLATE_LAYOUTS.architect;

    it('injects ARCHITECT spacing values into metadata.toml', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.metadata).toContain('before_section_skip = "4pt"');
      expect(files.metadata).toContain('before_entry_skip = "3pt"');
      expect(files.metadata).toContain('before_entry_description_skip = "2pt"');
      await files.cleanup();
    });

    it('includes summary and truncates to 5 bullets', async () => {
      const files = await generateInTmpDir(MINIMAL_CONTENT, layout);
      expect(files.professional).toContain('[_Led platform team_]');
      expect(files.professional).toContain('Wrote RFCs');
      expect(files.professional).not.toContain('Shipped v2');
      await files.cleanup();
    });
  });
});
