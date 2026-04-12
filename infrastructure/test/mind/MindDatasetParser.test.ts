import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { MindDatasetParser } from '../../src/mind/MindDatasetParser.js';

const FIXTURES_DIR = join(import.meta.dir, 'fixtures');

describe('MindDatasetParser', () => {
  const parser = new MindDatasetParser();

  test('parses all skills from fixture files', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    // 3 programming languages + 2 frameworks = 5 skills
    expect(dataset.skills).toHaveLength(5);
  });

  test('parses all concepts from fixture files', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    // 3 architectural pattern concepts
    expect(dataset.concepts).toHaveLength(3);
  });

  test('attaches sourceFile to each skill', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    const jsSkill = dataset.skills.find(s => s.name === 'JavaScript');
    expect(jsSkill?.sourceFile).toBe('programming_languages');

    const reactSkill = dataset.skills.find(s => s.name === 'React');
    expect(reactSkill?.sourceFile).toBe('frameworks_frontend');
  });

  test('attaches mindType to each concept', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    const concept = dataset.concepts.find(c => c.name === 'Microservices');
    expect(concept?.mindType).toBe('architectural_patterns');
  });

  test('maps skill fields correctly', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    const js = dataset.skills.find(s => s.name === 'JavaScript')!;
    expect(js.type).toEqual(['ProgrammingLanguage']);
    expect(js.synonyms).toEqual(['JS', 'ECMAScript']);
    expect(js.technicalDomains).toEqual(['frontend', 'backend']);
    expect(js.buildTools).toEqual(['npm', 'webpack']);
    expect(js.runtimeEnvironments).toEqual(['Node.js', 'Deno', 'Bun']);
    expect(js.impliesKnowingConcepts).toEqual(['Event-driven programming']);
  });

  test('maps concept fields correctly', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    const eda = dataset.concepts.find(c => c.name === 'Event-driven programming')!;
    expect(eda.synonyms).toEqual(['event-driven architecture', 'EDA']);
  });

  test('defaults optional arrays to empty', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    const go = dataset.skills.find(s => s.name === 'Go')!;
    expect(go.runtimeEnvironments).toEqual([]);
    expect(go.supportedProgrammingLanguages).toEqual([]);
    expect(go.specificToFrameworks).toEqual([]);
  });

  test('preserves impliesKnowing arrays for relation derivation', async () => {
    const dataset = await parser.parse(FIXTURES_DIR);

    const react = dataset.skills.find(s => s.name === 'React')!;
    expect(react.impliesKnowingSkills).toEqual(['JavaScript']);
    expect(react.impliesKnowingConcepts).toEqual(['Component-based architecture']);
  });

  test('throws on nonexistent directory', async () => {
    await expect(parser.parse('/nonexistent')).rejects.toThrow();
  });
});
