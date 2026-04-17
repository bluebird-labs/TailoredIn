import { Inject, Injectable } from '@nestjs/common';
import { type CompanyRepository, EntityNotFoundError, err, ok, type Result } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type DeleteCompanyInput = {
  companyId: string;
};

@Injectable()
export class DeleteCompany {
  public constructor(@Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository) {}

  public async execute(input: DeleteCompanyInput): Promise<Result<void, Error>> {
    try {
      await this.companyRepository.delete(input.companyId);
      return ok(undefined);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
  }
}
