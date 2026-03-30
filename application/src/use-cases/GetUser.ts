import type { UserRepository } from '@tailoredin/domain';
import type { UserDto } from '../dtos/ResumeDataDto.js';

export type GetUserInput = {
  userId: string;
};

export class GetUser {
  public constructor(private readonly userRepository: UserRepository) {}

  public async execute(input: GetUserInput): Promise<UserDto> {
    const user = await this.userRepository.findByIdOrFail(input.userId);

    return {
      id: user.id.value,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      githubHandle: user.githubHandle,
      linkedinHandle: user.linkedinHandle,
      locationLabel: user.locationLabel
    };
  }
}
