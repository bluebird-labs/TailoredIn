// Base building blocks
export { AggregateRoot } from './AggregateRoot.js';
export type { DomainEvent } from './DomainEvent.js';
export { Entity } from './Entity.js';
export { EntityNotFoundError } from './EntityNotFoundError.js';
export type { AccomplishmentCreateProps } from './entities/Accomplishment.js';
export { Accomplishment } from './entities/Accomplishment.js';
// Entities
export type { AccountCreateProps } from './entities/Account.js';
export { Account } from './entities/Account.js';
export type { ApplicationCreateProps } from './entities/Application.js';
export { Application } from './entities/Application.js';
export type { CompanyCreateProps } from './entities/Company.js';
export { Company } from './entities/Company.js';
export type { ConceptCreateProps } from './entities/Concept.js';
export { Concept } from './entities/Concept.js';
export type { ConceptDependencyCreateProps } from './entities/ConceptDependency.js';
export { ConceptDependency } from './entities/ConceptDependency.js';
export type { DatabaseCreateProps } from './entities/Database.js';
export { Database } from './entities/Database.js';
export type { EducationCreateProps } from './entities/Education.js';
export { Education } from './entities/Education.js';
export type { ExperienceCreateProps } from './entities/Experience.js';
export { Experience } from './entities/Experience.js';
export type { ExperienceSkillCreateProps } from './entities/ExperienceSkill.js';
export { ExperienceSkill } from './entities/ExperienceSkill.js';
export type { FrameworkCreateProps } from './entities/Framework.js';
export { Framework } from './entities/Framework.js';
export type { GenerationPromptCreateProps } from './entities/GenerationPrompt.js';
export { GenerationPrompt } from './entities/GenerationPrompt.js';
export type { GenerationSettingsCreateProps } from './entities/GenerationSettings.js';
export { GenerationSettings } from './entities/GenerationSettings.js';
export type { JobDescriptionCreateProps } from './entities/JobDescription.js';
export { JobDescription } from './entities/JobDescription.js';
export type { JobFitRequirementCreateProps } from './entities/JobFitRequirement.js';
export { JobFitRequirement } from './entities/JobFitRequirement.js';
export type { JobFitScoreCreateProps } from './entities/JobFitScore.js';
export { JobFitScore } from './entities/JobFitScore.js';
export type { LibraryCreateProps } from './entities/Library.js';
export { Library } from './entities/Library.js';
export { MarkupLanguage } from './entities/MarkupLanguage.js';
export type { ProfileCreateProps } from './entities/Profile.js';
export { Profile } from './entities/Profile.js';
export type { ProgrammingLanguageCreateProps } from './entities/ProgrammingLanguage.js';
export { ProgrammingLanguage } from './entities/ProgrammingLanguage.js';
export type { ProtocolCreateProps } from './entities/Protocol.js';
export { Protocol } from './entities/Protocol.js';
export { QueryLanguage } from './entities/QueryLanguage.js';
export type { ResumeContentCreateProps } from './entities/ResumeContent.js';
export { ResumeContent } from './entities/ResumeContent.js';
export type { ServiceCreateProps } from './entities/Service.js';
export { Service } from './entities/Service.js';
export type { SkillCreateProps } from './entities/Skill.js';
export { Skill } from './entities/Skill.js';
export type { SkillCategoryCreateProps } from './entities/SkillCategory.js';
export { SkillCategory } from './entities/SkillCategory.js';
export type { SkillDependencyCreateProps } from './entities/SkillDependency.js';
export { SkillDependency } from './entities/SkillDependency.js';
export type { ToolCreateProps } from './entities/Tool.js';
export { Tool } from './entities/Tool.js';
// Ports — repository interfaces
export type { AccountRepository } from './ports/AccountRepository.js';
export type { ApplicationRepository } from './ports/ApplicationRepository.js';
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { ConceptRepository } from './ports/ConceptRepository.js';
export type { EducationRepository } from './ports/EducationRepository.js';
export type { ExperienceRepository } from './ports/ExperienceRepository.js';
export type { GenerationSettingsRepository } from './ports/GenerationSettingsRepository.js';
export type { JobDescriptionRepository } from './ports/JobDescriptionRepository.js';
export type { JobFitScoreRepository } from './ports/JobFitScoreRepository.js';
export type { PasswordHasher } from './ports/PasswordHasher.js';
export type { ProfileRepository } from './ports/ProfileRepository.js';
export type { ResumeContentRepository } from './ports/ResumeContentRepository.js';
export type { SkillCategoryRepository } from './ports/SkillCategoryRepository.js';
export type { SkillRepository } from './ports/SkillRepository.js';
export type { Result } from './Result.js';
export { err, ok } from './Result.js';
export { ValidationError } from './ValidationError.js';
export { ValueObject } from './ValueObject.js';
// Value objects
export { ApplicationStatus } from './value-objects/ApplicationStatus.js';
export { BusinessType } from './value-objects/BusinessType.js';
export { CacheTier } from './value-objects/CacheTier.js';
export { CompanyStage } from './value-objects/CompanyStage.js';
export { CompanyStatus } from './value-objects/CompanyStatus.js';
export { ConceptKind } from './value-objects/ConceptKind.js';
export type {
  AccomplishmentSnapshot,
  CompanySnapshot,
  EducationSnapshot,
  ExperienceSnapshot,
  GenerationContext,
  JDSnapshot,
  ProfileSnapshot,
  SettingsSnapshot
} from './value-objects/GenerationContext.js';
export { GenerationScope } from './value-objects/GenerationScope.js';
export { Industry } from './value-objects/Industry.js';
export { JobLevel } from './value-objects/JobLevel.js';
export { JobSource } from './value-objects/JobSource.js';
export type { BlockLayout, LayoutAnalysis } from './value-objects/LayoutAnalysis.js';
export { LocationType } from './value-objects/LocationType.js';
export { ModelTier } from './value-objects/ModelTier.js';
export { ResumeConstraints } from './value-objects/ResumeConstraints.js';
export type { ResumeExperience } from './value-objects/ResumeExperience.js';
export type { RequirementCoverage, RequirementScore, ResumeScore } from './value-objects/ResumeScore.js';
export type { ResumeTemplate } from './value-objects/ResumeTemplate.js';
export { DEFAULT_RESUME_TEMPLATE } from './value-objects/ResumeTemplate.js';
export { SalaryRange } from './value-objects/SalaryRange.js';
export type { SkillAlias } from './value-objects/SkillAlias.js';
export { SkillKind } from './value-objects/SkillKind.js';
