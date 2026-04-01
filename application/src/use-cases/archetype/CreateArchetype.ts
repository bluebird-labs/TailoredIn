import { Archetype, type ArchetypeRepository } from '@tailoredin/domain';
import type { ArchetypeDto } from '../../dtos/ArchetypeDto.js';
import { toArchetypeDto } from './toArchetypeDto.js';

export type CreateArchetypeInput = { profileId: string; key: string; label: string };

export class CreateArchetype {
  public constructor(private readonly repo: ArchetypeRepository) {}
  public async execute(input: CreateArchetypeInput): Promise<ArchetypeDto> {
    const archetype = Archetype.create(input);
    await this.repo.save(archetype);
    return toArchetypeDto(archetype);
  }
}
