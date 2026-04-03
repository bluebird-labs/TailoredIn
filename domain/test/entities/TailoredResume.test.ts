import { describe, expect, test } from 'bun:test';
import { TailoredResume } from '../../src/entities/TailoredResume.js';
import { ContentSelection } from '../../src/value-objects/ContentSelection.js';
import { LlmProposal } from '../../src/value-objects/LlmProposal.js';

describe('TailoredResume', () => {
  const makeResume = () =>
    TailoredResume.create({ profileId: 'profile-1', jdContent: 'We are hiring a senior engineer.' });

  test('create() initialises with status=draft, empty proposals, empty contentSelection, no pdfPath', () => {
    const resume = makeResume();

    expect(resume.profileId).toBe('profile-1');
    expect(resume.jdContent).toBe('We are hiring a senior engineer.');
    expect(resume.status).toBe('draft');
    expect(resume.pdfPath).toBeNull();
    expect(resume.headlineText).toBe('');
    expect(resume.llmProposals).toBeInstanceOf(LlmProposal);
    expect(resume.llmProposals.headlineOptions).toEqual([]);
    expect(resume.contentSelection).toBeInstanceOf(ContentSelection);
    expect(resume.contentSelection.experienceSelections).toEqual([]);
    expect(resume.createdAt).toBeInstanceOf(Date);
    expect(resume.updatedAt).toBeInstanceOf(Date);
    expect(resume.id).toBeDefined();
  });

  test('create() produces a unique id each time', () => {
    const a = makeResume();
    const b = makeResume();
    expect(a.id.value).not.toBe(b.id.value);
  });

  test('finalize() sets status=finalized and pdfPath, bumps updatedAt', () => {
    const resume = makeResume();
    const before = resume.updatedAt;

    const newUpdatedAt = new Date(before.getTime() + 1);
    resume.finalize('/output/resume.pdf');

    expect(resume.status).toBe('finalized');
    expect(resume.pdfPath).toBe('/output/resume.pdf');
    expect(resume.updatedAt.getTime()).toBeGreaterThanOrEqual(newUpdatedAt.getTime() - 1);
  });

  test('finalize() does not change profileId, jdContent, or createdAt', () => {
    const resume = makeResume();
    const createdAt = resume.createdAt;

    resume.finalize('/output/resume.pdf');

    expect(resume.profileId).toBe('profile-1');
    expect(resume.jdContent).toBe('We are hiring a senior engineer.');
    expect(resume.createdAt).toBe(createdAt);
  });

  test('updateHeadline() sets headlineText and bumps updatedAt', () => {
    const resume = makeResume();
    const before = resume.updatedAt;

    const newUpdatedAt = new Date(before.getTime() + 1);
    resume.updateHeadline('Staff Software Engineer');

    expect(resume.headlineText).toBe('Staff Software Engineer');
    expect(resume.updatedAt.getTime()).toBeGreaterThanOrEqual(newUpdatedAt.getTime() - 1);
  });

  test('updateHeadline() does not affect status or contentSelection', () => {
    const resume = makeResume();

    resume.updateHeadline('Principal Engineer');

    expect(resume.status).toBe('draft');
    expect(resume.contentSelection.experienceSelections).toEqual([]);
  });

  test('replaceContentSelection() sets contentSelection and bumps updatedAt', () => {
    const resume = makeResume();
    const before = resume.updatedAt;

    const selection = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-42', bulletIds: ['b-1', 'b-2'] }],
      projectIds: [],
      educationIds: ['edu-1'],
      skillCategoryIds: [],
      skillItemIds: ['si-1']
    });

    const newUpdatedAt = new Date(before.getTime() + 1);
    resume.replaceContentSelection(selection);

    expect(resume.contentSelection).toBe(selection);
    expect(resume.contentSelection.experienceSelections[0].experienceId).toBe('exp-42');
    expect(resume.contentSelection.educationIds).toEqual(['edu-1']);
    expect(resume.updatedAt.getTime()).toBeGreaterThanOrEqual(newUpdatedAt.getTime() - 1);
  });

  test('replaceContentSelection() does not affect headlineText or status', () => {
    const resume = makeResume();
    resume.updateHeadline('Tech Lead');

    resume.replaceContentSelection(ContentSelection.empty());

    expect(resume.headlineText).toBe('Tech Lead');
    expect(resume.status).toBe('draft');
  });
});
