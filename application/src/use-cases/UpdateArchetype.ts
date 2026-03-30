import { type ArchetypeConfig, type ArchetypeConfigRepository, err, ok, type Result } from '@tailoredin/domain';

export type UpdateArchetypeInput = {
  archetypeId: string;
  archetypeLabel?: string;
  archetypeDescription?: string | null;
  headlineId?: string;
  socialNetworks?: string[];
};

export class UpdateArchetype {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: UpdateArchetypeInput): Promise<Result<void, Error>> {
    let config: ArchetypeConfig;
    try {
      config = await this.archetypeRepository.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }

    if (input.archetypeLabel !== undefined) config.archetypeLabel = input.archetypeLabel;
    if (input.archetypeDescription !== undefined) config.archetypeDescription = input.archetypeDescription;
    if (input.headlineId !== undefined) config.headlineId = input.headlineId;
    if (input.socialNetworks !== undefined) config.socialNetworks = input.socialNetworks;
    config.updatedAt = new Date();

    await this.archetypeRepository.save(config);
    return ok(undefined);
  }
}
