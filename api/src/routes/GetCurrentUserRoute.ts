import { inject, injectable } from '@needle-di/core';
import type { UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class GetCurrentUserRoute {
  public constructor(private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)) {}

  public plugin() {
    return new Elysia().get('/user', async () => {
      const user = await this.userRepository.findSingle();
      return {
        data: {
          id: user.id.value,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          githubHandle: user.githubHandle,
          linkedinHandle: user.linkedinHandle,
          locationLabel: user.locationLabel
        }
      };
    });
  }
}
