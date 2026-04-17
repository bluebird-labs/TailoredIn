import { Accomplishment } from '../../src/entities/Accomplishment.js';

describe('Accomplishment', () => {
  it('creates with required fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1',
      title: 'Billing sharding',
      narrative: 'Led the migration of billing engine to hash-based sharding.',
      ordinal: 0
    });
    expect(typeof a.id).toBe('string');
    expect(a.title).toBe('Billing sharding');
    expect(a.narrative).toBe('Led the migration of billing engine to hash-based sharding.');
  });

  it('updates fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1',
      title: 'Old',
      narrative: 'Old narrative',
      ordinal: 0
    });
    const before = a.updatedAt;
    a.update({ title: 'New', narrative: 'New narrative' });
    expect(a.title).toBe('New');
    expect(a.narrative).toBe('New narrative');
    expect(a.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('partial update only changes specified fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1',
      title: 'Original',
      narrative: 'Original narrative',
      ordinal: 0
    });
    a.update({ title: 'New title' });
    expect(a.title).toBe('New title');
    expect(a.narrative).toBe('Original narrative');
    expect(a.ordinal).toBe(0);
  });
});
