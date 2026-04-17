import { ProgrammingLanguage } from '../../src/entities/ProgrammingLanguage.js';
import { SkillKind } from '../../src/value-objects/SkillKind.js';

describe('ProgrammingLanguage', () => {
  test('creates with programming-language-specific fields', () => {
    const pl = ProgrammingLanguage.create({
      label: 'Java',
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: ['backend'],
      conceptualAspects: ['Object-Oriented'],
      architecturalPatterns: [],
      mindName: 'Java',
      runtimeEnvironments: ['JVM', 'GraalVM'],
      buildTools: ['Maven', 'Gradle'],
      paradigms: ['Object-Oriented', 'Imperative']
    });
    expect(pl.kind).toBe(SkillKind.PROGRAMMING_LANGUAGE);
    expect(pl.runtimeEnvironments).toEqual(['JVM', 'GraalVM']);
    expect(pl.buildTools).toEqual(['Maven', 'Gradle']);
    expect(pl.paradigms).toEqual(['Object-Oriented', 'Imperative']);
  });

  test('defaults kind-specific arrays to empty', () => {
    const pl = ProgrammingLanguage.create({
      label: 'Rust',
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: [],
      conceptualAspects: [],
      architecturalPatterns: [],
      mindName: null,
      runtimeEnvironments: [],
      buildTools: [],
      paradigms: []
    });
    expect(pl.runtimeEnvironments).toEqual([]);
    expect(pl.buildTools).toEqual([]);
    expect(pl.paradigms).toEqual([]);
  });
});
