import { type Archetype2, type ArchetypeRepository2, err, ok, type Result, TagProfile } from '@tailoredin/domain';
import type { ArchetypeDto2 } from '../../dtos/ArchetypeDto2.js';
import { toArchetypeDto2 } from './toArchetypeDto2.js';

export type SetArchetypeTagProfile2Input = {
  archetypeId: string;
  roleWeights: Record<string, number>;
  skillWeights: Record<string, number>;
};

export class SetArchetypeTagProfile2 {
  public constructor(private readonly repo: ArchetypeRepository2) {}
  public async execute(input: SetArchetypeTagProfile2Input): Promise<Result<ArchetypeDto2, Error>> {
    let archetype: Archetype2;
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
    return ok(toArchetypeDto2(archetype));
  }
}
