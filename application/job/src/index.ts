// DI tokens
export { ApplicationJobDI } from './DI.js';

// Ports
export type { JobRepository, FindTopScoredParams, FindScoredParams, UpsertJobProps } from './ports/JobRepository.js';
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { SkillRepository, SkillRefreshOutput } from './ports/SkillRepository.js';
export type { JobElector } from './ports/JobElector.js';
export type { JobScraper, ScrapeResultCallback, FetchJobDetailsDelegate } from './ports/JobScraper.js';

// Use cases
export { IngestScrapedJob } from './use-cases/IngestScrapedJob.js';
export type { IngestScrapedJobResult } from './use-cases/IngestScrapedJob.js';
export { ScrapeAndIngestJobs } from './use-cases/ScrapeAndIngestJobs.js';
export { GetTopJob } from './use-cases/GetTopJob.js';
export type { GetTopJobInput } from './use-cases/GetTopJob.js';
export { GetJob } from './use-cases/GetJob.js';
export type { GetJobInput } from './use-cases/GetJob.js';
export { ChangeJobStatus } from './use-cases/ChangeJobStatus.js';
export type { ChangeJobStatusInput } from './use-cases/ChangeJobStatus.js';

// DTOs
export type { ScrapeResultDto } from './dtos/ScrapeResultDto.js';
export type { JobSummaryDto } from './dtos/JobSummaryDto.js';
export type { JobScoresDto, SkillScoreDto } from './dtos/JobScoresDto.js';
export type { JobSearchConfigDto } from './dtos/JobSearchConfigDto.js';
