import { describe, expect, test } from 'bun:test';
import { ResumeBullet } from '../../src/entities/ResumeBullet.js';
import { ResumeCompany } from '../../src/entities/ResumeCompany.js';
import { ResumeCompanyId } from '../../src/value-objects/ResumeCompanyId.js';
import { ResumeLocation } from '../../src/value-objects/ResumeLocation.js';

describe('ResumeCompany', () => {
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
