import { beforeAll, describe, expect, it } from 'bun:test';
import { execSync } from 'node:child_process';
import FS from 'node:fs/promises';
import OS from 'node:os';
import Path from 'node:path';
import type { BrilliantCVContent, BrilliantCVExperience } from '../../src/brilliant-cv/types.js';
import { BrilliantCvTemplate } from '../../src/templates/BrilliantCvTemplate.js';
import { TypstFileGenerator } from '../../src/resume/TypstFileGenerator.js';

// --- Shared personal block ---
const PERSONAL = {
  first_name: 'Alex',
  last_name: 'Rivera',
  github: 'arivera',
  linkedin: 'alexrivera',
  email: 'alex@example.com',
  phone: '555-0199',
  location: 'San Francisco, CA',
  header_quote: 'Engineering Leader · System Design · Distributed Systems'
};

// --- Experience factories ---
function makeExperience(count: number, bulletsPerEntry: number | number[]): BrilliantCVExperience[] {
  const companies = [
    'Acme Corp',
    'Globex Inc',
    'Initech',
    'Umbrella Corp',
    'Stark Industries',
    'Wayne Enterprises',
    'Cyberdyne',
    'Weyland-Yutani'
  ];
  const titles = [
    'Staff Engineer',
    'Senior Engineer',
    'Tech Lead',
    'Principal Engineer',
    'Engineering Manager',
    'VP Engineering',
    'Director of Engineering',
    'CTO'
  ];

  return Array.from({ length: count }, (_, i) => {
    const numBullets = Array.isArray(bulletsPerEntry) ? bulletsPerEntry[i % bulletsPerEntry.length] : bulletsPerEntry;
    return {
      title: titles[i % titles.length],
      society: companies[i % companies.length],
      date: `${2024 - i} — ${2025 - i > 2024 ? 'Present' : 2025 - i}`,
      location: i % 2 === 0 ? 'San Francisco, CA' : 'Remote',
      summary: `Led cross-functional team delivering platform improvements at ${companies[i % companies.length]}`,
      highlights: Array.from(
        { length: numBullets },
        (_, j) =>
          `Delivered key initiative #${j + 1}: reduced latency by ${10 + j * 5}% through architectural improvements and system optimization across distributed services`
      )
    };
  });
}

// --- Content factories ---
function buildContent(entries: number, bulletsPerEntry: number | number[]): BrilliantCVContent {
  return {
    personal: PERSONAL,
    keywords: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Kubernetes'],
    experience: makeExperience(entries, bulletsPerEntry),
    skills: [
      { type: 'Languages', info: 'TypeScript #h-bar() Go #h-bar() Python #h-bar() Rust' },
      { type: 'Frameworks', info: 'React #h-bar() Next.js #h-bar() Express #h-bar() FastAPI' },
      { type: 'Infrastructure', info: 'AWS #h-bar() Kubernetes #h-bar() Terraform #h-bar() Docker' },
      { type: 'Data', info: 'PostgreSQL #h-bar() Redis #h-bar() Kafka #h-bar() Elasticsearch' }
    ],
    education: [
      { title: 'MS Computer Science', society: 'Stanford University', date: '2014', location: 'Stanford, CA' },
      { title: 'BS Computer Science', society: 'UC Berkeley', date: '2012', location: 'Berkeley, CA' }
    ]
  };
}

const VOLUMES = [
  { name: 'light', entries: 3, bullets: 2 as number | number[] },
  { name: 'standard', entries: 5, bullets: 3 as number | number[] },
  { name: 'heavy', entries: 8, bullets: [2, 3, 4, 5, 3, 4, 2, 5] as number | number[] }
] as const;

// --- Typst availability guard ---
let typstAvailable = false;

beforeAll(() => {
  try {
    execSync('typst --version', { stdio: 'pipe' });
    typstAvailable = true;
  } catch {
    // biome-ignore lint/suspicious/noConsole: intentional test diagnostic
    console.warn('Typst not available — skipping visual-polish compilation tests');
  }
});

// --- Compilation helper ---
async function compileAndCountPages(content: BrilliantCVContent): Promise<{ pageCount: number; tmpDir: string }> {
  const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'visual-polish-'));

  await TypstFileGenerator.generate(content, tmpDir, BrilliantCvTemplate);

  // Compile to PDF
  execSync('typst compile cv.typ output.pdf', { cwd: tmpDir, stdio: 'pipe' });

  // Compile to PNG to count pages (one PNG per page)
  execSync('typst compile cv.typ "page-{n}.png"', { cwd: tmpDir, stdio: 'pipe' });
  const pngs = (await FS.readdir(tmpDir)).filter(f => f.startsWith('page-') && f.endsWith('.png'));

  return { pageCount: pngs.length, tmpDir };
}

// --- Test matrix ---
describe('Visual Polish — Page-Fit Validation', () => {
  for (const volume of VOLUMES) {
    it(`compiles ${volume.name} content`, async () => {
      if (!typstAvailable) return;

      const content = buildContent(volume.entries, volume.bullets);
      const { pageCount, tmpDir } = await compileAndCountPages(content);

      try {
        // All combinations must produce 1-2 pages
        expect(pageCount).toBeGreaterThanOrEqual(1);
        expect(pageCount).toBeLessThanOrEqual(2);

        // Verify PDF exists and has content
        const pdfStat = await FS.stat(Path.join(tmpDir, 'output.pdf'));
        expect(pdfStat.size).toBeGreaterThan(0);
      } finally {
        await FS.rm(tmpDir, { recursive: true });
      }
    });
  }
});

const SNAPSHOT_DIR = Path.join(import.meta.dir, '__snapshots__');

describe('Visual Polish — Snapshot Generation', () => {
  const shouldUpdate = process.env.UPDATE_SNAPSHOTS === 'true';

  beforeAll(async () => {
    if (shouldUpdate) {
      await FS.mkdir(SNAPSHOT_DIR, { recursive: true });
    }
  });

  for (const volume of VOLUMES) {
    it(`generates snapshot: ${volume.name}`, async () => {
      if (!typstAvailable || !shouldUpdate) return;

      const content = buildContent(volume.entries, volume.bullets);
      const { pageCount, tmpDir } = await compileAndCountPages(content);

      try {
        for (let page = 1; page <= pageCount; page++) {
          const src = Path.join(tmpDir, `page-${page}.png`);
          const dest = Path.join(SNAPSHOT_DIR, `${volume.name}-page${page}.png`);
          await FS.copyFile(src, dest);
        }
      } finally {
        await FS.rm(tmpDir, { recursive: true });
      }
    });
  }
});
