import { describe, expect, test } from 'bun:test';
import type { Archetype, ArchetypeRepository } from '@tailoredin/domain';
import { CreateArchetype } from '../../../src/use-cases/archetype/CreateArchetype.js';

function mockRepo(onSave?: (a: Archetype) => void): ArchetypeRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
    save: async (a: Archetype) => {
      onSave?.(a);
    },
    delete: async () => {}
  };
}

describe('CreateArchetype', () => {
  test('creates archetype with key + label, returns DTO with generated id', async () => {
    let saved: Archetype | undefined;
    const useCase = new CreateArchetype(
      mockRepo(a => {
        saved = a;
      })
    );
    const dto = await useCase.execute({ profileId: 'profile-1', key: 'fullstack-lead', label: 'Full-Stack Lead' });
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.key).toBe('fullstack-lead');
    expect(dto.label).toBe('Full-Stack Lead');
    expect(dto.headlineId).toBeNull();
    expect(dto.tagProfile.roleWeights).toEqual({});
    expect(dto.contentSelection.experienceSelections).toEqual([]);
    expect(saved).toBeDefined();
  });
});
