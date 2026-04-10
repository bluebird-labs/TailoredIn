import { describe, expect, it, mock } from 'bun:test';
import { Experience, type ExperienceRepository } from '@tailoredin/domain';
import { UpdateExperience } from '../../../src/use-cases/experience/UpdateExperience.js';

function makeExperience() {
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
    ordinal: 0
  });
  exp.addAccomplishment({ title: 'Old one', narrative: 'Old narrative', ordinal: 0 });
  return exp;
}

function mockRepo(exp: Experience) {
  return {
    findByIdOrFail: mock(async () => exp),
    findAll: mock(async () => []),
    save: mock(async () => {}),
    delete: mock(async () => {})
  } as unknown as ExperienceRepository;
}

const baseInput = {
  experienceId: 'ignored',
  title: 'Senior Engineer',
  companyName: 'ACME',
  companyWebsite: null,
  companyAccent: null,
  location: 'Remote',
  startDate: '2020-01',
  endDate: '2024-01',
  summary: null,
  ordinal: 0
};

describe('UpdateExperience', () => {
  it('returns updated experience dto', async () => {
    const exp = makeExperience();
    const uc = new UpdateExperience(mockRepo(exp));
    const result = await uc.execute({ ...baseInput, accomplishments: [] });
    expect(result.isOk).toBe(true);
    if (result.isOk) expect(result.value.title).toBe('Senior Engineer');
  });

  it('keeps existing accomplishment when passed with its id', async () => {
    const exp = makeExperience();
    const accId = exp.accomplishments[0].id;
    const uc = new UpdateExperience(mockRepo(exp));
    const result = await uc.execute({
      ...baseInput,
      accomplishments: [{ id: accId, title: 'Old one', narrative: 'Old narrative', ordinal: 0 }]
    });
    expect(result.isOk).toBe(true);
    if (result.isOk) expect(result.value.accomplishments).toHaveLength(1);
  });

  it('deletes accomplishment when omitted from list', async () => {
    const exp = makeExperience();
    const uc = new UpdateExperience(mockRepo(exp));
    const result = await uc.execute({ ...baseInput, accomplishments: [] });
    expect(result.isOk).toBe(true);
    if (result.isOk) expect(result.value.accomplishments).toHaveLength(0);
  });

  it('adds new accomplishment when id is null', async () => {
    const exp = makeExperience();
    const accId = exp.accomplishments[0].id;
    const uc = new UpdateExperience(mockRepo(exp));
    const result = await uc.execute({
      ...baseInput,
      accomplishments: [
        { id: accId, title: 'Old one', narrative: 'Old narrative', ordinal: 0 },
        { id: null, title: 'New one', narrative: 'New narrative', ordinal: 1 }
      ]
    });
    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.accomplishments).toHaveLength(2);
      expect(result.value.accomplishments[1].title).toBe('New one');
    }
  });

  it('calls repository.save once', async () => {
    const exp = makeExperience();
    const repo = mockRepo(exp);
    const uc = new UpdateExperience(repo);
    await uc.execute({ ...baseInput, accomplishments: [] });
    expect((repo.save as ReturnType<typeof mock>).mock.calls).toHaveLength(1);
  });

  it('returns NOT_FOUND error when experience does not exist', async () => {
    const { EntityNotFoundError } = await import('@tailoredin/domain');
    const repo = {
      findByIdOrFail: mock(async () => {
        throw new EntityNotFoundError('Experience', 'x');
      }),
      findAll: mock(async () => []),
      save: mock(async () => {}),
      delete: mock(async () => {})
    } as unknown as ExperienceRepository;
    const uc = new UpdateExperience(repo);
    const result = await uc.execute({ ...baseInput, accomplishments: [] });
    expect(result.isOk).toBe(false);
  });
});
