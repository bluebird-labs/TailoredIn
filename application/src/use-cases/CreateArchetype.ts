import { type Archetype, ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import type { ArchetypeConfigDto } from '../dtos/ArchetypeConfigDto.js';

export type CreateArchetypeInput = {
  userId: string;
  archetypeKey: Archetype;
  archetypeLabel: string;
  archetypeDescription: string | null;
  headlineId: string;
  socialNetworks: string[];
};

export class CreateArchetype {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: CreateArchetypeInput): Promise<ArchetypeConfigDto> {
    const config = ArchetypeConfig.create({
      userId: input.userId,
      archetypeKey: input.archetypeKey,
      archetypeLabel: input.archetypeLabel,
      archetypeDescription: input.archetypeDescription,
      headlineId: input.headlineId,
      socialNetworks: input.socialNetworks,
      positions: [],
      educationSelections: [],
      skillCategorySelections: [],
      skillItemSelections: []
    });
    await this.archetypeRepository.save(config);
    return {
      id: config.id.value,
      archetypeKey: config.archetypeKey,
      archetypeLabel: config.archetypeLabel,
      archetypeDescription: config.archetypeDescription,
      headlineId: config.headlineId,
      socialNetworks: config.socialNetworks,
      positions: [],
      educationSelections: [],
      skillCategorySelections: [],
      skillItemSelections: []
    };
  }
}
