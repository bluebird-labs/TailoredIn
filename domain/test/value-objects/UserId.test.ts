import { describe, expect, test } from 'bun:test';
import { ArchetypeConfigId } from '../../src/value-objects/ArchetypeConfigId.js';
import { ArchetypePositionId } from '../../src/value-objects/ArchetypePositionId.js';
import { ResumeBulletId } from '../../src/value-objects/ResumeBulletId.js';
import { ResumeCompanyId } from '../../src/value-objects/ResumeCompanyId.js';
import { ResumeEducationId } from '../../src/value-objects/ResumeEducationId.js';
import { ResumeHeadlineId } from '../../src/value-objects/ResumeHeadlineId.js';
import { ResumeSkillCategoryId } from '../../src/value-objects/ResumeSkillCategoryId.js';
import { ResumeSkillItemId } from '../../src/value-objects/ResumeSkillItemId.js';
import { UserId } from '../../src/value-objects/UserId.js';

const idClasses = [
  { name: 'UserId', Cls: UserId },
  { name: 'ResumeCompanyId', Cls: ResumeCompanyId },
  { name: 'ResumeBulletId', Cls: ResumeBulletId },
  { name: 'ResumeEducationId', Cls: ResumeEducationId },
  { name: 'ResumeSkillCategoryId', Cls: ResumeSkillCategoryId },
  { name: 'ResumeSkillItemId', Cls: ResumeSkillItemId },
  { name: 'ResumeHeadlineId', Cls: ResumeHeadlineId },
  { name: 'ArchetypeConfigId', Cls: ArchetypeConfigId },
  { name: 'ArchetypePositionId', Cls: ArchetypePositionId }
] as const;

for (const { name, Cls } of idClasses) {
  describe(name, () => {
    test('constructor stores value', () => {
      const id = new Cls('abc-123');
      expect(id.value).toBe('abc-123');
    });

    test('generate creates a unique UUID', () => {
      const a = Cls.generate();
      const b = Cls.generate();
      expect(a.value).not.toBe(b.value);
      expect(a.value).toMatch(/^[0-9a-f-]{36}$/);
    });

    test('equals returns true for same value', () => {
      const a = new Cls('same');
      const b = new Cls('same');
      expect(a.equals(b)).toBe(true);
    });

    test('equals returns false for different values', () => {
      const a = new Cls('one');
      const b = new Cls('two');
      expect(a.equals(b)).toBe(false);
    });
  });
}
