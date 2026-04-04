// Base building blocks
export { AggregateRoot } from './AggregateRoot.js';
export type { DomainEvent } from './DomainEvent.js';
export { Entity } from './Entity.js';
// Entities
export type { AccomplishmentCreateProps } from './entities/Accomplishment.js';
export { Accomplishment } from './entities/Accomplishment.js';
export type { CompanyCreateProps } from './entities/Company.js';
export { Company } from './entities/Company.js';
export type { EducationCreateProps } from './entities/Education.js';
export { Education } from './entities/Education.js';
export type { ExperienceCreateProps } from './entities/Experience.js';
export { Experience } from './entities/Experience.js';
export type { HeadlineCreateProps } from './entities/Headline.js';
export { Headline } from './entities/Headline.js';
export type { ProfileCreateProps } from './entities/Profile.js';
export { Profile } from './entities/Profile.js';
// Ports — repository interfaces
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { EducationRepository } from './ports/EducationRepository.js';
export type { ExperienceRepository } from './ports/ExperienceRepository.js';
export type { HeadlineRepository } from './ports/HeadlineRepository.js';
export type { ProfileRepository } from './ports/ProfileRepository.js';
export type { Result } from './Result.js';
export { err, ok } from './Result.js';
export { ValueObject } from './ValueObject.js';

// Value objects — IDs
export { AccomplishmentId } from './value-objects/AccomplishmentId.js';
// Value objects — domain
export { BusinessType } from './value-objects/BusinessType.js';
export { CompanyId } from './value-objects/CompanyId.js';
export { CompanyStage } from './value-objects/CompanyStage.js';
export { EducationId } from './value-objects/EducationId.js';
export { ExperienceId } from './value-objects/ExperienceId.js';
export { HeadlineId } from './value-objects/HeadlineId.js';
export { Industry } from './value-objects/Industry.js';
export type { BlockLayout, LayoutAnalysis } from './value-objects/LayoutAnalysis.js';
export { ProfileId } from './value-objects/ProfileId.js';
export type { ResumeTemplate } from './value-objects/ResumeTemplate.js';
