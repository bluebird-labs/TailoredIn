import { Inject, Injectable } from '@nestjs/common';
import { type ApplicationRepository, EntityNotFoundError, err, ok, type Result } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type DeleteApplicationInput = {
  applicationId: string;
};

@Injectable()
export class DeleteApplication {
  public constructor(
    @Inject(DI.Application.Repository) private readonly applicationRepository: ApplicationRepository
  ) {}

  public async execute(input: DeleteApplicationInput): Promise<Result<void, Error>> {
    try {
      await this.applicationRepository.delete(input.applicationId);
      return ok(undefined);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
  }
}
