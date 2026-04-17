import { writeFileSync } from 'node:fs';
import Path from 'node:path';
import { LinguistParser } from '../../src/linguist/LinguistParser.js';

const FIXTURE_PATH = Path.resolve(import.meta.dirname, 'fixtures/languages-fixture.yml');

describe('LinguistParser', () => {
  const parser = new LinguistParser();

  test('parses fixture YAML and returns all languages', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    expect(result).toHaveLength(6);
  });

  test('extracts language name from YAML key', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    const names = result.map(l => l.name);
    expect(names).toContain('JavaScript');
    expect(names).toContain('TypeScript');
    expect(names).toContain('HTML');
    expect(names).toContain('JSON');
    expect(names).toContain('Markdown');
    expect(names).toContain('Minimal');
  });

  test('parses programming language with all fields', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    const js = result.find(l => l.name === 'JavaScript')!;

    expect(js.type).toBe('programming');
    expect(js.color).toBe('#f1e05a');
    expect(js.aliases).toEqual(['js', 'node']);
    expect(js.extensions).toEqual(['.js', '.mjs', '.jsx']);
    expect(js.interpreters).toEqual(['node', 'nodejs']);
    expect(js.tm_scope).toBe('source.js');
    expect(js.ace_mode).toBe('javascript');
    expect(js.codemirror_mode).toBe('javascript');
    expect(js.codemirror_mime_type).toBe('text/javascript');
    expect(js.language_id).toBe(183);
    expect(js.group).toBe('JavaScript');
  });

  test('parses markup type', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    const html = result.find(l => l.name === 'HTML')!;
    expect(html.type).toBe('markup');
  });

  test('parses data type', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    const json = result.find(l => l.name === 'JSON')!;
    expect(json.type).toBe('data');
  });

  test('parses prose type', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    const md = result.find(l => l.name === 'Markdown')!;
    expect(md.type).toBe('prose');
  });

  test('handles minimal language with only required fields', async () => {
    const result = await parser.parse(FIXTURE_PATH);
    const minimal = result.find(l => l.name === 'Minimal')!;

    expect(minimal.type).toBe('programming');
    expect(minimal.language_id).toBe(999);
    expect(minimal.color).toBeUndefined();
    expect(minimal.aliases).toBeUndefined();
    expect(minimal.extensions).toBeUndefined();
    expect(minimal.interpreters).toBeUndefined();
    expect(minimal.tm_scope).toBeUndefined();
    expect(minimal.ace_mode).toBeUndefined();
    expect(minimal.group).toBeUndefined();
  });

  test('rejects YAML with invalid type', async () => {
    const tmpFile = Path.resolve(import.meta.dirname, 'fixtures/invalid-type.yml');
    writeFileSync(tmpFile, 'InvalidLang:\n  type: invalid_type\n  language_id: 1\n');

    try {
      await expect(parser.parse(tmpFile)).rejects.toThrow('validation failed');
    } finally {
      const { unlinkSync } = await import('node:fs');
      unlinkSync(tmpFile);
    }
  });

  test('rejects YAML with missing type field', async () => {
    const tmpFile = Path.resolve(import.meta.dirname, 'fixtures/missing-type.yml');
    writeFileSync(tmpFile, 'NoType:\n  color: "#ffffff"\n  language_id: 1\n');

    try {
      await expect(parser.parse(tmpFile)).rejects.toThrow('validation failed');
    } finally {
      const { unlinkSync } = await import('node:fs');
      unlinkSync(tmpFile);
    }
  });
});
