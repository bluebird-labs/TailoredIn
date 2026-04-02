import { type Archetype, type ArchetypeRepository, err, ok, type Result } from '@tailoredin/domain';
import type { ArchetypeDto } from '../../dtos/ArchetypeDto.js';
import { toArchetypeDto } from './toArchetypeDto.js';

export type UpdateArchetypeInput = {
  archetypeId: string;
  key: string;
  label: string;
  headlineId: string | null;
  headlineText: string;
};

export class UpdateArchetype {
  public constructor(private readonly repo: ArchetypeRepository) {}
  public async execute(input: UpdateArchetypeInput): Promise<Result<ArchetypeDto, Error>> {
    let archetype: Archetype;
    try {
      archetype = await this.repo.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }
    archetype.updateMetadata(input.key, input.label, input.headlineId, input.headlineText);
    await this.repo.save(archetype);
    return ok(toArchetypeDto(archetype));
  }
}
