import { Experience } from '../../src/entities/Experience.js';

describe('Experience', () => {
  const makeExperience = () =>
    Experience.create({
      profileId: 'profile-1',
      title: 'Staff Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      companyAccent: null,
      companyId: null,
      location: 'New York, NY',
      startDate: '2022-01',
      endDate: 'Present',
      summary: 'Led platform team',
      ordinal: 0,
      bulletMin: 2,
      bulletMax: 5
    });

  test('creates with empty accomplishments', () => {
    const exp = makeExperience();
    expect(exp.title).toBe('Staff Engineer');
    expect(exp.companyName).toBe('Acme Corp');
    expect(exp.accomplishments).toHaveLength(0);
  });

  test('adds an accomplishment', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', ordinal: 0 });
    expect(exp.accomplishments).toHaveLength(1);
    expect(accomplishment.title).toBe('T');
    expect(accomplishment.experienceId).toBe(exp.id);
  });

  test('removes an accomplishment', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', ordinal: 0 });
    exp.removeAccomplishment(accomplishment.id);
    expect(exp.accomplishments).toHaveLength(0);
  });

  test('finds accomplishment or fails', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', ordinal: 0 });
    const found = exp.findAccomplishmentOrFail(accomplishment.id);
    expect(found.id).toBe(accomplishment.id);
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

  test('creates with empty skills', () => {
    const exp = makeExperience();
    expect(exp.skills).toHaveLength(0);
  });

  test('adds a skill', () => {
    const exp = makeExperience();
    const es = exp.addSkill('skill-1');
    expect(exp.skills).toHaveLength(1);
    expect(es.skillId).toBe('skill-1');
    expect(es.experienceId).toBe(exp.id);
  });

  test('removes a skill', () => {
    const exp = makeExperience();
    exp.addSkill('skill-1');
    exp.removeSkill('skill-1');
    expect(exp.skills).toHaveLength(0);
  });

  test('throws when removing non-existent skill', () => {
    const exp = makeExperience();
    expect(() => exp.removeSkill('nonexistent')).toThrow('ExperienceSkill not found');
  });

  test('finds skill or fails', () => {
    const exp = makeExperience();
    exp.addSkill('skill-1');
    const found = exp.findSkillOrFail('skill-1');
    expect(found.skillId).toBe('skill-1');
  });

  describe('syncSkills', () => {
    it('adds new skills', () => {
      const exp = makeExperience();
      exp.syncSkills(['skill-1', 'skill-2']);
      expect(exp.skills).toHaveLength(2);
    });

    it('removes skills absent from input', () => {
      const exp = makeExperience();
      exp.addSkill('skill-1');
      exp.addSkill('skill-2');
      exp.syncSkills(['skill-1']);
      expect(exp.skills).toHaveLength(1);
      expect(exp.skills[0].skillId).toBe('skill-1');
    });

    it('keeps existing skills that are in the input', () => {
      const exp = makeExperience();
      const es = exp.addSkill('skill-1');
      exp.syncSkills(['skill-1', 'skill-2']);
      expect(exp.skills).toHaveLength(2);
      expect(exp.skills.getItems().find(s => s.skillId === 'skill-1')!.id).toBe(es.id);
    });

    it('clears all skills when given empty list', () => {
      const exp = makeExperience();
      exp.addSkill('skill-1');
      exp.addSkill('skill-2');
      exp.syncSkills([]);
      expect(exp.skills).toHaveLength(0);
    });

    it('updates experience updatedAt', () => {
      const exp = makeExperience();
      const before = exp.updatedAt;
      exp.syncSkills(['skill-1']);
      expect(exp.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('syncAccomplishments', () => {
    function makeExperienceWithAccomplishments() {
      const exp = Experience.create({
        profileId: 'p1',
        title: 'Engineer',
        companyName: 'ACME',
        companyWebsite: null,
        companyAccent: null,
        companyId: null,
        location: 'Remote',
        startDate: '2020-01',
        endDate: '2023-01',
        summary: null,
        ordinal: 0,
        bulletMin: 2,
        bulletMax: 5
      });
      exp.addAccomplishment({ title: 'First', narrative: 'Narrative 1', ordinal: 0 });
      exp.addAccomplishment({ title: 'Second', narrative: 'Narrative 2', ordinal: 1 });
      return exp;
    }

    it('adds a new accomplishment when id is null', () => {
      const exp = makeExperienceWithAccomplishments();
      const existingIds = exp.accomplishments.map(a => a.id);
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
      const id0 = exp.accomplishments[0].id;
      const id1 = exp.accomplishments[1].id;
      exp.syncAccomplishments([
        { id: id0, title: 'Updated title', narrative: 'Updated narrative', ordinal: 0 },
        { id: id1, title: 'Second', narrative: 'Narrative 2', ordinal: 1 }
      ]);
      expect(exp.accomplishments[0].title).toBe('Updated title');
      expect(exp.accomplishments[0].narrative).toBe('Updated narrative');
    });

    it('removes accomplishments absent from input', () => {
      const exp = makeExperienceWithAccomplishments();
      const id0 = exp.accomplishments[0].id;
      exp.syncAccomplishments([{ id: id0, title: 'First', narrative: 'Narrative 1', ordinal: 0 }]);
      expect(exp.accomplishments).toHaveLength(1);
      expect(exp.accomplishments[0].id).toBe(id0);
    });

    it('handles reorder by updating ordinals', () => {
      const exp = makeExperienceWithAccomplishments();
      const id0 = exp.accomplishments[0].id;
      const id1 = exp.accomplishments[1].id;
      exp.syncAccomplishments([
        { id: id1, title: 'Second', narrative: 'Narrative 2', ordinal: 0 },
        { id: id0, title: 'First', narrative: 'Narrative 1', ordinal: 1 }
      ]);
      const a = exp.accomplishments.find(a => a.id === id1)!;
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
      expect(() => exp.syncAccomplishments([{ id: 'unknown-id', title: 'X', narrative: 'Y', ordinal: 0 }])).toThrow(
        'Accomplishment'
      );
    });
  });
});
