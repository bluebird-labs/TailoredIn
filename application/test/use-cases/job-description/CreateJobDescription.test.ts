import {
  type JobDescription,
  type JobDescriptionRepository,
  JobLevel,
  JobSource,
  LocationType
} from '@tailoredin/domain';
import { CreateJobDescription } from '../../../src/use-cases/job-description/CreateJobDescription.js';

function mockJobDescriptionRepo(onSave?: (jd: JobDescription) => void): JobDescriptionRepository {
  return {
    findById: async () => null,
    findByCompanyId: async () => [],
    save: async (jd: JobDescription) => {
      onSave?.(jd);
    },
    delete: async () => {}
  };
}

describe('CreateJobDescription', () => {
  test('creates job description with required fields', async () => {
    let saved: JobDescription | undefined;

    const useCase = new CreateJobDescription(
      mockJobDescriptionRepo(jd => {
        saved = jd;
      })
    );

    const dto = await useCase.execute({
      companyId: 'company-1',
      title: 'Senior Engineer',
      description: 'Build great things',
      source: JobSource.LINKEDIN
    });

    expect(typeof dto.id).toBe('string');
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.companyId).toBe('company-1');
    expect(dto.title).toBe('Senior Engineer');
    expect(dto.description).toBe('Build great things');
    expect(dto.source).toBe('linkedin');
    expect(dto.salaryRange).toBeNull();
    expect(dto.level).toBe(JobLevel.UNKNOWN);
    expect(dto.locationType).toBe(LocationType.UNKNOWN);
    expect(typeof dto.createdAt).toBe('string');
    expect(saved).toBeDefined();
  });

  test('creates job description with salary range', async () => {
    const useCase = new CreateJobDescription(mockJobDescriptionRepo());

    const dto = await useCase.execute({
      companyId: 'company-1',
      title: 'Staff Engineer',
      description: 'Lead platform',
      source: JobSource.GREENHOUSE,
      salaryMin: 150000,
      salaryMax: 200000,
      salaryCurrency: 'USD'
    });

    expect(dto.salaryRange).toEqual({
      min: 150000,
      max: 200000,
      currency: 'USD'
    });
  });
});
