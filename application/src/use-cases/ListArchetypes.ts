import type { ArchetypeConfig, ArchetypeConfigRepository } from '@tailoredin/domain';
import type { ArchetypeConfigDto } from '../dtos/ArchetypeConfigDto.js';

export type ListArchetypesInput = { userId: string };

export class ListArchetypes {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: ListArchetypesInput): Promise<ArchetypeConfigDto[]> {
    const configs = await this.archetypeRepository.findAllByUserId(input.userId);
    return configs.map(toArchetypeDto);
  }
}

function toArchetypeDto(config: ArchetypeConfig): ArchetypeConfigDto {
  return {
    id: config.id.value,
    archetypeKey: config.archetypeKey,
    archetypeLabel: config.archetypeLabel,
    archetypeDescription: config.archetypeDescription,
    headlineId: config.headlineId,
    socialNetworks: config.socialNetworks,
    positions: config.positions.map(p => ({
      id: p.id.value,
      resumeCompanyId: p.resumeCompanyId,
      jobTitle: p.jobTitle,
      displayCompanyName: p.displayCompanyName,
      locationLabel: p.locationLabel,
      startDate: p.startDate,
      endDate: p.endDate,
      roleSummary: p.roleSummary,
      ordinal: p.ordinal,
      bullets: p.bullets.map(b => ({ bulletId: b.bulletId, ordinal: b.ordinal }))
    })),
    educationSelections: config.educationSelections.map(e => ({ educationId: e.educationId, ordinal: e.ordinal })),
    skillCategorySelections: config.skillCategorySelections.map(s => ({
      categoryId: s.categoryId,
      ordinal: s.ordinal
    })),
    skillItemSelections: config.skillItemSelections.map(s => ({ itemId: s.itemId, ordinal: s.ordinal }))
  };
}
