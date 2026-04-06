import type { ResumeContent } from '../entities/ResumeContent.js';

export interface ResumeContentRepository {
  findLatestByJobDescriptionId(jobDescriptionId: string): Promise<ResumeContent | null>;
  save(resumeContent: ResumeContent): Promise<void>;
}
