import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import type { GetProfile, UpdateProfile } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('profile')
export class ProfileController {
  public constructor(
    @Inject(DI.Profile.GetProfile) private readonly getProfile: GetProfile,
    @Inject(DI.Profile.UpdateProfile) private readonly updateProfile: UpdateProfile
  ) {}

  @Get()
  public async get(@CurrentUser() user: AuthUser) {
    const data = await this.getProfile.execute({ profileId: user.profileId });
    return { data };
  }

  @Put()
  public async update(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileDto) {
    const data = await this.updateProfile.execute({
      profileId: user.profileId,
      email: body.email,
      firstName: body.first_name,
      lastName: body.last_name,
      about: body.about,
      phone: body.phone,
      location: body.location,
      linkedinUrl: body.linkedin_url,
      githubUrl: body.github_url,
      websiteUrl: body.website_url
    });
    return { data };
  }
}
