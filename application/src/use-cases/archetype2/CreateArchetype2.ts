import { Archetype2, type ArchetypeRepository2 } from '@tailoredin/domain';
import type { ArchetypeDto2 } from '../../dtos/ArchetypeDto2.js';
import { toArchetypeDto2 } from './toArchetypeDto2.js';

export type CreateArchetype2Input = { profileId: string; key: string; label: string };

export class CreateArchetype2 {
  public constructor(private readonly repo: ArchetypeRepository2) {}
  public async execute(input: CreateArchetype2Input): Promise<ArchetypeDto2> {
    const archetype = Archetype2.create(input);
    await this.repo.save(archetype);
    return toArchetypeDto2(archetype);
  }
}
