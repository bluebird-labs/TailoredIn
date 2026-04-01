import { describe, expect, test } from 'bun:test';
import { Education } from '../../src/entities/Education.js';
import { EducationId } from '../../src/value-objects/EducationId.js';

describe('Education', () => {
  const createProps = {
    degreeTitle: 'B.S. in Computer Science',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: 'Magna Cum Laude',
    ordinal: 0
  };

  test('create generates id and timestamps', () => {
    const edu = Education.create(createProps);

    expect(edu.id).toBeInstanceOf(EducationId);
    expect(edu.degreeTitle).toBe('B.S. in Computer Science');
    expect(edu.institutionName).toBe('MIT');
    expect(edu.graduationYear).toBe(2020);
    expect(edu.location).toBe('Cambridge, MA');
    expect(edu.honors).toBe('Magna Cum Laude');
    expect(edu.ordinal).toBe(0);
    expect(edu.createdAt).toBeInstanceOf(Date);
    expect(edu.updatedAt).toBeInstanceOf(Date);
  });

  test('create with nullable fields set to null', () => {
    const edu = Education.create({ ...createProps, location: null, honors: null });

    expect(edu.location).toBeNull();
    expect(edu.honors).toBeNull();
  });

  test('constructor reconstitutes from full props', () => {
    const id = new EducationId('fixed-id');
    const now = new Date('2025-01-01');
    const edu = new Education({ id, ...createProps, createdAt: now, updatedAt: now });

    expect(edu.id.value).toBe('fixed-id');
    expect(edu.degreeTitle).toBe('B.S. in Computer Science');
    expect(edu.graduationYear).toBe(2020);
  });

  test('mutable properties can be updated', () => {
    const edu = Education.create(createProps);

    edu.degreeTitle = 'M.S. in Computer Science';
    edu.institutionName = 'Stanford';
    edu.graduationYear = 2022;
    edu.location = 'Stanford, CA';
    edu.honors = 'With Distinction';
    edu.ordinal = 1;

    expect(edu.degreeTitle).toBe('M.S. in Computer Science');
    expect(edu.institutionName).toBe('Stanford');
    expect(edu.graduationYear).toBe(2022);
    expect(edu.location).toBe('Stanford, CA');
    expect(edu.honors).toBe('With Distinction');
    expect(edu.ordinal).toBe(1);
  });
});
