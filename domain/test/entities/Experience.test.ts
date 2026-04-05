import { describe, expect, it, test } from 'bun:test';
import { Experience } from '../../src/entities/Experience.js';

describe('Experience', () => {
  const makeExperience = () =>
    Experience.create({
      profileId: 'profile-1',
      title: 'Staff Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      companyId: null,
      location: 'New York, NY',
      startDate: '2022-01',
      endDate: 'Present',
      summary: 'Led platform team',
      ordinal: 0
    });

  test('creates with empty accomplishments', () => {
    const exp = makeExperience();
    expect(exp.title).toBe('Staff Engineer');
    expect(exp.companyName).toBe('Acme Corp');
    expect(exp.accomplishments).toEqual([]);
  });

  test('adds an accomplishment', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', ordinal: 0 });
    expect(exp.accomplishments).toHaveLength(1);
    expect(accomplishment.title).toBe('T');
    expect(accomplishment.experienceId).toBe(exp.id.value);
  });

  test('removes an accomplishment', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', ordinal: 0 });
    exp.removeAccomplishment(accomplishment.id.value);
    expect(exp.accomplishments).toHaveLength(0);
  });

  test('finds accomplishment or fails', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', ordinal: 0 });
    const found = exp.findAccomplishmentOrFail(accomplishment.id.value);
    expect(found.id.equals(accomplishment.id)).toBe(true);
  });

  test('throws when removing non-existent accomplishment', () => {
    const exp = makeExperience();
    expect(() => exp.removeAccomplishment('nonexistent')).toThrow('Accomplishment not found');
  });

  test('updates mutable fields', () => {
    const exp = makeExperience();
    exp.title = 'Principal Engineer';
    exp.companyName = 'NewCo';
    exp.location = 'Remote';
    expect(exp.title).toBe('Principal Engineer');
    expect(exp.companyName).toBe('NewCo');
    expect(exp.location).toBe('Remote');
  });

  test('starts with null companyId', () => {
    const exp = makeExperience();
    expect(exp.companyId).toBeNull();
  });

  test('links a company', () => {
    const exp = makeExperience();
    const before = exp.updatedAt;
    exp.linkCompany('company-123');
    expect(exp.companyId).toBe('company-123');
    expect(exp.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('unlinks a company', () => {
    const exp = makeExperience();
    exp.linkCompany('company-123');
    exp.unlinkCompany();
    expect(exp.companyId).toBeNull();
  });

  describe('syncAccomplishments', () => {
    function makeExperienceWithAccomplishments() {
      const exp = Experience.create({
        profileId: 'p1',
        title: 'Engineer',
        companyName: 'ACME',
        companyWebsite: null,
        companyId: null,
        location: 'Remote',
        startDate: '2020-01',
        endDate: '2023-01',
        summary: null,
        ordinal: 0
      });
      exp.addAccomplishment({ title: 'First', narrative: 'Narrative 1', ordinal: 0 });
      exp.addAccomplishment({ title: 'Second', narrative: 'Narrative 2', ordinal: 1 });
      return exp;
    }

    it('adds a new accomplishment when id is null', () => {
      const exp = makeExperienceWithAccomplishments();
      const existingIds = exp.accomplishments.map(a => a.id.value);
      exp.syncAccomplishments([
        { id: existingIds[0], title: 'First', narrative: 'Narrative 1', ordinal: 0 },
        { id: existingIds[1], title: 'Second', narrative: 'Narrative 2', ordinal: 1 },
        { id: null, title: 'New', narrative: 'New narrative', ordinal: 2 }
      ]);
      expect(exp.accomplishments).toHaveLength(3);
      expect(exp.accomplishments[2].title).toBe('New');
    });

    it('updates title and narrative of an existing accomplishment', () => {
      const exp = makeExperienceWithAccomplishments();
      const id0 = exp.accomplishments[0].id.value;
      const id1 = exp.accomplishments[1].id.value;
      exp.syncAccomplishments([
        { id: id0, title: 'Updated title', narrative: 'Updated narrative', ordinal: 0 },
        { id: id1, title: 'Second', narrative: 'Narrative 2', ordinal: 1 }
      ]);
      expect(exp.accomplishments[0].title).toBe('Updated title');
      expect(exp.accomplishments[0].narrative).toBe('Updated narrative');
    });

    it('removes accomplishments absent from input', () => {
      const exp = makeExperienceWithAccomplishments();
      const id0 = exp.accomplishments[0].id.value;
      exp.syncAccomplishments([
        { id: id0, title: 'First', narrative: 'Narrative 1', ordinal: 0 }
      ]);
      expect(exp.accomplishments).toHaveLength(1);
      expect(exp.accomplishments[0].id.value).toBe(id0);
    });

    it('handles reorder by updating ordinals', () => {
      const exp = makeExperienceWithAccomplishments();
      const id0 = exp.accomplishments[0].id.value;
      const id1 = exp.accomplishments[1].id.value;
      exp.syncAccomplishments([
        { id: id1, title: 'Second', narrative: 'Narrative 2', ordinal: 0 },
        { id: id0, title: 'First', narrative: 'Narrative 1', ordinal: 1 }
      ]);
      const a = exp.accomplishments.find(a => a.id.value === id1)!;
      expect(a.ordinal).toBe(0);
    });

    it('clears all accomplishments when given empty list', () => {
      const exp = makeExperienceWithAccomplishments();
      exp.syncAccomplishments([]);
      expect(exp.accomplishments).toHaveLength(0);
    });

    it('updates experience updatedAt', () => {
      const exp = makeExperienceWithAccomplishments();
      const before = exp.updatedAt;
      exp.syncAccomplishments([]);
      expect(exp.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('throws when updating with unknown id', () => {
      const exp = makeExperienceWithAccomplishments();
      expect(() =>
        exp.syncAccomplishments([{ id: 'unknown-id', title: 'X', narrative: 'Y', ordinal: 0 }])
      ).toThrow('Accomplishment');
    });
  });
});
