import { describe, expect, test } from 'bun:test';
import { Tag, TagDimension, TagId, type TagRepository } from '@tailoredin/domain';
import { ListTags } from '../../../src/use-cases/tag/ListTags.js';

const NOW = new Date('2025-01-01');

function makeTag(name: string, dimension: TagDimension): Tag {
  return new Tag({
    id: TagId.generate(),
    name,
    dimension,
    createdAt: NOW
  });
}

function mockRepo(tags: Tag[]): TagRepository {
  return {
    findByIdOrFail: async () => tags[0]!,
    findByNameAndDimension: async () => null,
    findAllByDimension: async (dimension: TagDimension) => tags.filter(t => t.dimension === dimension),
    findAll: async () => tags,
    save: async () => {},
    delete: async () => {}
  };
}

describe('ListTags', () => {
  test('returns all tags when no dimension specified', async () => {
    const tags = [
      makeTag('frontend', TagDimension.SKILL),
      makeTag('engineer', TagDimension.ROLE),
      makeTag('backend', TagDimension.SKILL)
    ];
    const useCase = new ListTags(mockRepo(tags));

    const result = await useCase.execute({});

    expect(result).toHaveLength(3);
    expect(result[0]!.name).toBe('frontend');
    expect(result[1]!.name).toBe('engineer');
    expect(result[2]!.name).toBe('backend');
  });

  test('returns tags filtered by dimension', async () => {
    const tags = [
      makeTag('frontend', TagDimension.SKILL),
      makeTag('engineer', TagDimension.ROLE),
      makeTag('backend', TagDimension.SKILL)
    ];
    const useCase = new ListTags(mockRepo(tags));

    const result = await useCase.execute({ dimension: 'ROLE' });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('engineer');
    expect(result[0]!.dimension).toBe('ROLE');
  });

  test('maps tags to TagDto shape', async () => {
    const tag = makeTag('typescript', TagDimension.SKILL);
    const useCase = new ListTags(mockRepo([tag]));

    const result = await useCase.execute({});

    expect(result[0]).toMatchObject({
      id: tag.id.value,
      name: 'typescript',
      dimension: 'SKILL'
    });
  });

  test('returns empty array when no tags', async () => {
    const useCase = new ListTags(mockRepo([]));

    const result = await useCase.execute({});

    expect(result).toHaveLength(0);
  });
});
