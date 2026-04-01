import { type Archetype2, type ArchetypeRepository2, ContentSelection, err, ok, type Result } from '@tailoredin/domain';
import type { ArchetypeDto2, ContentSelectionDto } from '../../dtos/ArchetypeDto2.js';
import { toArchetypeDto2 } from './toArchetypeDto2.js';

export type SetArchetypeContent2Input = { archetypeId: string; contentSelection: ContentSelectionDto };

export class SetArchetypeContent2 {
  public constructor(private readonly repo: ArchetypeRepository2) {}
  public async execute(input: SetArchetypeContent2Input): Promise<Result<ArchetypeDto2, Error>> {
    let archetype: Archetype2;
    try { archetype = await this.repo.findByIdOrFail(input.archetypeId); }
    catch { return err(new Error(`Archetype not found: ${input.archetypeId}`)); }
    archetype.replaceContentSelection(new ContentSelection(input.contentSelection));
    await this.repo.save(archetype);
    return ok(toArchetypeDto2(archetype));
  }
}
