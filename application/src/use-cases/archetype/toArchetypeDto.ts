import type { Archetype } from '@tailoredin/domain';
import type { ArchetypeDto } from '../../dtos/ArchetypeDto.js';

export function toArchetypeDto(archetype: Archetype): ArchetypeDto {
  return {
    id: archetype.id.value,
    key: archetype.key,
    label: archetype.label,
    headlineId: archetype.headlineId,
    tagProfile: {
      roleWeights: Object.fromEntries(archetype.tagProfile.roleWeights),
      skillWeights: Object.fromEntries(archetype.tagProfile.skillWeights)
    },
    contentSelection: {
      experienceSelections: archetype.contentSelection.experienceSelections,
      projectIds: archetype.contentSelection.projectIds,
      educationIds: archetype.contentSelection.educationIds,
      skillCategoryIds: archetype.contentSelection.skillCategoryIds,
      skillItemIds: archetype.contentSelection.skillItemIds
    }
  };
}
