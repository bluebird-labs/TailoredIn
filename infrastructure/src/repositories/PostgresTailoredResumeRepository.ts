import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { TailoredResumeRepository } from '@tailoredin/application';
import {
  ContentSelection,
  GeneratedContent,
  type GeneratedExperience,
  LlmProposal,
  TailoredResume,
  TailoredResumeId,
  type TailoredResumeStatus
} from '@tailoredin/domain';
import { TailoredResumeOrm } from '../db/entities/tailored-resume/TailoredResumeOrm.js';

@injectable()
export class PostgresTailoredResumeRepository implements TailoredResumeRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findById(id: TailoredResumeId): Promise<TailoredResume | null> {
    const orm = await this.orm.em.findOne(TailoredResumeOrm, { id: id.value });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  public async findByProfileId(profileId: string): Promise<TailoredResume[]> {
    const ormEntities = await this.orm.em.find(TailoredResumeOrm, { profileId }, { orderBy: { createdAt: 'DESC' } });
    return ormEntities.map(e => this.toDomain(e));
  }

  public async save(resume: TailoredResume): Promise<void> {
    const existing = await this.orm.em.findOne(TailoredResumeOrm, { id: resume.id.value });
    const llmProposalsJson = this.serializeLlmProposal(resume.llmProposals);
    const contentSelectionJson = this.serializeContentSelection(resume.contentSelection);
    const generatedContentJson = resume.generatedContent.isEmpty()
      ? null
      : { experiences: resume.generatedContent.experiences };

    if (existing) {
      existing.jdContent = resume.jdContent;
      existing.llmProposals = llmProposalsJson;
      existing.contentSelection = contentSelectionJson;
      existing.generatedContent = generatedContentJson;
      existing.headlineText = resume.headlineText;
      existing.status = resume.status;
      existing.pdfPath = resume.pdfPath;
      this.orm.em.persist(existing);
    } else {
      const ormEntity = new TailoredResumeOrm({
        id: resume.id.value,
        profileId: resume.profileId,
        jdContent: resume.jdContent,
        llmProposals: llmProposalsJson,
        contentSelection: contentSelectionJson,
        generatedContent: generatedContentJson,
        headlineText: resume.headlineText,
        status: resume.status,
        pdfPath: resume.pdfPath,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      });
      this.orm.em.persist(ormEntity);
    }

    await this.orm.em.flush();
  }

  private toDomain(orm: TailoredResumeOrm): TailoredResume {
    const proposals = orm.llmProposals as Record<string, unknown>;
    const llmProposals = new LlmProposal({
      headlineOptions: (proposals.headlineOptions as string[]) ?? [],
      rankedExperiences:
        (proposals.rankedExperiences as Array<{ experienceId: string; rankedBulletIds: string[] }>) ?? [],
      generatedExperiences: (proposals.generatedExperiences as GeneratedExperience[]) ?? [],
      rankedSkillIds: (proposals.rankedSkillIds as string[]) ?? [],
      assessment: (proposals.assessment as string) ?? ''
    });

    const cs = orm.contentSelection as Record<string, unknown>;
    const contentSelection = new ContentSelection({
      experienceSelections: (cs.experienceSelections as { experienceId: string; bulletIds: string[] }[]) ?? [],
      projectIds: (cs.projectIds as string[]) ?? [],
      educationIds: (cs.educationIds as string[]) ?? [],
      skillCategoryIds: (cs.skillCategoryIds as string[]) ?? [],
      skillItemIds: (cs.skillItemIds as string[]) ?? []
    });

    const gc = orm.generatedContent as Record<string, unknown> | null;
    const generatedContent = gc
      ? new GeneratedContent((gc.experiences as GeneratedExperience[]) ?? [])
      : GeneratedContent.empty();

    return new TailoredResume({
      id: new TailoredResumeId(orm.id),
      profileId: orm.profileId,
      jdContent: orm.jdContent,
      llmProposals,
      contentSelection,
      generatedContent,
      headlineText: orm.headlineText,
      status: orm.status as TailoredResumeStatus,
      pdfPath: orm.pdfPath,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }

  private serializeLlmProposal(proposal: LlmProposal): Record<string, unknown> {
    return {
      headlineOptions: proposal.headlineOptions,
      rankedExperiences: proposal.rankedExperiences,
      generatedExperiences: proposal.generatedExperiences,
      rankedSkillIds: proposal.rankedSkillIds,
      assessment: proposal.assessment
    };
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
