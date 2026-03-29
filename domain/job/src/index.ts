// Entities
export { JobPosting } from './entities/JobPosting.js';
export type { JobPostingCreateProps, JobScores, JobScoresSkillScore } from './entities/JobPosting.js';
export { Company } from './entities/Company.js';
export type { CompanyCreateProps } from './entities/Company.js';
export { Skill } from './entities/Skill.js';
export type { SkillCreateProps, SkillRefreshProps } from './entities/Skill.js';

// Value objects
export { JobStatus, IN_PROCESS_JOB_STATUSES, DISCARDED_JOB_STATUSES } from './value-objects/JobStatus.js';
export { SkillAffinity } from './value-objects/SkillAffinity.js';
export { SkillName } from './value-objects/SkillName.js';
export { Archetype, JobTitle } from './value-objects/Archetype.js';
export { JobId } from './value-objects/JobId.js';
export { CompanyId } from './value-objects/CompanyId.js';
export { SkillId } from './value-objects/SkillId.js';

// Domain services
export { JobElectionService } from './domain-services/JobElectionService.js';

// Events
export { JobStatusChangedEvent } from './events/JobStatusChangedEvent.js';
export { JobScrapedEvent } from './events/JobScrapedEvent.js';
