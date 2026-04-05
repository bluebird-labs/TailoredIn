import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  ApplicationId,
  type ApplicationRepository,
  type ApplicationStatus,
  Application as DomainApplication,
  EntityNotFoundError
} from '@tailoredin/domain';
import { Application as OrmApplication } from '../db/entities/application/Application.js';
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
import { JobDescription as OrmJobDescription } from '../db/entities/job-description/JobDescription.js';
import { Profile as OrmProfile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresApplicationRepository implements ApplicationRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findById(id: ApplicationId): Promise<DomainApplication | null> {
    const orm = await this.orm.em.findOne(OrmApplication, id.value);
    return orm ? this.toDomain(orm) : null;
  }

  public async findByProfileId(profileId: string): Promise<DomainApplication[]> {
    const ormEntities = await this.orm.em.find(
      OrmApplication,
      { profile: profileId },
      { orderBy: { appliedAt: 'DESC' } }
    );
    return ormEntities.map(e => this.toDomain(e));
  }

  public async save(application: DomainApplication): Promise<void> {
    let ormApp = await this.orm.em.findOne(OrmApplication, application.id.value);

    if (ormApp) {
      ormApp.status = application.status;
      ormApp.notes = application.notes;
      ormApp.jobDescription = application.jobDescriptionId
        ? this.orm.em.getReference(OrmJobDescription, application.jobDescriptionId)
        : null;
      ormApp.updatedAt = application.updatedAt;
    } else {
      const profileRef = this.orm.em.getReference(OrmProfile, application.profileId);
      const companyRef = this.orm.em.getReference(OrmCompany, application.companyId);
      const jdRef = application.jobDescriptionId
        ? this.orm.em.getReference(OrmJobDescription, application.jobDescriptionId)
        : null;
      ormApp = new OrmApplication({
        id: application.id.value,
        profile: profileRef,
        company: companyRef,
        jobDescription: jdRef,
        status: application.status,
        notes: application.notes,
        appliedAt: application.appliedAt,
        createdAt: application.appliedAt,
        updatedAt: application.updatedAt
      });
    }

    this.orm.em.persist(ormApp);
    await this.orm.em.flush();
  }

  public async delete(id: ApplicationId): Promise<void> {
    const orm = await this.orm.em.findOne(OrmApplication, id.value);
    if (!orm) {
      throw new EntityNotFoundError('Application', id.value);
    }
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmApplication): DomainApplication {
    const profileId = typeof orm.profile === 'string' ? orm.profile : (orm.profile as { id: string }).id;
    const companyId = typeof orm.company === 'string' ? orm.company : (orm.company as { id: string }).id;
    const jobDescriptionId = orm.jobDescription
      ? typeof orm.jobDescription === 'string'
        ? orm.jobDescription
        : (orm.jobDescription as { id: string }).id
      : null;

    return new DomainApplication({
      id: new ApplicationId(orm.id),
      profileId,
      companyId,
      status: orm.status as ApplicationStatus,
      jobDescriptionId,
      notes: orm.notes,
      appliedAt: orm.appliedAt,
      updatedAt: orm.updatedAt
    });
  }
}
