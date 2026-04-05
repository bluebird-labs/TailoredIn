import type { Application } from '../entities/Application.js';
import type { ApplicationId } from '../value-objects/ApplicationId.js';

export interface ApplicationRepository {
  findById(id: ApplicationId): Promise<Application | null>;
  findByProfileId(profileId: string): Promise<Application[]>;
  save(application: Application): Promise<void>;
  delete(id: ApplicationId): Promise<void>;
}
