import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type {
  ContentSelectionDto,
  CreateTailoredResume,
  GenerateTailoredResumePdf,
  GetTailoredResume,
  ListTailoredResumes,
  UpdateTailoredResume
} from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

const contentSelectionSchema = t.Object({
  experience_selections: t.Array(
    t.Object({
      experience_id: t.String({ format: 'uuid' }),
      bullet_ids: t.Array(t.String({ format: 'uuid' }))
    })
  ),
  project_ids: t.Array(t.String({ format: 'uuid' })),
  education_ids: t.Array(t.String({ format: 'uuid' })),
  skill_category_ids: t.Array(t.String({ format: 'uuid' })),
  skill_item_ids: t.Array(t.String({ format: 'uuid' }))
});

function bodyToContentSelectionDto(body: {
  experience_selections: Array<{ experience_id: string; bullet_ids: string[] }>;
  project_ids: string[];
  education_ids: string[];
  skill_category_ids: string[];
  skill_item_ids: string[];
}): ContentSelectionDto {
  return {
    experienceSelections: body.experience_selections.map(s => ({
      experienceId: s.experience_id,
      bulletIds: s.bullet_ids
    })),
    projectIds: body.project_ids,
    educationIds: body.education_ids,
    skillCategoryIds: body.skill_category_ids,
    skillItemIds: body.skill_item_ids
  };
}

function serializeResume(resume: {
  id: { value: string };
  profileId: string;
  jdContent: string;
  llmProposals: {
    headlineOptions: string[];
    rankedExperiences: Array<{ experienceId: string; rankedBulletIds: string[] }>;
    rankedSkillIds: string[];
    assessment: string;
  };
  contentSelection: {
    experienceSelections: Array<{ experienceId: string; bulletIds: string[] }>;
    projectIds: string[];
    educationIds: string[];
    skillCategoryIds: string[];
    skillItemIds: string[];
  };
  headlineText: string;
  status: string;
  pdfPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: resume.id.value,
    profileId: resume.profileId,
    jdContent: resume.jdContent,
    llmProposals: {
      headlineOptions: resume.llmProposals.headlineOptions,
      rankedExperiences: resume.llmProposals.rankedExperiences,
      rankedSkillIds: resume.llmProposals.rankedSkillIds,
      assessment: resume.llmProposals.assessment
    },
    contentSelection: {
      experienceSelections: resume.contentSelection.experienceSelections,
      projectIds: resume.contentSelection.projectIds,
      educationIds: resume.contentSelection.educationIds,
      skillCategoryIds: resume.contentSelection.skillCategoryIds,
      skillItemIds: resume.contentSelection.skillItemIds
    },
    headlineText: resume.headlineText,
    status: resume.status,
    pdfPath: resume.pdfPath,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt
  };
}

@injectable()
export class TailoredResumeRoutes {
  public constructor(
    private readonly listTailoredResumes: ListTailoredResumes = inject(DI.TailoredResume.List),
    private readonly createTailoredResume: CreateTailoredResume = inject(DI.TailoredResume.Create),
    private readonly getTailoredResume: GetTailoredResume = inject(DI.TailoredResume.Get),
    private readonly updateTailoredResume: UpdateTailoredResume = inject(DI.TailoredResume.Update),
    private readonly generateTailoredResumePdf: GenerateTailoredResumePdf = inject(DI.TailoredResume.GeneratePdf),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia()
      .get('/resumes/tailored', async () => {
        const profileId = await getProfileId(this.orm);
        const resumes = await this.listTailoredResumes.execute({ profileId });
        return { data: resumes.map(serializeResume) };
      })
      .post(
        '/resumes/tailored',
        async ({ body, set }) => {
          const profileId = await getProfileId(this.orm);
          const resume = await this.createTailoredResume.execute({
            profileId,
            jdContent: body.jd_content
          });
          set.status = 201;
          return { data: serializeResume(resume) };
        },
        {
          body: t.Object({
            jd_content: t.String({ minLength: 1 })
          })
        }
      )
      .get(
        '/resumes/tailored/:id',
        async ({ params }) => {
          const resume = await this.getTailoredResume.execute({ resumeId: params.id });
          if (!resume) {
            return { data: null };
          }
          return { data: serializeResume(resume) };
        },
        {
          params: t.Object({ id: t.String({ format: 'uuid' }) })
        }
      )
      .put(
        '/resumes/tailored/:id',
        async ({ params, body }) => {
          await this.updateTailoredResume.execute({
            resumeId: params.id,
            contentSelection: bodyToContentSelectionDto(body.content_selection),
            headlineText: body.headline_text
          });
          const resume = await this.getTailoredResume.execute({ resumeId: params.id });
          return { data: resume ? serializeResume(resume) : null };
        },
        {
          params: t.Object({ id: t.String({ format: 'uuid' }) }),
          body: t.Object({
            content_selection: contentSelectionSchema,
            headline_text: t.String()
          })
        }
      )
      .post(
        '/resumes/tailored/:id/generate-pdf',
        async ({ params, set }) => {
          const result = await this.generateTailoredResumePdf.execute({ resumeId: params.id });
          set.status = 201;
          return { data: { pdfPath: result.pdfPath } };
        },
        {
          params: t.Object({ id: t.String({ format: 'uuid' }) })
        }
      );
  }
}
