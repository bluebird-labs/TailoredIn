import { describe, expect, test } from 'bun:test';
import { JobDescription } from '../../src/entities/JobDescription.js';
import { JobLevel } from '../../src/value-objects/JobLevel.js';
import { JobSource } from '../../src/value-objects/JobSource.js';
import { LocationType } from '../../src/value-objects/LocationType.js';
import { SalaryRange } from '../../src/value-objects/SalaryRange.js';

describe('JobDescription', () => {
  test('creates with required fields only', () => {
    const jd = JobDescription.create({
      companyId: 'company-1',
      title: 'Senior Engineer',
      description: 'Build scalable systems',
      source: JobSource.LINKEDIN
    });

    expect(jd.id).toBeDefined();
    expect(jd.companyId).toBe('company-1');
    expect(jd.title).toBe('Senior Engineer');
    expect(jd.description).toBe('Build scalable systems');
    expect(jd.source).toBe(JobSource.LINKEDIN);
    expect(jd.url).toBeNull();
    expect(jd.location).toBeNull();
    expect(jd.salaryRange).toBeNull();
    expect(jd.level).toBeNull();
    expect(jd.locationType).toBeNull();
    expect(jd.postedAt).toBeNull();
    expect(jd.createdAt).toBeInstanceOf(Date);
    expect(jd.updatedAt).toBeInstanceOf(Date);
  });

  test('creates with all optional fields including SalaryRange', () => {
    const salary = new SalaryRange({ min: 150000, max: 200000, currency: 'USD' });
    const postedAt = new Date('2026-04-01');

    const jd = JobDescription.create({
      companyId: 'company-1',
      title: 'Staff Engineer',
      description: 'Lead platform team',
      url: 'https://example.com/jobs/1',
      location: 'San Francisco, CA',
      salaryRange: salary,
      level: JobLevel.MID_SENIOR,
      locationType: LocationType.HYBRID,
      source: JobSource.GREENHOUSE,
      postedAt
    });

    expect(jd.url).toBe('https://example.com/jobs/1');
    expect(jd.location).toBe('San Francisco, CA');
    expect(jd.salaryRange).toBeDefined();
    expect(jd.salaryRange!.min).toBe(150000);
    expect(jd.salaryRange!.max).toBe(200000);
    expect(jd.salaryRange!.currency).toBe('USD');
    expect(jd.level).toBe(JobLevel.MID_SENIOR);
    expect(jd.locationType).toBe(LocationType.HYBRID);
    expect(jd.postedAt).toEqual(postedAt);
  });
});
