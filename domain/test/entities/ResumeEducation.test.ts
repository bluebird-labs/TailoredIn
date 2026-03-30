import { describe, expect, test } from 'bun:test';
import { ResumeEducation } from '../../src/entities/ResumeEducation.js';
import { ResumeEducationId } from '../../src/value-objects/ResumeEducationId.js';

describe('ResumeEducation', () => {
  const createProps = {
    userId: 'user-1',
    degreeTitle: 'B.S. in Computer Science',
    institutionName: 'MIT',
    graduationYear: '2020',
    locationLabel: 'Cambridge, MA',
    ordinal: 0
  };

  test('create generates id and timestamps', () => {
    const edu = ResumeEducation.create(createProps);

    expect(edu.id).toBeInstanceOf(ResumeEducationId);
    expect(edu.userId).toBe('user-1');
    expect(edu.degreeTitle).toBe('B.S. in Computer Science');
    expect(edu.institutionName).toBe('MIT');
    expect(edu.graduationYear).toBe('2020');
    expect(edu.locationLabel).toBe('Cambridge, MA');
    expect(edu.ordinal).toBe(0);
    expect(edu.createdAt).toBeInstanceOf(Date);
  });

  test('constructor reconstitutes from full props', () => {
    const id = new ResumeEducationId('fixed-id');
    const now = new Date('2025-01-01');
    const edu = new ResumeEducation({ id, ...createProps, createdAt: now, updatedAt: now });

    expect(edu.id.value).toBe('fixed-id');
    expect(edu.degreeTitle).toBe('B.S. in Computer Science');
  });
});
