import { describe, expect, test } from 'bun:test';
import { ResumeBullet } from '../../src/entities/ResumeBullet.js';
import { ResumeCompany } from '../../src/entities/ResumeCompany.js';
import { ResumePosition } from '../../src/entities/ResumePosition.js';
import { ResumeCompanyId } from '../../src/value-objects/ResumeCompanyId.js';
import { ResumeLocation } from '../../src/value-objects/ResumeLocation.js';

const makeProps = () => {
  const location = new ResumeLocation('New York, NY', 0);
  return {
    userId: 'user-1',
    companyName: 'Acme Corp',
    companyMention: 'acquired',
    websiteUrl: 'https://acme.com',
    businessDomain: 'B2B, SaaS',
    locations: [location]
  };
};

describe('ResumeCompany', () => {
  test('create generates id, sets timestamps, includes children', () => {
    const company = ResumeCompany.create(makeProps());

    expect(company.id).toBeInstanceOf(ResumeCompanyId);
    expect(company.companyName).toBe('Acme Corp');
    expect(company.companyMention).toBe('acquired');
    expect(company.websiteUrl).toBe('https://acme.com');
    expect(company.businessDomain).toBe('B2B, SaaS');
    expect(company.locations).toHaveLength(1);
    expect(company.locations[0].label).toBe('New York, NY');
    expect(company.positions).toHaveLength(0);
    expect(company.createdAt).toBeInstanceOf(Date);
  });

  test('create handles nullable fields', () => {
    const company = ResumeCompany.create({
      ...makeProps(),
      companyMention: null,
      websiteUrl: null
    });

    expect(company.companyMention).toBeNull();
    expect(company.websiteUrl).toBeNull();
  });

  test('equals compares by id', () => {
    const a = ResumeCompany.create(makeProps());
    const b = ResumeCompany.create(makeProps());
    expect(a.equals(b)).toBe(false);
  });
});

describe('ResumeCompany.addPosition', () => {
  test('creates a position with the correct resumeCompanyId', () => {
    const company = ResumeCompany.create(makeProps());
    const position = company.addPosition({
      title: 'Engineer',
      startDate: '2020-01',
      endDate: '2023-06',
      summary: null,
      ordinal: 0
    });
    expect(position.resumeCompanyId).toBe(company.id.value);
  });

  test('pushes the position to the positions array', () => {
    const company = ResumeCompany.create(makeProps());
    company.addPosition({ title: 'First', startDate: '2020-01', endDate: '2021-01', summary: null, ordinal: 0 });
    company.addPosition({ title: 'Second', startDate: '2021-01', endDate: '2023-01', summary: null, ordinal: 1 });
    expect(company.positions).toHaveLength(2);
    expect(company.positions[1].title).toBe('Second');
  });

  test('updates updatedAt', () => {
    const company = ResumeCompany.create(makeProps());
    const before = company.updatedAt;
    company.addPosition({ title: 'New', startDate: '2020-01', endDate: '2023-01', summary: null, ordinal: 0 });
    expect(company.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('ResumeCompany.removePosition', () => {
  test('removes the correct position', () => {
    const company = ResumeCompany.create(makeProps());
    const p1 = company.addPosition({
      title: 'Keep',
      startDate: '2020-01',
      endDate: '2021-01',
      summary: null,
      ordinal: 0
    });
    const p2 = company.addPosition({
      title: 'Remove',
      startDate: '2021-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 1
    });
    company.removePosition(p2.id.value);
    expect(company.positions).toHaveLength(1);
    expect(company.positions[0].id.value).toBe(p1.id.value);
  });

  test('throws when positionId not found', () => {
    const company = ResumeCompany.create(makeProps());
    expect(() => company.removePosition('nonexistent')).toThrow('Position not found');
  });
});

describe('ResumeCompany.findPositionOrFail', () => {
  test('returns the position', () => {
    const company = ResumeCompany.create(makeProps());
    const pos = company.addPosition({
      title: 'Found',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });
    expect(company.findPositionOrFail(pos.id.value).title).toBe('Found');
  });

  test('throws when not found', () => {
    const company = ResumeCompany.create(makeProps());
    expect(() => company.findPositionOrFail('nonexistent')).toThrow('Position not found');
  });
});

describe('ResumePosition bullet management', () => {
  test('addBullet creates a bullet with correct resumePositionId', () => {
    const position = ResumePosition.create({
      resumeCompanyId: 'co-1',
      title: 'Engineer',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });
    const bullet = position.addBullet({ content: 'Built APIs', ordinal: 0 });
    expect(bullet.resumePositionId).toBe(position.id.value);
  });

  test('updateBullet updates content', () => {
    const position = ResumePosition.create({
      resumeCompanyId: 'co-1',
      title: 'Engineer',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });
    const bullet = position.addBullet({ content: 'Old', ordinal: 0 });
    position.updateBullet(bullet.id.value, { content: 'New' });
    expect(bullet.content).toBe('New');
  });

  test('removeBullet removes the correct bullet', () => {
    const position = ResumePosition.create({
      resumeCompanyId: 'co-1',
      title: 'Engineer',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });
    const b1 = position.addBullet({ content: 'Keep', ordinal: 0 });
    const b2 = position.addBullet({ content: 'Remove', ordinal: 1 });
    position.removeBullet(b2.id.value);
    expect(position.bullets).toHaveLength(1);
    expect(position.bullets[0].id.value).toBe(b1.id.value);
  });

  test('throws when bulletId not found', () => {
    const position = ResumePosition.create({
      resumeCompanyId: 'co-1',
      title: 'Engineer',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });
    expect(() => position.updateBullet('nonexistent', { content: 'X' })).toThrow('Bullet not found');
    expect(() => position.removeBullet('nonexistent')).toThrow('Bullet not found');
  });
});

describe('ResumeCompany.replaceLocations', () => {
  test('replaces all existing locations', () => {
    const company = ResumeCompany.create(makeProps());
    expect(company.locations).toHaveLength(1);
    company.replaceLocations([new ResumeLocation('San Francisco, CA', 0), new ResumeLocation('Remote', 1)]);
    expect(company.locations).toHaveLength(2);
    expect(company.locations[0].label).toBe('San Francisco, CA');
    expect(company.locations[1].label).toBe('Remote');
  });

  test('works with empty array (clears locations)', () => {
    const company = ResumeCompany.create(makeProps());
    company.replaceLocations([]);
    expect(company.locations).toHaveLength(0);
  });
});

describe('ResumeBullet', () => {
  test('create generates id and timestamps', () => {
    const bullet = ResumeBullet.create({
      resumePositionId: 'position-1',
      content: 'Shipped feature X',
      ordinal: 2
    });

    expect(bullet.resumePositionId).toBe('position-1');
    expect(bullet.content).toBe('Shipped feature X');
    expect(bullet.ordinal).toBe(2);
    expect(bullet.createdAt).toBeInstanceOf(Date);
  });
});
