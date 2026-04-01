import { describe, expect, test } from 'bun:test';
import {
  Headline,
  HeadlineId,
  type HeadlineRepository,
  Tag,
  TagDimension,
  TagId,
  type TagRepository
} from '@tailoredin/domain';
import { UpdateHeadline } from '../../../src/use-cases/headline/UpdateHeadline.js';

const NOW = new Date('2025-01-01');

function makeTag(name: string, dimension: TagDimension): Tag {
  return new Tag({
    id: TagId.generate(),
    name,
    dimension,
    createdAt: NOW
  });
}

function makeHeadline(label: string, tags: Tag[] = []): Headline {
  return new Headline({
    id: HeadlineId.generate(),
    profileId: 'profile-1',
    label,
    summaryText: 'Original summary',
    roleTags: tags,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockHeadlineRepo(headline?: Headline, onSave?: (h: Headline) => void): HeadlineRepository {
  return {
    findByIdOrFail: async (id: string) => {
      if (!headline || headline.id.value !== id) throw new Error(`Headline not found: ${id}`);
      return headline;
    },
    findAll: async () => (headline ? [headline] : []),
    save: async (h: Headline) => {
      onSave?.(h);
    },
    delete: async () => {}
  };
}

function mockTagRepo(tags: Tag[]): TagRepository {
  return {
    findByIdOrFail: async (id: string) => {
      const tag = tags.find(t => t.id.value === id);
      if (!tag) throw new Error(`Tag not found: ${id}`);
      return tag;
    },
    findByNameAndDimension: async () => null,
    findAllByDimension: async () => [],
    findAll: async () => tags,
    save: async () => {},
    delete: async () => {}
  };
}

describe('UpdateHeadline', () => {
  test('updates label, summaryText, and roleTags', async () => {
    const existingTag = makeTag('backend', TagDimension.ROLE);
    const newTag = makeTag('frontend', TagDimension.ROLE);
    const headline = makeHeadline('Old Label', [existingTag]);
    let saved: Headline | undefined;

    const useCase = new UpdateHeadline(
      mockHeadlineRepo(headline, h => {
        saved = h;
      }),
      mockTagRepo([existingTag, newTag])
    );

    const result = await useCase.execute({
      headlineId: headline.id.value,
      label: 'New Label',
      summaryText: 'Updated summary',
      roleTagIds: [newTag.id.value]
    });

    expect(result.isOk).toBe(true);
    if (!result.isOk) return;

    expect(result.value.id).toBe(headline.id.value);
    expect(result.value.label).toBe('New Label');
    expect(result.value.summaryText).toBe('Updated summary');
    expect(result.value.roleTags).toHaveLength(1);
    expect(result.value.roleTags[0]!.id).toBe(newTag.id.value);
    expect(result.value.roleTags[0]!.name).toBe('frontend');
    expect(saved).toBeDefined();
  });

  test('returns err when headline not found', async () => {
    const useCase = new UpdateHeadline(mockHeadlineRepo(undefined), mockTagRepo([]));

    const result = await useCase.execute({
      headlineId: 'nonexistent-id',
      label: 'New Label',
      summaryText: 'Updated summary',
      roleTagIds: []
    });

    expect(result.isOk).toBe(false);
    if (result.isOk) return;
    expect(result.error.message).toContain('nonexistent-id');
  });
});
