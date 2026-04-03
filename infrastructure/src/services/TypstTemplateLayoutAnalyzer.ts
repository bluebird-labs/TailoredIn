import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import FS from 'node:fs/promises';
import OS from 'node:os';
import Path from 'node:path';
import { injectable } from '@needle-di/core';
import type { ResumeContentDto, TemplateLayoutAnalyzer } from '@tailoredin/application';
import type { LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';
import { TYPST_DIR } from '../resume/TYPST_DIR.js';
import { TypstFileGenerator } from '../resume/TypstFileGenerator.js';
import { parseLayoutAnalysis } from './LayoutAnalysisParser.js';

const MAX_CACHE_SIZE = 50;

function contentHash(content: ResumeContentDto): string {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}

/**
 * Runs `typst query` on an analysis-mode compiled resume to extract per-block
 * layout positions (page numbers + y-coordinates), then converts them to a
 * LayoutAnalysis. Results are cached by (templateId + contentHash).
 *
 * The cache stores in-flight Promises so concurrent calls with the same key
 * share a single typst process invocation.
 */
@injectable()
export class TypstTemplateLayoutAnalyzer implements TemplateLayoutAnalyzer {
  private readonly cache = new Map<string, { promise: Promise<LayoutAnalysis>; insertedAt: number }>();

  public analyze(template: ResumeTemplate, content: ResumeContentDto): Promise<LayoutAnalysis> {
    const cacheKey = `${template.id}:${contentHash(content)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached.promise;

    const promise = this.runTypstQuery(template, content);
    this.insertCache(cacheKey, promise);
    return promise;
  }

  private async runTypstQuery(template: ResumeTemplate, content: ResumeContentDto): Promise<LayoutAnalysis> {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'tailoredin-analysis-'));

    try {
      const fontsSource = Path.join(TYPST_DIR, 'fonts');
      const fontsTarget = Path.join(tmpDir, 'fonts');
      await FS.cp(fontsSource, fontsTarget, { recursive: true });

      await TypstFileGenerator.generateForAnalysis(content, tmpDir, template);

      const queryOutput = await this.spawnTypstQuery(tmpDir);
      return parseLayoutAnalysis(queryOutput, content, template);
    } finally {
      await FS.rm(tmpDir, { recursive: true, force: true });
    }
  }

  private spawnTypstQuery(cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(
        'typst',
        ['query', '--font-path', './fonts', 'cv.typ', '<all-layout-positions>', '--field', 'value'],
        { cwd, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      proc.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
      proc.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));

      proc.on('close', code => {
        if (code !== 0) {
          reject(new Error(`typst query failed: ${Buffer.concat(stderr).toString()}`));
        } else {
          resolve(Buffer.concat(stdout).toString());
        }
      });
      proc.on('error', reject);
    });
  }

  /** Evicts the oldest entry when cache is full. */
  private insertCache(key: string, promise: Promise<LayoutAnalysis>): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldest = [...this.cache.entries()].sort((a, b) => a[1].insertedAt - b[1].insertedAt)[0];
      this.cache.delete(oldest[0]);
    }
    this.cache.set(key, { promise, insertedAt: Date.now() });
  }
}
