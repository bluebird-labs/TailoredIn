import { describe, expect, test } from 'bun:test';
import { Skill } from '../../src/entities/Skill.js';
import { SkillKind } from '../../src/value-objects/SkillKind.js';

describe('Skill', () => {
  test('creates with required fields and new kind-based metadata', () => {
    const skill = Skill.create({
      label: 'TypeScript',
      kind: SkillKind.PROGRAMMING_LANGUAGE,
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: ['backend', 'frontend'],
      conceptualAspects: ['Object-Oriented'],
      architecturalPatterns: [],
      mindName: 'TypeScript'
    });
    expect(skill.id).toBeString();
    expect(skill.label).toBe('TypeScript');
    expect(skill.normalizedLabel).toBe('typescript');
    expect(skill.kind).toBe(SkillKind.PROGRAMMING_LANGUAGE);
    expect(skill.categoryId).toBeNull();
    expect(skill.description).toBeNull();
    expect(skill.aliases).toEqual([]);
    expect(skill.technicalDomains).toEqual(['backend', 'frontend']);
    expect(skill.conceptualAspects).toEqual(['Object-Oriented']);
    expect(skill.architecturalPatterns).toEqual([]);
    expect(skill.mindName).toBe('TypeScript');
  });

  test('derives normalizedLabel from label', () => {
    const skill = Skill.create({
      label: 'Node.js',
      kind: SkillKind.TOOL,
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: [],
      conceptualAspects: [],
      architecturalPatterns: [],
      mindName: null
    });
    expect(skill.normalizedLabel).toBe('node-js');
  });

  test('creates with aliases', () => {
    const aliases = [
      { label: 'Golang', normalizedLabel: 'golang' },
      { label: 'Go language', normalizedLabel: 'go-language' }
    ];
    const skill = Skill.create({
      label: 'Go',
      kind: SkillKind.PROGRAMMING_LANGUAGE,
      categoryId: 'cat-1',
      description: 'A programming language by Google',
      aliases,
      technicalDomains: [],
      conceptualAspects: [],
      architecturalPatterns: [],
      mindName: 'Go'
    });
    expect(skill.aliases).toEqual(aliases);
    expect(skill.categoryId).toBe('cat-1');
    expect(skill.description).toBe('A programming language by Google');
  });

  test('throws when label is empty', () => {
    expect(() =>
      Skill.create({
        label: '',
        kind: SkillKind.PROGRAMMING_LANGUAGE,
        categoryId: null,
        description: null,
        aliases: [],
        technicalDomains: [],
        conceptualAspects: [],
        architecturalPatterns: [],
        mindName: null
      })
    ).toThrow('label');
  });

  test('throws when label exceeds 500 chars', () => {
    expect(() =>
      Skill.create({
        label: 'a'.repeat(501),
        kind: SkillKind.PROGRAMMING_LANGUAGE,
        categoryId: null,
        description: null,
        aliases: [],
        technicalDomains: [],
        conceptualAspects: [],
        architecturalPatterns: [],
        mindName: null
      })
    ).toThrow('label');
  });
});
