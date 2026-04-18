import { Body, Controller, Delete, Get, HttpCode, HttpException, Inject, Param, Post, Put } from '@nestjs/common';
import type {
  CreateCompany,
  DeleteCompany,
  DiscoverCompanies,
  EnrichCompanyData,
  GetCompany,
  ListCompanies,
  UpdateCompany
} from '@tailoredin/application';
import { BusinessType, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { DiscoverCompaniesDto } from './dto/discover-companies.dto.js';
import { EnrichCompanyDto } from './dto/enrich-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

@Controller('companies')
export class CompanyController {
  public constructor(
    @Inject(DI.Company.List) private readonly listCompanies: ListCompanies,
    @Inject(DI.Company.Get) private readonly getCompany: GetCompany,
    @Inject(DI.Company.Create) private readonly createCompany: CreateCompany,
    @Inject(DI.Company.Update) private readonly updateCompany: UpdateCompany,
    @Inject(DI.Company.Delete) private readonly deleteCompany: DeleteCompany,
    @Inject(DI.Company.Enrich) private readonly enrichCompany: EnrichCompanyData,
    @Inject(DI.Company.Discover) private readonly discoverCompanies: DiscoverCompanies
  ) {}

  @Get()
  public async list() {
    const data = await this.listCompanies.execute();
    return { data };
  }

  @Get(':id')
  public async get(@Param('id') id: string) {
    try {
      const data = await this.getCompany.execute({ companyId: id });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Company not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Post()
  @HttpCode(201)
  public async create(@Body() body: CreateCompanyDto) {
    const data = await this.createCompany.execute({
      name: body.name,
      domainName: body.domain_name,
      description: body.description ?? null,
      website: body.website ?? null,
      logoUrl: body.logo_url ?? null,
      linkedinLink: body.linkedin_link ?? null,
      businessType: (body.business_type as BusinessType) ?? BusinessType.UNKNOWN,
      industry: (body.industry as Industry) ?? Industry.UNKNOWN,
      stage: (body.stage as CompanyStage) ?? CompanyStage.UNKNOWN,
      status: (body.status as CompanyStatus) ?? CompanyStatus.UNKNOWN
    });
    return { data };
  }

  @Put(':id')
  public async update(@Param('id') id: string, @Body() body: UpdateCompanyDto) {
    try {
      const data = await this.updateCompany.execute({
        companyId: id,
        name: body.name,
        domainName: body.domain_name,
        description: body.description ?? null,
        website: body.website ?? null,
        logoUrl: body.logo_url ?? null,
        linkedinLink: body.linkedin_link ?? null,
        businessType: (body.business_type as BusinessType) ?? BusinessType.UNKNOWN,
        industry: (body.industry as Industry) ?? Industry.UNKNOWN,
        stage: (body.stage as CompanyStage) ?? CompanyStage.UNKNOWN,
        status: (body.status as CompanyStatus) ?? CompanyStatus.UNKNOWN
      });
      return { data };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Company not found')) {
        throw new HttpException({ error: { code: 'NOT_FOUND', message: e.message } }, 404);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  public async delete(@Param('id') id: string) {
    const result = await this.deleteCompany.execute({ companyId: id });
    if (!result.isOk) {
      throw new HttpException({ error: { code: 'NOT_FOUND', message: result.error.message } }, 404);
    }
  }

  @Post('discover')
  @HttpCode(200)
  public async discover(@Body() body: DiscoverCompaniesDto) {
    const data = await this.discoverCompanies.execute({ query: body.query });
    return { data };
  }

  @Post('enrich')
  @HttpCode(200)
  public async enrich(@Body() body: EnrichCompanyDto) {
    const data = await this.enrichCompany.execute({ url: body.url, context: body.context });
    return { data };
  }
}
