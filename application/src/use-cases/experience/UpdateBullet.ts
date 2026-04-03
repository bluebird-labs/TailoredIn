import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type UpdateBulletInput = {
  experienceId: string;
  bulletId: string;
  content: string;
  ordinal: number;
};

// TODO(Task 9): Replace with UpdateAccomplishment use case
export class UpdateBullet {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateBulletInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let accomplishment: ReturnType<Experience['findAccomplishmentOrFail']>;
    try {
      accomplishment = experience.findAccomplishmentOrFail(input.bulletId);
    } catch {
      return err(new Error(`Accomplishment not found: ${input.bulletId}`));
    }

    accomplishment.update({ title: input.content, ordinal: input.ordinal });

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
