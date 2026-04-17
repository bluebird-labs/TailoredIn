import { Body, Controller, Delete, Get, HttpCode, HttpException, Inject, Param, Post, Put } from '@nestjs/common';
import type {
  AddAccomplishment,
  CreateExperience,
  DeleteAccomplishment,
  DeleteExperience,
  GetExperience,
  LinkCompanyToExperience,
  ListExperiences,
  SyncExperienceSkills,
  UnlinkCompanyFromExperience,
  UpdateAccomplishment,
  UpdateExperience
} from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AddAccomplishmentDto } from './dto/add-accomplishment.dto.js';
import { CreateExperienceDto } from './dto/create-experience.dto.js';
import { LinkCompanyDto } from './dto/link-company.dto.js';
import { SyncSkillsDto } from './dto/sync-skills.dto.js';
import { UpdateAccomplishmentDto } from './dto/update-accomplishment.dto.js';
import { UpdateExperienceDto } from './dto/update-experience.dto.js';

@Controller('experiences')
export class ExperienceController {
  public constructor(
    @Inject(DI.Experience.List) private readonly listExperiences: ListExperiences,
    @Inject(DI.Experience.Get) private readonly getExperience: GetExperience,
    @Inject(DI.Experience.Create) private readonly createExperience: CreateExperience,
    @Inject(DI.Experience.Update) private readonly updateExperience: UpdateExperience,
    @Inject(DI.Experience.Delete) private readonly deleteExperience: DeleteExperience,
    @Inject(DI.Experience.AddAccomplishment) private readonly addAccomplishment: AddAccomplishment,
    @Inject(DI.Experience.UpdateAccomplishment) private readonly updateAccomplishment: UpdateAccomplishment,
    @Inject(DI.Experience.DeleteAccomplishment) private readonly deleteAccomplishment: DeleteAccomplishment,
    @Inject(DI.Experience.LinkCompany) private readonly linkCompany: LinkCompanyToExperience,
    @Inject(DI.Experience.UnlinkCompany) private readonly unlinkCompany: UnlinkCompanyFromExperience,
    @Inject(DI.Skill.SyncExperienceSkills) private readonly syncSkills: SyncExperienceSkills
  ) {}

  @Get()
  public async list() {
    const data = await this.listExperiences.execute();
    return { data };
  }

  @Get(':id')
  public async get(@Param('id') id: string) {
    try {
      const data = await this.getExperience.execute({ experienceId: id });
      return { data };
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Post()
  @HttpCode(201)
  public async create(@CurrentUser() user: AuthUser, @Body() body: CreateExperienceDto) {
    const data = await this.createExperience.execute({
      profileId: user.profileId,
      title: body.title,
      companyName: body.company_name,
      companyWebsite: body.company_website ?? null,
      companyAccent: body.company_accent ?? null,
      location: body.location,
      startDate: body.start_date,
      endDate: body.end_date,
      summary: body.summary ?? null,
      ordinal: body.ordinal
    });
    return { data };
  }

  @Put(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateExperienceDto) {
    const result = await this.updateExperience.execute({
      experienceId: id,
      title: body.title,
      companyName: body.company_name,
      companyWebsite: body.company_website ?? null,
      companyAccent: body.company_accent ?? null,
      location: body.location,
      startDate: body.start_date,
      endDate: body.end_date,
      summary: body.summary ?? null,
      ordinal: body.ordinal,
      accomplishments: body.accomplishments.map(a => ({
        id: a.id ?? null,
        title: a.title,
        narrative: a.narrative,
        ordinal: a.ordinal
      })),
      bulletMin: body.bullet_min,
      bulletMax: body.bullet_max
    });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
    return { data: result.value };
  }

  @Delete(':id')
  @HttpCode(204)
  public async delete(@Param('id') id: string) {
    const result = await this.deleteExperience.execute({ experienceId: id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
  }

  @Post(':id/accomplishments')
  @HttpCode(201)
  public async addAccomplishmentHandler(@Param('id') id: string, @Body() body: AddAccomplishmentDto) {
    const result = await this.addAccomplishment.execute({
      experienceId: id,
      title: body.title,
      narrative: body.narrative,
      ordinal: body.ordinal
    });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
    return { data: result.value };
  }

  @Put(':id/accomplishments/:accomplishmentId')
  public async updateAccomplishmentHandler(
    @Param('id') id: string,
    @Param('accomplishmentId') accomplishmentId: string,
    @Body() body: UpdateAccomplishmentDto
  ) {
    const result = await this.updateAccomplishment.execute({
      experienceId: id,
      accomplishmentId,
      title: body.title,
      narrative: body.narrative,
      ordinal: body.ordinal
    });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
    return { data: null };
  }

  @Delete(':id/accomplishments/:accomplishmentId')
  @HttpCode(204)
  public async deleteAccomplishmentHandler(
    @Param('id') id: string,
    @Param('accomplishmentId') accomplishmentId: string
  ) {
    const result = await this.deleteAccomplishment.execute({ experienceId: id, accomplishmentId });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
  }

  @Put(':id/company')
  public async linkCompanyHandler(@Param('id') id: string, @Body() body: LinkCompanyDto) {
    const result = await this.linkCompany.execute({ experienceId: id, companyId: body.company_id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
    return { data: result.value };
  }

  @Delete(':id/company')
  public async unlinkCompanyHandler(@Param('id') id: string) {
    const result = await this.unlinkCompany.execute({ experienceId: id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
    return { data: result.value };
  }

  @Put(':id/skills')
  public async syncSkillsHandler(@Param('id') id: string, @Body() body: SyncSkillsDto) {
    try {
      const data = await this.syncSkills.execute({ experienceId: id, skillIds: body.skill_ids });
      return { data };
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      if (e instanceof Error && e.message.startsWith('Skills not found')) {
        throw new HttpException({ error: { code: 'INVALID_SKILLS', message: e.message } }, 400);
      }
      throw e;
    }
  }
}
