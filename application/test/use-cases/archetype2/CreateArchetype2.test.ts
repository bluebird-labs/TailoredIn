import { describe, expect, test } from 'bun:test';
import { type Archetype2, type ArchetypeRepository2 } from '@tailoredin/domain';
import { CreateArchetype2 } from '../../../src/use-cases/archetype2/CreateArchetype2.js';

function mockRepo(onSave?: (a: Archetype2) => void): ArchetypeRepository2 {
  return {
    findByIdOrFail: async () => { throw new Error('Not implemented'); },
    findAll: async () => [],
    save: async (a: Archetype2) => { onSave?.(a); },
    delete: async () => {}
  };
}

describe('CreateArchetype2', () => {
  test('creates archetype with key + label, returns DTO with generated id', async () => {
    let saved: Archetype2 | undefined;
    const useCase = new CreateArchetype2(mockRepo(a => { saved = a; }));
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
