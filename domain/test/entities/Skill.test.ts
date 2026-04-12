import { describe, expect, test } from 'bun:test';
import { Skill } from '../../src/entities/Skill.js';
import { SkillType } from '../../src/value-objects/SkillType.js';

describe('Skill', () => {
  test('creates with required fields', () => {
    const skill = Skill.create({
      label: 'TypeScript',
      type: SkillType.LANGUAGE,
      categoryId: null,
      description: null,
      aliases: []
    });
    expect(skill.id).toBeString();
    expect(skill.label).toBe('TypeScript');
    expect(skill.normalizedLabel).toBe('typescript');
    expect(skill.type).toBe(SkillType.LANGUAGE);
    expect(skill.categoryId).toBeNull();
    expect(skill.description).toBeNull();
    expect(skill.aliases).toEqual([]);
  });

  test('derives normalizedLabel from label', () => {
    const skill = Skill.create({
      label: 'Node.js',
      type: SkillType.TECHNOLOGY,
      categoryId: null,
      description: null,
      aliases: []
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
      type: SkillType.LANGUAGE,
      categoryId: 'cat-1',
      description: 'A programming language by Google',
      aliases
    });
    expect(skill.aliases).toEqual(aliases);
    expect(skill.categoryId).toBe('cat-1');
    expect(skill.description).toBe('A programming language by Google');
  });

  test('throws when label is empty', () => {
    expect(() =>
      Skill.create({ label: '', type: SkillType.LANGUAGE, categoryId: null, description: null, aliases: [] })
    ).toThrow('label');
  });

  test('throws when label exceeds 500 chars', () => {
    expect(() =>
      Skill.create({
        label: 'a'.repeat(501),
        type: SkillType.LANGUAGE,
        categoryId: null,
        description: null,
        aliases: []
      })
    ).toThrow('label');
  });
});
