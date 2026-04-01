import type { Archetype2 } from '@tailoredin/domain';
import type { ArchetypeDto2 } from '../../dtos/ArchetypeDto2.js';

export function toArchetypeDto2(archetype: Archetype2): ArchetypeDto2 {
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
