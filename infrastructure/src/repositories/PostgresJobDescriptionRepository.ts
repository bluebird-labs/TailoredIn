import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  JobDescription as DomainJobDescription,
  EntityNotFoundError,
  JobDescriptionId,
  type JobDescriptionRepository,
  type JobLevel,
  type JobSource,
  type LocationType,
  SalaryRange
} from '@tailoredin/domain';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import { JobDescription as OrmJobDescription } from '../db/entities/job-description/JobDescription.js';

@injectable()
export class PostgresJobDescriptionRepository implements JobDescriptionRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findById(id: JobDescriptionId): Promise<DomainJobDescription | null> {
    const orm = await this.orm.em.findOne(OrmJobDescription, id.value, { populate: ['company'] });
    return orm ? this.toDomain(orm) : null;
  }

  public async findByCompanyId(companyId: string): Promise<DomainJobDescription[]> {
    const ormEntities = await this.orm.em.find(
      OrmJobDescription,
      { company: companyId },
      { populate: ['company'], orderBy: { createdAt: 'DESC' } }
    );
    return ormEntities.map(e => this.toDomain(e));
  }

  public async save(jd: DomainJobDescription): Promise<void> {
    let ormJd = await this.orm.em.findOne(OrmJobDescription, jd.id.value);

    if (ormJd) {
      ormJd.title = jd.title;
      ormJd.description = jd.description;
      ormJd.url = jd.url;
      ormJd.location = jd.location;
      ormJd.salaryMin = jd.salaryRange?.min ?? null;
      ormJd.salaryMax = jd.salaryRange?.max ?? null;
      ormJd.salaryCurrency = jd.salaryRange?.currency ?? null;
      ormJd.level = jd.level;
      ormJd.locationType = jd.locationType;
      ormJd.source = jd.source;
      ormJd.postedAt = jd.postedAt;
      ormJd.rawText = jd.rawText;
      ormJd.resumeOutput = jd.resumeOutput
        ? {
            schema: jd.resumeOutput.schema,
            output: jd.resumeOutput.output,
            generatedAt: jd.resumeOutput.generatedAt.toISOString()
          }
        : null;
      ormJd.updatedAt = jd.updatedAt;
    } else {
      const companyRef = this.orm.em.getReference(OrmCompany, jd.companyId);
      ormJd = new OrmJobDescription({
        id: jd.id.value,
        company: companyRef,
        title: jd.title,
        description: jd.description,
        url: jd.url,
        location: jd.location,
        salaryMin: jd.salaryRange?.min ?? null,
        salaryMax: jd.salaryRange?.max ?? null,
        salaryCurrency: jd.salaryRange?.currency ?? null,
        level: jd.level,
        locationType: jd.locationType,
        source: jd.source,
        postedAt: jd.postedAt,
        rawText: jd.rawText,
        createdAt: jd.createdAt,
        updatedAt: jd.updatedAt
      });
      ormJd.resumeOutput = jd.resumeOutput
        ? {
            schema: jd.resumeOutput.schema,
            output: jd.resumeOutput.output,
            generatedAt: jd.resumeOutput.generatedAt.toISOString()
          }
        : null;
    }

    this.orm.em.persist(ormJd);
    await this.orm.em.flush();
  }

  public async delete(id: JobDescriptionId): Promise<void> {
    const orm = await this.orm.em.findOne(OrmJobDescription, id.value);
    if (!orm) {
      throw new EntityNotFoundError('JobDescription', id.value);
    }
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmJobDescription): DomainJobDescription {
    const companyId = typeof orm.company === 'string' ? orm.company : (orm.company as { id: string }).id;

    const salaryRange =
      orm.salaryCurrency != null
        ? new SalaryRange({ min: orm.salaryMin, max: orm.salaryMax, currency: orm.salaryCurrency })
        : null;

    return new DomainJobDescription({
      id: new JobDescriptionId(orm.id),
      companyId,
      title: orm.title,
      description: orm.description,
      url: orm.url,
      location: orm.location,
      salaryRange,
      level: orm.level as JobLevel | null,
      locationType: orm.locationType as LocationType | null,
      source: orm.source as JobSource,
      postedAt: orm.postedAt,
      rawText: orm.rawText,
      resumeOutput: orm.resumeOutput
        ? {
            schema: orm.resumeOutput.schema,
            output: orm.resumeOutput.output,
            generatedAt: new Date(orm.resumeOutput.generatedAt)
          }
        : null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
