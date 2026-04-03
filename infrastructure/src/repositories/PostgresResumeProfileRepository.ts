import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { ResumeProfileRepository } from '@tailoredin/application';
import { ContentSelection, ResumeProfile } from '@tailoredin/domain';
import { ResumeProfileOrm } from '../db/entities/resume-profile/ResumeProfileOrm.js';

@injectable()
export class PostgresResumeProfileRepository implements ResumeProfileRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByProfileId(profileId: string): Promise<ResumeProfile | null> {
    const orm = await this.orm.em.findOne(ResumeProfileOrm, { profileId });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  public async save(profile: ResumeProfile): Promise<void> {
    const existing = await this.orm.em.findOne(ResumeProfileOrm, { profileId: profile.profileId });
    const contentJson = this.serializeContentSelection(profile.contentSelection);

    if (existing) {
      existing.contentSelection = contentJson;
      existing.headlineText = profile.headlineText;
      existing.updatedAt = profile.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const ormEntity = new ResumeProfileOrm({
        profileId: profile.profileId,
        contentSelection: contentJson,
        headlineText: profile.headlineText,
        updatedAt: profile.updatedAt
      });
      this.orm.em.persist(ormEntity);
    }

    await this.orm.em.flush();
  }

  private toDomain(orm: ResumeProfileOrm): ResumeProfile {
    const cs = orm.contentSelection as Record<string, unknown>;
    const contentSelection = new ContentSelection({
      experienceSelections: (cs.experienceSelections as { experienceId: string; accomplishmentIds: string[] }[]) ?? [],
      projectIds: (cs.projectIds as string[]) ?? [],
      educationIds: (cs.educationIds as string[]) ?? [],
      skillCategoryIds: (cs.skillCategoryIds as string[]) ?? [],
      skillItemIds: (cs.skillItemIds as string[]) ?? []
    });

    return new ResumeProfile({
      profileId: orm.profileId,
      headlineText: orm.headlineText,
      contentSelection,
      updatedAt: orm.updatedAt
    });
  }

  private serializeContentSelection(cs: ContentSelection): Record<string, unknown> {
    return {
      experienceSelections: cs.experienceSelections,
      projectIds: cs.projectIds,
      educationIds: cs.educationIds,
      skillCategoryIds: cs.skillCategoryIds,
      skillItemIds: cs.skillItemIds
    };
  }
}
