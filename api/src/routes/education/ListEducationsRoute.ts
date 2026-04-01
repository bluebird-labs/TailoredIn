import { inject, injectable } from '@needle-di/core';
import type { ListEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListEducationsRoute {
  public constructor(private readonly listEducation: ListEducation = inject(DI.Education.ListEducation)) {}

  public plugin() {
    return new Elysia().get('/educations', async () => {
      const entries = await this.listEducation.execute();
      return { data: entries };
    });
  }
}
