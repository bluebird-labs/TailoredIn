// Base building blocks
export { AggregateRoot } from './AggregateRoot.js';
export type { DomainEvent } from './DomainEvent.js';
// Domain services
export { JobElectionService } from './domain-services/JobElectionService.js';
export { TailoringStrategyService } from './domain-services/TailoringStrategyService.js';
export { Entity } from './Entity.js';
export type { ArchetypeConfigCreateProps } from './entities/ArchetypeConfig.js';
export { ArchetypeConfig } from './entities/ArchetypeConfig.js';
export type { ArchetypePositionCreateProps } from './entities/ArchetypePosition.js';
export { ArchetypePosition } from './entities/ArchetypePosition.js';
// Entities — job discovery
export type { CompanyCreateProps } from './entities/Company.js';
export { Company } from './entities/Company.js';
// Entities — company briefs
export type { CompanyBriefCreateProps, CompanyBriefSections } from './entities/CompanyBrief.js';
export { CompanyBrief } from './entities/CompanyBrief.js';
export type { EducationCreateProps } from './entities/Education.js';
export { Education } from './entities/Education.js';
export type { JobPostingCreateProps } from './entities/JobPosting.js';
export { JobPosting } from './entities/JobPosting.js';
export type { ProfileCreateProps } from './entities/Profile.js';
export { Profile } from './entities/Profile.js';
export type { ResumeCreateProps } from './entities/Resume.js';
export { Resume } from './entities/Resume.js';
export type { ResumeBulletCreateProps } from './entities/ResumeBullet.js';
export { ResumeBullet } from './entities/ResumeBullet.js';
export type { ResumeCompanyCreateProps } from './entities/ResumeCompany.js';
export { ResumeCompany } from './entities/ResumeCompany.js';
export type { ResumeEducationCreateProps } from './entities/ResumeEducation.js';
export { ResumeEducation } from './entities/ResumeEducation.js';
export type { ResumeHeadlineCreateProps } from './entities/ResumeHeadline.js';
export { ResumeHeadline } from './entities/ResumeHeadline.js';
export type { ResumePositionCreateProps } from './entities/ResumePosition.js';
export { ResumePosition } from './entities/ResumePosition.js';
export type { ResumeSkillCategoryCreateProps } from './entities/ResumeSkillCategory.js';
export { ResumeSkillCategory } from './entities/ResumeSkillCategory.js';
export type { ResumeSkillItemCreateProps } from './entities/ResumeSkillItem.js';
export { ResumeSkillItem } from './entities/ResumeSkillItem.js';
export type { SkillCreateProps, SkillRefreshProps } from './entities/Skill.js';
export { Skill } from './entities/Skill.js';
// Entities — resume data
export type { TagCreateProps } from './entities/Tag.js';
export { Tag, TagDimension } from './entities/Tag.js';
export type { UserCreateProps } from './entities/User.js';
export { User } from './entities/User.js';
// Events
export { JobScrapedEvent } from './events/JobScrapedEvent.js';
export { JobStatusChangedEvent } from './events/JobStatusChangedEvent.js';
export { ResumeGeneratedEvent } from './events/ResumeGeneratedEvent.js';
// Ports — repository interfaces
export type { ArchetypeConfigRepository } from './ports/ArchetypeConfigRepository.js';
export type { CompanyBriefRepository } from './ports/CompanyBriefRepository.js';
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { EducationRepository } from './ports/EducationRepository.js';
export type { JobElector } from './ports/JobElector.js';
export type {
  FindPaginatedParams,
  JobListItem,
  JobRepository,
  PaginatedResult,
  UpsertJobProps
} from './ports/JobRepository.js';
export type { ProfileRepository } from './ports/ProfileRepository.js';
export type { ResumeCompanyRepository } from './ports/ResumeCompanyRepository.js';
export type { ResumeEducationRepository } from './ports/ResumeEducationRepository.js';
export type { ResumeHeadlineRepository } from './ports/ResumeHeadlineRepository.js';
export type { ResumeSkillCategoryRepository } from './ports/ResumeSkillCategoryRepository.js';
export type { SkillRefreshOutput, SkillRepository } from './ports/SkillRepository.js';
export type { TagRepository } from './ports/TagRepository.js';
export type { UserRepository } from './ports/UserRepository.js';
export type { Result } from './Result.js';
export { err, ok } from './Result.js';
export { ValueObject } from './ValueObject.js';
// Value objects — new domain model
export { ApprovalStatus } from './value-objects/ApprovalStatus.js';
// Value objects — domain
export { Archetype, JobTitle } from './value-objects/Archetype.js';
// Value objects — IDs (existing)
export { ArchetypeConfigId } from './value-objects/ArchetypeConfigId.js';
// Value objects — IDs (new domain model)
export { ArchetypeId } from './value-objects/ArchetypeId.js';
export { ArchetypePositionBulletRef } from './value-objects/ArchetypePositionBulletRef.js';
export { ArchetypePositionId } from './value-objects/ArchetypePositionId.js';
export {
  ArchetypeEducationSelection,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection
} from './value-objects/ArchetypeSelections.js';
export { BulletId } from './value-objects/BulletId.js';
export { BulletVariantId } from './value-objects/BulletVariantId.js';
export { BusinessType } from './value-objects/BusinessType.js';
export { CompanyBriefId } from './value-objects/CompanyBriefId.js';
export { CompanyId } from './value-objects/CompanyId.js';
export { CompanyStage } from './value-objects/CompanyStage.js';
export type { ExperienceSelection } from './value-objects/ContentSelection.js';
export { ContentSelection } from './value-objects/ContentSelection.js';
export { EducationId } from './value-objects/EducationId.js';
export { ExperienceId } from './value-objects/ExperienceId.js';
export { HeadlineId } from './value-objects/HeadlineId.js';
export { Industry } from './value-objects/Industry.js';
export { JobId } from './value-objects/JobId.js';
export { JobPostingId } from './value-objects/JobPostingId.js';
export { DISCARDED_JOB_STATUSES, IN_PROCESS_JOB_STATUSES, JobStatus } from './value-objects/JobStatus.js';
export { ProfileId } from './value-objects/ProfileId.js';
export { ProjectId } from './value-objects/ProjectId.js';
export { ResumeBulletId } from './value-objects/ResumeBulletId.js';
export { ResumeCompanyId } from './value-objects/ResumeCompanyId.js';
export { ResumeEducationId } from './value-objects/ResumeEducationId.js';
export { ResumeHeadlineId } from './value-objects/ResumeHeadlineId.js';
export { ResumeId } from './value-objects/ResumeId.js';
export { ResumeLocation } from './value-objects/ResumeLocation.js';
export { ResumePositionId } from './value-objects/ResumePositionId.js';
export { ResumeSkillCategoryId } from './value-objects/ResumeSkillCategoryId.js';
export { ResumeSkillItemId } from './value-objects/ResumeSkillItemId.js';
export { SkillAffinity } from './value-objects/SkillAffinity.js';
export { SkillCategoryId } from './value-objects/SkillCategoryId.js';
export { SkillId } from './value-objects/SkillId.js';
export { SkillItemId } from './value-objects/SkillItemId.js';
export { SkillName } from './value-objects/SkillName.js';
export { TagId } from './value-objects/TagId.js';
export { TagProfile } from './value-objects/TagProfile.js';
export { TagSet } from './value-objects/TagSet.js';
export { TailoringScore } from './value-objects/TailoringScore.js';
export { UserId } from './value-objects/UserId.js';
