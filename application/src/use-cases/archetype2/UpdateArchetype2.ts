import { type Archetype2, type ArchetypeRepository2, err, ok, type Result } from '@tailoredin/domain';
import type { ArchetypeDto2 } from '../../dtos/ArchetypeDto2.js';
import { toArchetypeDto2 } from './toArchetypeDto2.js';

export type UpdateArchetype2Input = {
  archetypeId: string; key: string; label: string; headlineId: string | null;
};

export class UpdateArchetype2 {
  public constructor(private readonly repo: ArchetypeRepository2) {}
  public async execute(input: UpdateArchetype2Input): Promise<Result<ArchetypeDto2, Error>> {
    let archetype: Archetype2;
    try { archetype = await this.repo.findByIdOrFail(input.archetypeId); }
    catch { return err(new Error(`Archetype not found: ${input.archetypeId}`)); }
    archetype.updateMetadata(input.key, input.label, input.headlineId);
    await this.repo.save(archetype);
    return ok(toArchetypeDto2(archetype));
  }
}
