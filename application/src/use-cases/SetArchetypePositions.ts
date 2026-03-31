import {
  type ArchetypeConfig,
  type ArchetypeConfigRepository,
  ArchetypePosition,
  ArchetypePositionBulletRef,
  err,
  ok,
  type Result
} from '@tailoredin/domain';

export type SetArchetypePositionsInput = {
  archetypeId: string;
  positions: {
    resumePositionId: string;
    jobTitle: string | null;
    displayCompanyName: string;
    locationLabel: string;
    startDate: string | null;
    endDate: string | null;
    roleSummary: string | null;
    ordinal: number;
    bullets: { bulletId: string; ordinal: number }[];
  }[];
};

export class SetArchetypePositions {
  public constructor(private readonly archetypeRepository: ArchetypeConfigRepository) {}

  public async execute(input: SetArchetypePositionsInput): Promise<Result<void, Error>> {
    let config: ArchetypeConfig;
    try {
      config = await this.archetypeRepository.findByIdOrFail(input.archetypeId);
    } catch {
      return err(new Error(`Archetype not found: ${input.archetypeId}`));
    }

    const positions = input.positions.map(p =>
      ArchetypePosition.create({
        archetypeId: config.id.value,
        resumePositionId: p.resumePositionId,
        jobTitle: p.jobTitle,
        displayCompanyName: p.displayCompanyName,
        locationLabel: p.locationLabel,
        startDate: p.startDate,
        endDate: p.endDate,
        roleSummary: p.roleSummary,
        ordinal: p.ordinal,
        bullets: p.bullets.map(b => new ArchetypePositionBulletRef(b.bulletId, b.ordinal))
      })
    );

    config.replacePositions(positions);
    await this.archetypeRepository.save(config);
    return ok(undefined);
  }
}
