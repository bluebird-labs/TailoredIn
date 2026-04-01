import { inject, injectable } from '@needle-di/core';
import type { ListExperiences } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListExperiencesRoute {
  public constructor(private readonly listExperiences: ListExperiences = inject(DI.Experience.List)) {}

  public plugin() {
    return new Elysia().get('/experiences', async () => {
      const experiences = await this.listExperiences.execute();
      return { data: experiences };
    });
  }
}
