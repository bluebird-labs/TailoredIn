import { describe, expect, test } from 'bun:test';
import { ResumeBullet } from '../../src/entities/ResumeBullet.js';
import { ResumeCompany } from '../../src/entities/ResumeCompany.js';
import { ResumeCompanyId } from '../../src/value-objects/ResumeCompanyId.js';
import { ResumeLocation } from '../../src/value-objects/ResumeLocation.js';

const makeProps = () => {
  const bullet = ResumeBullet.create({ resumeCompanyId: 'temp', content: 'Built APIs', ordinal: 0 });
  const location = new ResumeLocation('New York, NY', 0);
  return {
    userId: 'user-1',
    companyName: 'Acme Corp',
    companyMention: 'acquired',
    websiteUrl: 'https://acme.com',
    businessDomain: 'B2B, SaaS',
    joinedAt: '2020-01',
    leftAt: '2023-06',
    promotedAt: '2021-03',
    locations: [location],
    bullets: [bullet]
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
    expect(company.joinedAt).toBe('2020-01');
    expect(company.leftAt).toBe('2023-06');
    expect(company.promotedAt).toBe('2021-03');
    expect(company.locations).toHaveLength(1);
    expect(company.locations[0].label).toBe('New York, NY');
    expect(company.bullets).toHaveLength(1);
    expect(company.bullets[0].content).toBe('Built APIs');
    expect(company.createdAt).toBeInstanceOf(Date);
  });

  test('create handles nullable fields', () => {
    const company = ResumeCompany.create({
      ...makeProps(),
      companyMention: null,
      websiteUrl: null,
      promotedAt: null
    });

    expect(company.companyMention).toBeNull();
    expect(company.websiteUrl).toBeNull();
    expect(company.promotedAt).toBeNull();
  });

  test('equals compares by id', () => {
    const a = ResumeCompany.create(makeProps());
    const b = ResumeCompany.create(makeProps());
    expect(a.equals(b)).toBe(false);
  });
});

describe('ResumeCompany.addBullet', () => {
  test('creates a bullet with the correct resumeCompanyId', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'New bullet', ordinal: 0 });
    expect(bullet.resumeCompanyId).toBe(company.id.value);
  });

  test('pushes the bullet to the bullets array', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    company.addBullet({ content: 'First', ordinal: 0 });
    company.addBullet({ content: 'Second', ordinal: 1 });
    expect(company.bullets).toHaveLength(2);
    expect(company.bullets[1].content).toBe('Second');
  });

  test('updates updatedAt', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const before = company.updatedAt;
    company.addBullet({ content: 'New', ordinal: 0 });
    expect(company.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('returns the created bullet', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'Returned', ordinal: 5 });
    expect(bullet.content).toBe('Returned');
    expect(bullet.ordinal).toBe(5);
  });
});

describe('ResumeCompany.updateBullet', () => {
  test('updates content when provided', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'Old', ordinal: 0 });
    company.updateBullet(bullet.id.value, { content: 'New' });
    expect(bullet.content).toBe('New');
  });

  test('updates ordinal when provided', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'Test', ordinal: 0 });
    company.updateBullet(bullet.id.value, { ordinal: 5 });
    expect(bullet.ordinal).toBe(5);
  });

  test('updates bullet.updatedAt', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'Test', ordinal: 0 });
    const before = bullet.updatedAt;
    company.updateBullet(bullet.id.value, { content: 'Changed' });
    expect(bullet.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('updates company.updatedAt', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'Test', ordinal: 0 });
    const before = company.updatedAt;
    company.updateBullet(bullet.id.value, { content: 'Changed' });
    expect(company.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('throws when bulletId not found', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    expect(() => company.updateBullet('nonexistent', { content: 'X' })).toThrow('Bullet not found');
  });
});

describe('ResumeCompany.removeBullet', () => {
  test('removes the correct bullet from the array', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const b1 = company.addBullet({ content: 'Keep', ordinal: 0 });
    const b2 = company.addBullet({ content: 'Remove', ordinal: 1 });
    company.removeBullet(b2.id.value);
    expect(company.bullets).toHaveLength(1);
    expect(company.bullets[0].id.value).toBe(b1.id.value);
  });

  test('updates updatedAt', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    const bullet = company.addBullet({ content: 'Test', ordinal: 0 });
    const before = company.updatedAt;
    company.removeBullet(bullet.id.value);
    expect(company.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('throws when bulletId not found', () => {
    const company = ResumeCompany.create({ ...makeProps(), bullets: [] });
    expect(() => company.removeBullet('nonexistent')).toThrow('Bullet not found');
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

  test('updates updatedAt', () => {
    const company = ResumeCompany.create(makeProps());
    const before = company.updatedAt;
    company.replaceLocations([new ResumeLocation('London, UK', 0)]);
    expect(company.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('works with empty array (clears locations)', () => {
    const company = ResumeCompany.create(makeProps());
    expect(company.locations).toHaveLength(1);
    company.replaceLocations([]);
    expect(company.locations).toHaveLength(0);
  });
});

describe('ResumeBullet', () => {
  test('create generates id and timestamps', () => {
    const bullet = ResumeBullet.create({
      resumeCompanyId: 'company-1',
      content: 'Shipped feature X',
      ordinal: 2
    });

    expect(bullet.resumeCompanyId).toBe('company-1');
    expect(bullet.content).toBe('Shipped feature X');
    expect(bullet.ordinal).toBe(2);
    expect(bullet.createdAt).toBeInstanceOf(Date);
  });
});
