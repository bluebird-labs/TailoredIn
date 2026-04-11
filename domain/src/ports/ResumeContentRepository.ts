import type { ResumeContent } from '../entities/ResumeContent.js';

export interface ResumeContentRepository {
  findById(id: string): Promise<ResumeContent | null>;
  findLatestByJobDescriptionId(jobDescriptionId: string): Promise<ResumeContent | null>;
  save(resumeContent: ResumeContent): Promise<void>;
  update(resumeContent: ResumeContent): Promise<void>;
}
