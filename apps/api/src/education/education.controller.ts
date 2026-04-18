import { Body, Controller, Delete, Get, HttpCode, HttpException, Inject, Param, Post, Put } from '@nestjs/common';
import type { CreateEducation, DeleteEducation, ListEducation, UpdateEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateEducationDto } from './dto/create-education.dto.js';
import { UpdateEducationDto } from './dto/update-education.dto.js';

@Controller('educations')
export class EducationController {
  public constructor(
    @Inject(DI.Education.ListEducation) private readonly listEducation: ListEducation,
    @Inject(DI.Education.CreateEducation) private readonly createEducation: CreateEducation,
    @Inject(DI.Education.UpdateEducation) private readonly updateEducation: UpdateEducation,
    @Inject(DI.Education.DeleteEducation) private readonly deleteEducation: DeleteEducation
  ) {}

  @Get()
  public async list() {
    const data = await this.listEducation.execute();
    return { data };
  }

  @Post()
  @HttpCode(201)
  public async create(@CurrentUser() user: AuthUser, @Body() body: CreateEducationDto) {
    const data = await this.createEducation.execute({
      profileId: user.profileId,
      degreeTitle: body.degree_title,
      institutionName: body.institution_name,
      graduationYear: body.graduation_year,
      location: body.location,
      honors: body.honors,
      ordinal: body.ordinal,
      hiddenByDefault: body.hidden_by_default
    });
    return { data };
  }

  @Put(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateEducationDto) {
    const result = await this.updateEducation.execute({
      educationId: id,
      degreeTitle: body.degree_title,
      institutionName: body.institution_name,
      graduationYear: body.graduation_year,
      location: body.location,
      honors: body.honors,
      ordinal: body.ordinal,
      hiddenByDefault: body.hidden_by_default
    });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
    return { data: result.value };
  }

  @Delete(':id')
  @HttpCode(204)
  public async delete(@Param('id') id: string) {
    const result = await this.deleteEducation.execute({ educationId: id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
  }
}
