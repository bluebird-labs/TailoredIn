import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { injectable } from '@needle-di/core';
import type { CompanySearchProvider, CompanySearchResult } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { stripCodeFences } from './strip-code-fences.js';

const SCHEMA_PATH = resolve(import.meta.dir, 'schemas/search-companies.json');
const schema = readFileSync(SCHEMA_PATH, 'utf-8');

@injectable()
export class ClaudeCliCompanySearchProvider implements CompanySearchProvider {
  private readonly log = Logger.create(this);

  public async searchByName(name: string): Promise<CompanySearchResult[]> {
    const prompt = this.buildPrompt(name);

    this.log.info(`Searching companies by name: ${name}`);

    const proc = Bun.spawn(['claude', '-p', prompt, '--output-format', 'json', '--json-schema', schema], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      this.log.error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
      throw new Error(`Claude CLI failed with exit code ${exitCode}`);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(output);
    } catch (e) {
      this.log.error(`Failed to parse Claude CLI output: ${output.slice(0, 200)}`);
      throw new Error(`Claude CLI returned invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
    const text = stripCodeFences(typeof parsed.result === 'string' ? parsed.result : output);

    return this.parseResponse(text);
  }

  public parseResponse(raw: string): CompanySearchResult[] {
    let data: unknown;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      this.log.error(`Failed to parse search response: ${raw.slice(0, 200)}`);
      throw new Error(`Invalid search response JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (!Array.isArray(data)) {
      this.log.warn(`Unexpected search response shape (expected array): ${typeof data}`);
      return [];
    }

    return data
      .filter((item: unknown) => typeof item === 'object' && item !== null && 'name' in item)
      .map((item: Record<string, unknown>) => ({
        name: typeof item.name === 'string' ? item.name : '',
        website: typeof item.website === 'string' ? item.website : null,
        description: typeof item.description === 'string' ? item.description : null
      }))
      .slice(0, 5);
  }

  private buildPrompt(name: string): string {
    return [
      `Given this company name: "${name}"`,
      'Find the top 5 real companies that best match this name.',
      'Order by likelihood of match (best match first).'
    ].join('\n');
  }
}
