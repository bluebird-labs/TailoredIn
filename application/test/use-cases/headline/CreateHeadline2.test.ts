import { describe, expect, test } from 'bun:test';
import {
  type Headline,
  HeadlineId,
  type HeadlineRepository,
  Tag,
  TagDimension,
  TagId,
  type TagRepository
} from '@tailoredin/domain';
import { CreateHeadline2 } from '../../../src/use-cases/headline/CreateHeadline2.js';

const NOW = new Date('2025-01-01');

function makeTag(name: string, dimension: TagDimension): Tag {
  return new Tag({
    id: TagId.generate(),
    name,
    dimension,
    createdAt: NOW
  });
}

function mockHeadlineRepo(onSave?: (h: Headline) => void): HeadlineRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
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

describe('CreateHeadline2', () => {
  test('creates headline without tags and returns DTO with generated id', async () => {
    let saved: Headline | undefined;

    const useCase = new CreateHeadline2(
      mockHeadlineRepo(h => {
        saved = h;
      }),
      mockTagRepo([])
    );

    const dto = await useCase.execute({
      profileId: 'profile-1',
      label: 'Senior Engineer',
      summaryText: 'Full-stack engineer with 10 years of experience',
      roleTagIds: []
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.label).toBe('Senior Engineer');
    expect(dto.summaryText).toBe('Full-stack engineer with 10 years of experience');
    expect(dto.roleTags).toHaveLength(0);
    expect(saved).toBeDefined();
  });

  test('creates headline with role tags and maps them to DTO', async () => {
    const tag1 = makeTag('frontend', TagDimension.ROLE);
    const tag2 = makeTag('backend', TagDimension.ROLE);
    let saved: Headline | undefined;

    const useCase = new CreateHeadline2(
      mockHeadlineRepo(h => {
        saved = h;
      }),
      mockTagRepo([tag1, tag2])
    );

    const dto = await useCase.execute({
      profileId: 'profile-1',
      label: 'Full-Stack Engineer',
      summaryText: 'Building end-to-end solutions',
      roleTagIds: [tag1.id.value, tag2.id.value]
    });

    expect(dto.roleTags).toHaveLength(2);
    expect(dto.roleTags[0]!.id).toBe(tag1.id.value);
    expect(dto.roleTags[0]!.name).toBe('frontend');
    expect(dto.roleTags[0]!.dimension).toBe('ROLE');
    expect(dto.roleTags[1]!.id).toBe(tag2.id.value);
    expect(saved).toBeDefined();
    expect(saved!.roleTags).toHaveLength(2);
  });
});
