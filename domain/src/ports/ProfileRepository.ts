import type { Profile } from '../entities/Profile.js';

export interface ProfileRepository {
  findSingle(): Promise<Profile>;
  save(profile: Profile): Promise<void>;
}
