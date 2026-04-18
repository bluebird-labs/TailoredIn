import type { Application } from '../entities/Application.js';

export interface ApplicationRepository {
  findById(id: string): Promise<Application | null>;
  findByProfileId(profileId: string): Promise<Application[]>;
  save(application: Application): Promise<void>;
  delete(id: string): Promise<void>;
}
