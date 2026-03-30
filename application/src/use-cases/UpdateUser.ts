import type { UserRepository } from '@tailoredin/domain';
import type { UserDto } from '../dtos/ResumeDataDto.js';

export type UpdateUserInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  githubHandle: string | null;
  linkedinHandle: string | null;
  locationLabel: string | null;
};

export class UpdateUser {
  public constructor(private readonly userRepository: UserRepository) {}

  public async execute(input: UpdateUserInput): Promise<UserDto> {
    const user = await this.userRepository.findByIdOrFail(input.userId);

    user.email = input.email;
    user.firstName = input.firstName;
    user.lastName = input.lastName;
    user.phoneNumber = input.phoneNumber;
    user.githubHandle = input.githubHandle;
    user.linkedinHandle = input.linkedinHandle;
    user.locationLabel = input.locationLabel;
    user.updatedAt = new Date();

    await this.userRepository.save(user);

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
