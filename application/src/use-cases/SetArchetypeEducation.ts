import {
  type ArchetypeConfig,
  type ArchetypeConfigRepository,
  ArchetypeEducationSelection,
  err,
  ok,
  type Result
} from '@tailoredin/domain';

export type SetArchetypeEducationInput = {
  archetypeId: string;
  selections: { educationId: string; ordinal: number }[];
};

export class SetArchetypeEducation {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: SetArchetypeEducationInput): Promise<Result<void, Error>> {
    let config: ArchetypeConfig;
    try {
      config = await this.archetypeRepository.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }

    config.replaceEducationSelections(
      input.selections.map(s => new ArchetypeEducationSelection(s.educationId, s.ordinal))
    );

    await this.archetypeRepository.save(config);
    return ok(undefined);
  }
}
