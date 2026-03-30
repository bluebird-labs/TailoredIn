import {
  type ArchetypeConfig,
  type ArchetypeConfigRepository,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection,
  err,
  ok,
  type Result
} from '@tailoredin/domain';

export type SetArchetypeSkillsInput = {
  archetypeId: string;
  categorySelections: { categoryId: string; ordinal: number }[];
  itemSelections: { itemId: string; ordinal: number }[];
};

export class SetArchetypeSkills {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: SetArchetypeSkillsInput): Promise<Result<void, Error>> {
    let config: ArchetypeConfig;
    try {
      config = await this.archetypeRepository.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }

    config.replaceSkillSelections(
      input.categorySelections.map(s => new ArchetypeSkillCategorySelection(s.categoryId, s.ordinal)),
      input.itemSelections.map(s => new ArchetypeSkillItemSelection(s.itemId, s.ordinal))
    );

    await this.archetypeRepository.save(config);
    return ok(undefined);
  }
}
