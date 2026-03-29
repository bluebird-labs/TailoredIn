// Ports

export type { GenerateResumeDto } from './dtos/GenerateResumeDto.js';
export type { JobScoresDto, SkillScoreDto } from './dtos/JobScoresDto.js';
export type { JobSearchConfigDto } from './dtos/JobSearchConfigDto.js';
export type { JobSummaryDto } from './dtos/JobSummaryDto.js';
export type {
  ResumeContentDto,
  ResumeEducationDto,
  ResumeExperienceDto,
  ResumePersonalDto,
  ResumeSkillDto
} from './dtos/ResumeContentDto.js';
export type { ResumeOutputDto } from './dtos/ResumeOutputDto.js';
// DTOs
export type { ScrapeResultDto } from './dtos/ScrapeResultDto.js';
export type { CompanyRepository } from './ports/CompanyRepository.js';
export type { JobElector } from './ports/JobElector.js';
export type { FindScoredParams, FindTopScoredParams, JobRepository, UpsertJobProps } from './ports/JobRepository.js';
export type { FetchJobDetailsDelegate, JobScraper, ScrapeResultCallback } from './ports/JobScraper.js';
export type {
  ApplicationInsightsDto,
  ExtractApplicationInsightsInput,
  ExtractJobPostingInsightsInput,
  JobPostingInsightsDto,
  LlmService
} from './ports/LlmService.js';
export type { MakeResumeContentInput, ResumeContentFactory } from './ports/ResumeContentFactory.js';
export type { RenderResumeInput, ResumeRenderer } from './ports/ResumeRenderer.js';
export type { SkillRefreshOutput, SkillRepository } from './ports/SkillRepository.js';
export type { ColorPaletteDto, WebColorService } from './ports/WebColorService.js';
export type { ChangeJobStatusInput } from './use-cases/ChangeJobStatus.js';
export { ChangeJobStatus } from './use-cases/ChangeJobStatus.js';
export { GenerateResume } from './use-cases/GenerateResume.js';
export type { GetJobInput } from './use-cases/GetJob.js';
export { GetJob } from './use-cases/GetJob.js';
export type { GetTopJobInput } from './use-cases/GetTopJob.js';
export { GetTopJob } from './use-cases/GetTopJob.js';
export type { IngestScrapedJobResult } from './use-cases/IngestScrapedJob.js';
// Use cases
export { IngestScrapedJob } from './use-cases/IngestScrapedJob.js';
export { ScrapeAndIngestJobs } from './use-cases/ScrapeAndIngestJobs.js';
