// DTOs — job discovery

export type {
  ArchetypeConfigDto,
  ArchetypePositionBulletDto,
  ArchetypePositionDto
} from './dtos/ArchetypeConfigDto.js';
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
// DTOs — resume data
export type {
  ResumeBulletDto,
  ResumeCompanyDto,
  ResumeEducationEntryDto,
  ResumeHeadlineDto,
  ResumeLocationDto,
  ResumeSkillCategoryDto,
  ResumeSkillItemDto,
  UserDto
} from './dtos/ResumeDataDto.js';
export type { ResumeOutputDto } from './dtos/ResumeOutputDto.js';
export type { ScrapeResultDto } from './dtos/ScrapeResultDto.js';
// Ports — application-level (service adapters, not repositories)
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
export type { ColorPaletteDto, WebColorService } from './ports/WebColorService.js';

// Use cases
export type { ChangeJobStatusInput } from './use-cases/ChangeJobStatus.js';
export { ChangeJobStatus } from './use-cases/ChangeJobStatus.js';
export { GenerateResume } from './use-cases/GenerateResume.js';
export type { GetJobInput } from './use-cases/GetJob.js';
export { GetJob } from './use-cases/GetJob.js';
export type { GetTopJobInput } from './use-cases/GetTopJob.js';
export { GetTopJob } from './use-cases/GetTopJob.js';
export type { IngestScrapedJobResult } from './use-cases/IngestScrapedJob.js';
export { IngestScrapedJob } from './use-cases/IngestScrapedJob.js';
export { ScrapeAndIngestJobs } from './use-cases/ScrapeAndIngestJobs.js';
