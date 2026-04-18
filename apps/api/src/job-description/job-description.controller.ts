import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import type {
  CreateJobDescription,
  DeleteJobDescription,
  GetJobDescription,
  ListJobDescriptions,
  ParseJobDescription,
  ScoreJobFit,
  UpdateJobDescription
} from '@tailoredin/application';
import type { JobLevel, JobSource, LocationType } from '@tailoredin/domain';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateJobDescriptionDto } from './dto/create-job-description.dto.js';
import { ParseJobDescriptionDto } from './dto/parse-job-description.dto.js';
import { UpdateJobDescriptionDto } from './dto/update-job-description.dto.js';

@Controller('job-descriptions')
export class JobDescriptionController {
  public constructor(
    @Inject(DI.JobDescription.List) private readonly listJobDescriptions: ListJobDescriptions,
    @Inject(DI.JobDescription.Get) private readonly getJobDescription: GetJobDescription,
    @Inject(DI.JobDescription.Create) private readonly createJobDescription: CreateJobDescription,
    @Inject(DI.JobDescription.Update) private readonly updateJobDescription: UpdateJobDescription,
    @Inject(DI.JobDescription.Delete) private readonly deleteJobDescription: DeleteJobDescription,
    @Inject(DI.JobDescription.Parse) private readonly parseJobDescription: ParseJobDescription,
    @Inject(DI.JobDescription.ScoreFit) private readonly scoreJobFit: ScoreJobFit
  ) {}

  @Get()
  public async list(@Query('company_id') companyId?: string) {
    const data = await this.listJobDescriptions.execute({ companyId });
    return { data };
  }

  @Get(':id')
  public async get(@Param('id') id: string) {
    try {
      const data = await this.getJobDescription.execute({ jobDescriptionId: id });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('JobDescription not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Post()
  @HttpCode(201)
  public async create(@Body() body: CreateJobDescriptionDto) {
    const data = await this.createJobDescription.execute({
      companyId: body.company_id,
      title: body.title,
      description: body.description,
      url: body.url,
      location: body.location,
      salaryMin: body.salary_min,
      salaryMax: body.salary_max,
      salaryCurrency: body.salary_currency,
      level: body.level ? (body.level as JobLevel) : undefined,
      locationType: body.location_type ? (body.location_type as LocationType) : undefined,
      source: body.source as JobSource,
      postedAt: body.posted_at ? new Date(body.posted_at) : null,
      rawText: body.raw_text,
      soughtHardSkills: body.sought_hard_skills,
      soughtSoftSkills: body.sought_soft_skills
    });
    return { data };
  }

  @Put(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateJobDescriptionDto) {
    try {
      const data = await this.updateJobDescription.execute({
        jobDescriptionId: id,
        title: body.title,
        description: body.description,
        url: body.url,
        location: body.location,
        salaryMin: body.salary_min,
        salaryMax: body.salary_max,
        salaryCurrency: body.salary_currency,
        level: body.level ? (body.level as JobLevel) : undefined,
        locationType: body.location_type ? (body.location_type as LocationType) : undefined,
        source: body.source as JobSource,
        postedAt: body.posted_at ? new Date(body.posted_at) : null,
        rawText: body.raw_text,
        soughtHardSkills: body.sought_hard_skills,
        soughtSoftSkills: body.sought_soft_skills
      });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('JobDescription not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  public async delete(@Param('id') id: string) {
    const result = await this.deleteJobDescription.execute({ jobDescriptionId: id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
  }

  @Post('parse')
  @HttpCode(200)
  public async parse(@Body() body: ParseJobDescriptionDto) {
    const data = await this.parseJobDescription.execute({ text: body.text });
    return { data };
  }

  @Post(':id/score-fit')
  @HttpCode(200)
  public async scoreFit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    try {
      const data = await this.scoreJobFit.execute({ profileId: user.profileId, jobDescriptionId: id });
      return { data };
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }
}
