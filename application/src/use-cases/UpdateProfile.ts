import { Inject, Injectable } from '@nestjs/common';
import type { ProfileRepository } from '@tailoredin/domain';
import { DI } from '../DI.js';
import type { ProfileDto } from '../dtos/ProfileDto.js';

export type UpdateProfileInput = {
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  about: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

@Injectable()
export class UpdateProfile {
  public constructor(@Inject(DI.Profile.Repository) private readonly profileRepository: ProfileRepository) {}

  public async execute(input: UpdateProfileInput): Promise<ProfileDto> {
    const profile = await this.profileRepository.findByIdOrFail(input.profileId);

    profile.email = input.email;
    profile.firstName = input.firstName;
    profile.lastName = input.lastName;
    profile.about = input.about;
    profile.phone = input.phone;
    profile.location = input.location;
    profile.linkedinUrl = input.linkedinUrl;
    profile.githubUrl = input.githubUrl;
    profile.websiteUrl = input.websiteUrl;
    profile.updatedAt = new Date();

    await this.profileRepository.save(profile);

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
