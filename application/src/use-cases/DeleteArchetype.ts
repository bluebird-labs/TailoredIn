import { type ArchetypeConfigRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteArchetypeInput = { archetypeId: string };

export class DeleteArchetype {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: DeleteArchetypeInput): Promise<Result<void, Error>> {
    try {
      await this.archetypeRepository.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }
    await this.archetypeRepository.delete(input.archetypeId);
    return ok(undefined);
  }
}
