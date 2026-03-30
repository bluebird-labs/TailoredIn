import { inject, injectable } from '@needle-di/core';
import type { ListCompanies } from '@tailoredin/application';
import type { UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListCompaniesRoute {
  public constructor(
    private readonly listCompanies: ListCompanies = inject(DI.Resume.ListCompanies),
    private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)
  ) {}

  public plugin() {
    return new Elysia().get('/resume/companies', async () => {
      const user = await this.userRepository.findSingle();
      const data = await this.listCompanies.execute({ userId: user.id.value });
      return { data };
    });
  }
}
