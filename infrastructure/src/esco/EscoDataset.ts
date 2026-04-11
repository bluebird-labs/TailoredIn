import type { BroaderRelationOccPillar } from './schemas/broader-relation-occ-pillar.js';
import type { BroaderRelationSkillPillar } from './schemas/broader-relation-skill-pillar.js';
import type { ConceptScheme } from './schemas/concept-scheme.js';
import type { Dictionary } from './schemas/dictionary.js';
import type { GreenShareOccupation } from './schemas/green-share-occupation.js';
import type { ISCOGroup } from './schemas/isco-group.js';
import type { Occupation } from './schemas/occupation.js';
import type { OccupationCollection } from './schemas/occupation-collection.js';
import type { OccupationSkillRelation } from './schemas/occupation-skill-relation.js';
import type { Skill } from './schemas/skill.js';
import type { SkillCollection } from './schemas/skill-collection.js';
import type { SkillGroup } from './schemas/skill-group.js';
import type { SkillSkillRelation } from './schemas/skill-skill-relation.js';
import type { SkillsHierarchy } from './schemas/skills-hierarchy.js';

export interface EscoDataset {
  readonly skills: readonly Skill[];
  readonly occupations: readonly Occupation[];
  readonly iscoGroups: readonly ISCOGroup[];
  readonly skillGroups: readonly SkillGroup[];
  readonly occupationSkillRelations: readonly OccupationSkillRelation[];
  readonly skillSkillRelations: readonly SkillSkillRelation[];
  readonly broaderRelationsOccPillar: readonly BroaderRelationOccPillar[];
  readonly broaderRelationsSkillPillar: readonly BroaderRelationSkillPillar[];
  readonly conceptSchemes: readonly ConceptScheme[];
  readonly dictionary: readonly Dictionary[];
  readonly skillsHierarchy: readonly SkillsHierarchy[];
  readonly greenShareOcc: readonly GreenShareOccupation[];
  readonly greenSkillsCollection: readonly SkillCollection[];
  readonly digitalSkillsCollection: readonly SkillCollection[];
  readonly digCompSkillsCollection: readonly SkillCollection[];
  readonly transversalSkillsCollection: readonly SkillCollection[];
  readonly languageSkillsCollection: readonly SkillCollection[];
  readonly researchSkillsCollection: readonly SkillCollection[];
  readonly researchOccupationsCollection: readonly OccupationCollection[];
}
