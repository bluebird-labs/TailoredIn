import type { ProfileRepository } from '@tailoredin/domain';
import type { ProfileDto } from '../dtos/ProfileDto.js';

export type GetProfileInput = { profileId: string };

export class GetProfile {
  public constructor(private readonly profileRepository: ProfileRepository) {}

  public async execute(input: GetProfileInput): Promise<ProfileDto> {
    const profile = await this.profileRepository.findByIdOrFail(input.profileId);

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      about: profile.about,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      websiteUrl: profile.websiteUrl
    };
  }
}
