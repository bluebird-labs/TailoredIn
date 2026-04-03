import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type {
  CreateTailoredResume,
  GenerateTailoredResumePdf,
  GetTailoredResume,
  ListTailoredResumes,
  UpdateTailoredResume
} from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';
import { bodyToContentSelectionDto, contentSelectionSchema } from './content-selection-schema.js';

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
        async ({ params, set }) => {
          const resume = await this.getTailoredResume.execute({ resumeId: params.id });
          if (!resume) {
            set.status = 404;
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
        async ({ params, body, set }) => {
          await this.updateTailoredResume.execute({
            resumeId: params.id,
            contentSelection: bodyToContentSelectionDto(body.content_selection),
            headlineText: body.headline_text
          });
          const resume = await this.getTailoredResume.execute({ resumeId: params.id });
          if (!resume) {
            set.status = 404;
            return { data: null };
          }
          return { data: serializeResume(resume) };
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
        async ({ params }) => {
          const result = await this.generateTailoredResumePdf.execute({ resumeId: params.id });
          return { data: { pdfPath: result.pdfPath } };
        },
        {
          params: t.Object({ id: t.String({ format: 'uuid' }) })
        }
      );
  }
}
