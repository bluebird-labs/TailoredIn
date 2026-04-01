import { type ArchetypeRepository2, err, ok, type Result } from '@tailoredin/domain';

export type DeleteArchetype2Input = { archetypeId: string };

export class DeleteArchetype2 {
  public constructor(private readonly repo: ArchetypeRepository2) {}
  public async execute(input: DeleteArchetype2Input): Promise<Result<void, Error>> {
    try { await this.repo.delete(input.archetypeId); }
    catch { return err(new Error(`Archetype not found: ${input.archetypeId}`)); }
    return ok(undefined);
  }
}
