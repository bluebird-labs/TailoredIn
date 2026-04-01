import { type Archetype, type ArchetypeRepository, err, ok, type Result, TagProfile } from '@tailoredin/domain';
import type { ArchetypeDto } from '../../dtos/ArchetypeDto.js';
import { toArchetypeDto } from './toArchetypeDto.js';

export type SetArchetypeTagProfileInput = {
  archetypeId: string;
  roleWeights: Record<string, number>;
  skillWeights: Record<string, number>;
};

export class SetArchetypeTagProfile {
  public constructor(private readonly repo: ArchetypeRepository) {}
  public async execute(input: SetArchetypeTagProfileInput): Promise<Result<ArchetypeDto, Error>> {
    let archetype: Archetype;
    try {
      archetype = await this.repo.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }
    archetype.replaceTagProfile(
      new TagProfile({
        roleWeights: new Map(Object.entries(input.roleWeights)),
        skillWeights: new Map(Object.entries(input.skillWeights))
      })
    );
    await this.repo.save(archetype);
    return ok(toArchetypeDto(archetype));
  }
}
