import type { ProfileRepository } from '@tailoredin/domain';
import type { ProfileDto } from '../dtos/ProfileDto.js';

export class GetProfile {
  public constructor(private readonly profileRepository: ProfileRepository) {}

  public async execute(): Promise<ProfileDto> {
    const profile = await this.profileRepository.findSingle();

    return {
      id: profile.id.value,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      websiteUrl: profile.websiteUrl
    };
  }
}
