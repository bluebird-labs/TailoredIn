import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Put
} from '@nestjs/common';
import type {
  CreateApplication,
  DeleteApplication,
  GetApplication,
  ListApplications,
  UpdateApplication,
  UpdateApplicationStatus
} from '@tailoredin/application';
import type { ApplicationStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { type AuthUser, CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

@Controller('applications')
export class ApplicationController {
  public constructor(
    @Inject(DI.Application.Create) private readonly createApplication: CreateApplication,
    @Inject(DI.Application.Get) private readonly getApplication: GetApplication,
    @Inject(DI.Application.List) private readonly listApplications: ListApplications,
    @Inject(DI.Application.Update) private readonly updateApplication: UpdateApplication,
    @Inject(DI.Application.UpdateStatus) private readonly updateStatus: UpdateApplicationStatus,
    @Inject(DI.Application.Delete) private readonly deleteApplication: DeleteApplication
  ) {}

  @Get()
  public async list(@CurrentUser() user: AuthUser) {
    const data = await this.listApplications.execute({ profileId: user.profileId });
    return { data };
  }

  @Get(':id')
  public async get(@Param('id') id: string) {
    try {
      const data = await this.getApplication.execute({ applicationId: id });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Application not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Post()
  @HttpCode(201)
  public async create(@CurrentUser() user: AuthUser, @Body() body: CreateApplicationDto) {
    const data = await this.createApplication.execute({
      profileId: user.profileId,
      companyId: body.company_id,
      jobDescriptionId: body.job_description_id,
      notes: body.notes
    });
    return { data };
  }

  @Put(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateApplicationDto) {
    try {
      const data = await this.updateApplication.execute({
        applicationId: id,
        jobDescriptionId: body.job_description_id,
        notes: body.notes
      });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Application not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Patch(':id/status')
  public async updateStatusHandler(@Param('id') id: string, @Body() body: UpdateApplicationStatusDto) {
    try {
      const data = await this.updateStatus.execute({
        applicationId: id,
        status: body.status as ApplicationStatus,
        resumeContentId: body.resume_content_id,
        archiveReason: body.archive_reason,
        withdrawReason: body.withdraw_reason
      });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Application not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      if (
        e instanceof Error &&
        (e.message.includes('reason is required') ||
          e.message.includes('is required when') ||
          e.message.includes('not found:') ||
          e.message.includes('Can only apply from') ||
          e.message.includes('Use archive()') ||
          e.message.includes('Use withdraw()') ||
          e.message.includes('Use apply()'))
      ) {
        throw new HttpException({ error: { code: 'VALIDATION_ERROR', message: e.message } }, 422);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  public async delete(@Param('id') id: string) {
    const result = await this.deleteApplication.execute({ applicationId: id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
  }
}
