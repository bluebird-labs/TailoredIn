import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type UpdateBulletInput = {
  positionId: string;
  bulletId: string;
  content?: string;
  ordinal?: number;
};

export class UpdateBullet {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: UpdateBulletInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByPositionIdOrFail(input.positionId);
    } catch {
      return err(new Error(`Position not found: ${input.positionId}`));
    }

    try {
      const position = company.findPositionOrFail(input.positionId);
      position.updateBullet(input.bulletId, { content: input.content, ordinal: input.ordinal });
    } catch (e) {
      return err(e as Error);
    }

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
