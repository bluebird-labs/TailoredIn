// Base building blocks
export { AggregateRoot } from './AggregateRoot.js';
export type { DomainEvent } from './DomainEvent.js';
// Domain services
export { JobElectionService } from './domain-services/JobElectionService.js';
export { TailoringStrategyService } from './domain-services/TailoringStrategyService.js';
export { Entity } from './Entity.js';
export type { ArchetypeCreateProps } from './entities/Archetype.js';
export { Archetype } from './entities/Archetype.js';
export type { BulletCreateProps } from './entities/Bullet.js';
export { Bullet } from './entities/Bullet.js';
// Entities — job discovery
export type { CompanyCreateProps } from './entities/Company.js';
export { Company } from './entities/Company.js';
// Entities — company briefs
export type { CompanyBriefCreateProps, CompanyBriefSections } from './entities/CompanyBrief.js';
export { CompanyBrief } from './entities/CompanyBrief.js';
export type { EducationCreateProps } from './entities/Education.js';
export { Education } from './entities/Education.js';
export type { ExperienceCreateProps } from './entities/Experience.js';
export { Experience } from './entities/Experience.js';
// Entities — resume data
export type { HeadlineCreateProps } from './entities/Headline.js';
export { Headline } from './entities/Headline.js';
export type { JobPostingCreateProps } from './entities/JobPosting.js';
export { JobPosting } from './entities/JobPosting.js';
export type { ProfileCreateProps } from './entities/Profile.js';
export { Profile } from './entities/Profile.js';
export type { ResumeCreateProps } from './entities/Resume.js';
export { Resume } from './entities/Resume.js';
export { ResumeProfile } from './entities/ResumeProfile.js';
export type { SkillCreateProps, SkillRefreshProps } from './entities/Skill.js';
export { Skill } from './entities/Skill.js';
export type { SkillCategoryCreateProps } from './entities/SkillCategory.js';
export { SkillCategory } from './entities/SkillCategory.js';
export type { SkillItemCreateProps } from './entities/SkillItem.js';
export { SkillItem } from './entities/SkillItem.js';
export type { TagCreateProps } from './entities/Tag.js';
export { Tag, TagDimension } from './entities/Tag.js';
export type { TailoredResumeStatus } from './entities/TailoredResume.js';
export { TailoredResume } from './entities/TailoredResume.js';
// Events
export { JobScrapedEvent } from './events/JobScrapedEvent.js';
export { JobStatusChangedEvent } from './events/JobStatusChangedEvent.js';
export { ResumeGeneratedEvent } from './events/ResumeGeneratedEvent.js';
// Ports — repository interfaces
export type { ArchetypeRepository } from './ports/ArchetypeRepository.js';
export type { CompanyBriefRepository } from './ports/CompanyBriefRepository.js';
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { EducationRepository } from './ports/EducationRepository.js';
export type { ExperienceRepository } from './ports/ExperienceRepository.js';
export type { HeadlineRepository } from './ports/HeadlineRepository.js';
export type { JobElector } from './ports/JobElector.js';
export type {
  FindPaginatedParams,
  JobListItem,
  JobRepository,
  PaginatedResult,
  UpsertJobProps
} from './ports/JobRepository.js';
export type { ProfileRepository } from './ports/ProfileRepository.js';
export type { SkillCategoryRepository } from './ports/SkillCategoryRepository.js';
export type { SkillRefreshOutput, SkillRepository } from './ports/SkillRepository.js';
export type { TagRepository } from './ports/TagRepository.js';
export type { Result } from './Result.js';
export { err, ok } from './Result.js';
export { ValueObject } from './ValueObject.js';
// Value objects — new domain model
export { ApprovalStatus } from './value-objects/ApprovalStatus.js';
// Value objects — legacy (to be removed in later steps)
export { ArchetypeKey, JobTitle } from './value-objects/Archetype.js';
export { ArchetypeId } from './value-objects/ArchetypeId.js';
// Value objects — IDs
export { BulletId } from './value-objects/BulletId.js';
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
export { LlmProposal } from './value-objects/LlmProposal.js';
export { ProfileId } from './value-objects/ProfileId.js';
export { ProjectId } from './value-objects/ProjectId.js';
export { ResumeId } from './value-objects/ResumeId.js';
export { SkillAffinity } from './value-objects/SkillAffinity.js';
export { SkillCategoryId } from './value-objects/SkillCategoryId.js';
export { SkillId } from './value-objects/SkillId.js';
export { SkillItemId } from './value-objects/SkillItemId.js';
export { SkillName } from './value-objects/SkillName.js';
export { TagId } from './value-objects/TagId.js';
export { TagProfile } from './value-objects/TagProfile.js';
export { TagSet } from './value-objects/TagSet.js';
export { TailoredResumeId } from './value-objects/TailoredResumeId.js';
export { TailoringScore } from './value-objects/TailoringScore.js';
