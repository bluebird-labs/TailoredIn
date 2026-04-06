// Base building blocks
export { AggregateRoot } from './AggregateRoot.js';
export type { DomainEvent } from './DomainEvent.js';
export { Entity } from './Entity.js';
export { EntityNotFoundError } from './EntityNotFoundError.js';
// Entities
export type { AccomplishmentCreateProps } from './entities/Accomplishment.js';
export { Accomplishment } from './entities/Accomplishment.js';
export type { ApplicationCreateProps } from './entities/Application.js';
export { Application } from './entities/Application.js';
export type { CompanyCreateProps } from './entities/Company.js';
export { Company } from './entities/Company.js';
export type { EducationCreateProps } from './entities/Education.js';
export { Education } from './entities/Education.js';
export type { ExperienceCreateProps } from './entities/Experience.js';
export { Experience } from './entities/Experience.js';
export type { HeadlineCreateProps } from './entities/Headline.js';
export { Headline } from './entities/Headline.js';
export type { JobDescriptionCreateProps } from './entities/JobDescription.js';
export { JobDescription } from './entities/JobDescription.js';
export type { ProfileCreateProps } from './entities/Profile.js';
export { Profile } from './entities/Profile.js';
// Ports — repository interfaces
export type { ApplicationRepository } from './ports/ApplicationRepository.js';
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { EducationRepository } from './ports/EducationRepository.js';
export type { ExperienceRepository } from './ports/ExperienceRepository.js';
export type { HeadlineRepository } from './ports/HeadlineRepository.js';
export type { JobDescriptionRepository } from './ports/JobDescriptionRepository.js';
export type { ProfileRepository } from './ports/ProfileRepository.js';
export type { Result } from './Result.js';
export { err, ok } from './Result.js';
export { ValueObject } from './ValueObject.js';

// Value objects — IDs
export { AccomplishmentId } from './value-objects/AccomplishmentId.js';
export { ApplicationId } from './value-objects/ApplicationId.js';
// Value objects — domain
export { ApplicationStatus } from './value-objects/ApplicationStatus.js';
export { BusinessType } from './value-objects/BusinessType.js';
export { CompanyId } from './value-objects/CompanyId.js';
export { CompanyStage } from './value-objects/CompanyStage.js';
export { EducationId } from './value-objects/EducationId.js';
export { ExperienceId } from './value-objects/ExperienceId.js';
export { HeadlineId } from './value-objects/HeadlineId.js';
export { Industry } from './value-objects/Industry.js';
export { JobDescriptionId } from './value-objects/JobDescriptionId.js';
export { JobLevel } from './value-objects/JobLevel.js';
export { JobSource } from './value-objects/JobSource.js';
export type { BlockLayout, LayoutAnalysis } from './value-objects/LayoutAnalysis.js';
export { LocationType } from './value-objects/LocationType.js';
export { ProfileId } from './value-objects/ProfileId.js';
export { DEFAULT_RESUME_TEMPLATE } from './value-objects/ResumeTemplate.js';
export type { ResumeTemplate } from './value-objects/ResumeTemplate.js';
export { SalaryRange } from './value-objects/SalaryRange.js';
