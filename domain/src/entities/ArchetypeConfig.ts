import { AggregateRoot } from '../AggregateRoot.js';
import type { Archetype } from '../value-objects/Archetype.js';
import { ArchetypeConfigId } from '../value-objects/ArchetypeConfigId.js';
import type {
  ArchetypeEducationSelection,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection
} from '../value-objects/ArchetypeSelections.js';
import type { ArchetypePosition } from './ArchetypePosition.js';

export type ArchetypeConfigCreateProps = {
  userId: string;
  archetypeKey: Archetype;
  archetypeLabel: string;
  archetypeDescription: string | null;
  headlineId: string;
  socialNetworks: string[];
  positions: ArchetypePosition[];
  educationSelections: ArchetypeEducationSelection[];
  skillCategorySelections: ArchetypeSkillCategorySelection[];
  skillItemSelections: ArchetypeSkillItemSelection[];
};

export class ArchetypeConfig extends AggregateRoot<ArchetypeConfigId> {
  public readonly userId: string;
  public archetypeKey: Archetype;
  public archetypeLabel: string;
  public archetypeDescription: string | null;
  public headlineId: string;
  public socialNetworks: string[];
  public readonly positions: ArchetypePosition[];
  public readonly educationSelections: ArchetypeEducationSelection[];
  public readonly skillCategorySelections: ArchetypeSkillCategorySelection[];
  public readonly skillItemSelections: ArchetypeSkillItemSelection[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ArchetypeConfigId;
    userId: string;
    archetypeKey: Archetype;
    archetypeLabel: string;
    archetypeDescription: string | null;
    headlineId: string;
    socialNetworks: string[];
    positions: ArchetypePosition[];
    educationSelections: ArchetypeEducationSelection[];
    skillCategorySelections: ArchetypeSkillCategorySelection[];
    skillItemSelections: ArchetypeSkillItemSelection[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.userId = props.userId;
    this.archetypeKey = props.archetypeKey;
    this.archetypeLabel = props.archetypeLabel;
    this.archetypeDescription = props.archetypeDescription;
    this.headlineId = props.headlineId;
    this.socialNetworks = props.socialNetworks;
    this.positions = props.positions;
    this.educationSelections = props.educationSelections;
    this.skillCategorySelections = props.skillCategorySelections;
    this.skillItemSelections = props.skillItemSelections;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public replacePositions(positions: ArchetypePosition[]): void {
    this.positions.splice(0, this.positions.length, ...positions);
    this.updatedAt = new Date();
  }

  public replaceEducationSelections(selections: ArchetypeEducationSelection[]): void {
    this.educationSelections.splice(0, this.educationSelections.length, ...selections);
    this.updatedAt = new Date();
  }

  public replaceSkillSelections(
    categories: ArchetypeSkillCategorySelection[],
    items: ArchetypeSkillItemSelection[]
  ): void {
    this.skillCategorySelections.splice(0, this.skillCategorySelections.length, ...categories);
    this.skillItemSelections.splice(0, this.skillItemSelections.length, ...items);
    this.updatedAt = new Date();
  }

  public static create(props: ArchetypeConfigCreateProps): ArchetypeConfig {
    const now = new Date();
    return new ArchetypeConfig({
      id: ArchetypeConfigId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
