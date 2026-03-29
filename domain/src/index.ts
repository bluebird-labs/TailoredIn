// Base building blocks
export { AggregateRoot } from './AggregateRoot.js';
export type { DomainEvent } from './DomainEvent.js';
// Domain services
export { JobElectionService } from './domain-services/JobElectionService.js';
export { TailoringStrategyService } from './domain-services/TailoringStrategyService.js';
export { Entity } from './Entity.js';
export type { CompanyCreateProps } from './entities/Company.js';
export { Company } from './entities/Company.js';
export type { JobPostingCreateProps, JobScores, JobScoresSkillScore } from './entities/JobPosting.js';
// Job entities
export { JobPosting } from './entities/JobPosting.js';
export type { ResumeCreateProps } from './entities/Resume.js';
// Resume entities
export { Resume } from './entities/Resume.js';
export type { SkillCreateProps, SkillRefreshProps } from './entities/Skill.js';
export { Skill } from './entities/Skill.js';
export { JobScrapedEvent } from './events/JobScrapedEvent.js';
// Events
export { JobStatusChangedEvent } from './events/JobStatusChangedEvent.js';
export { ResumeGeneratedEvent } from './events/ResumeGeneratedEvent.js';
export type { Result } from './Result.js';
export { err, ok } from './Result.js';
export { ValueObject } from './ValueObject.js';
export { Archetype, JobTitle } from './value-objects/Archetype.js';
export { CompanyId } from './value-objects/CompanyId.js';
export { JobId } from './value-objects/JobId.js';
// Value objects
export { DISCARDED_JOB_STATUSES, IN_PROCESS_JOB_STATUSES, JobStatus } from './value-objects/JobStatus.js';
export { ResumeId } from './value-objects/ResumeId.js';
export { SkillAffinity } from './value-objects/SkillAffinity.js';
export { SkillId } from './value-objects/SkillId.js';
export { SkillName } from './value-objects/SkillName.js';
export { TailoringScore } from './value-objects/TailoringScore.js';
