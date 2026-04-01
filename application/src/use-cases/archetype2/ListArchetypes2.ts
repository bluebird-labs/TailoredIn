import type { ArchetypeRepository2 } from '@tailoredin/domain';
import type { ArchetypeDto2 } from '../../dtos/ArchetypeDto2.js';
import { toArchetypeDto2 } from './toArchetypeDto2.js';

export class ListArchetypes2 {
  public constructor(private readonly repo: ArchetypeRepository2) {}
  public async execute(): Promise<ArchetypeDto2[]> {
    const archetypes = await this.repo.findAll();
    return archetypes.map(toArchetypeDto2);
  }
}
