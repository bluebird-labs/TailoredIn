import type { ArchetypeRepository } from '@tailoredin/domain';
import type { ArchetypeDto } from '../../dtos/ArchetypeDto.js';
import { toArchetypeDto } from './toArchetypeDto.js';

export class ListArchetypes {
  public constructor(private readonly repo: ArchetypeRepository) {}
  public async execute(): Promise<ArchetypeDto[]> {
    const archetypes = await this.repo.findAll();
    return archetypes.map(toArchetypeDto);
  }
}
