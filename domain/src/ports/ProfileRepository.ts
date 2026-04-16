import type { Profile } from '../entities/Profile.js';

export interface ProfileRepository {
  findByIdOrFail(id: string): Promise<Profile>;
  save(profile: Profile): Promise<void>;
}
