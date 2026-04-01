import { type ArchetypeRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteArchetypeInput = { archetypeId: string };

export class DeleteArchetype {
  public constructor(private readonly repo: ArchetypeRepository) {}
  public async execute(input: DeleteArchetypeInput): Promise<Result<void, Error>> {
    try {
      await this.repo.delete(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }
    return ok(undefined);
  }
}
