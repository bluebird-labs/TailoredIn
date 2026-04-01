import { type Archetype, type ArchetypeRepository, ContentSelection, err, ok, type Result } from '@tailoredin/domain';
import type { ArchetypeDto, ContentSelectionDto } from '../../dtos/ArchetypeDto.js';
import { toArchetypeDto } from './toArchetypeDto.js';

export type SetArchetypeContentInput = { archetypeId: string; contentSelection: ContentSelectionDto };

export class SetArchetypeContent {
  public constructor(private readonly repo: ArchetypeRepository) {}
  public async execute(input: SetArchetypeContentInput): Promise<Result<ArchetypeDto, Error>> {
    let archetype: Archetype;
    try {
      archetype = await this.repo.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }
    archetype.replaceContentSelection(new ContentSelection(input.contentSelection));
    await this.repo.save(archetype);
    return ok(toArchetypeDto(archetype));
  }
}
