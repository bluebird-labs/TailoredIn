import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  AddAccomplishment,
  CreateApplication,
  CreateCompany,
  CreateEducation,
  CreateExperience,
  CreateJobDescription,
  DeleteAccomplishment,
  DeleteApplication,
  DeleteCompany,
  DeleteEducation,
  DeleteExperience,
  DeleteJobDescription,
  DiscoverCompanies,
  EnrichCompanyData,
  GenerateResumeContent,
  GenerateResumeContentWithPdf,
  GenerateResumePdf,
  GenerationContextBuilder,
  GetApplication,
  GetCachedResumePdf,
  GetCompany,
  GetExperience,
  GetGenerationSettings,
  GetJobDescription,
  GetProfile,
  LinkCompanyToExperience,
  ListApplications,
  ListCompanies,
  ListConcepts,
  ListEducation,
  ListExperiences,
  ListJobDescriptions,
  ListSkillCategories,
  ListSkills,
  Login,
  ParseJobDescription,
  PromptRegistry,
  ScoreJobFit,
  ScoreResume,
  SearchSkills,
  SyncExperienceSkills,
  UnlinkCompanyFromExperience,
  UpdateAccomplishment,
  UpdateApplication,
  UpdateApplicationStatus,
  UpdateCompany,
  UpdateEducation,
  UpdateExperience,
  UpdateGenerationSettings,
  UpdateJobDescription,
  UpdateProfile,
  UpdateResumeDisplaySettings
} from '@tailoredin/application';
import {
  Argon2PasswordHasher,
  BulletParamsSection,
  CareerTimelineSection,
  ClaudeApiCompanyDataProvider,
  ClaudeApiCompanyDiscoveryProvider,
  ClaudeApiFitScorer,
  ClaudeApiJobDescriptionParser,
  ClaudeApiProvider,
  ClaudeApiResumeElementGenerator,
  ClaudeApiResumeScorer,
  CompanyContextSection,
  createBulletRecipe,
  createExperienceBulletsRecipe,
  createExperienceSummaryRecipe,
  createHeadlineRecipe,
  createOrmConfig,
  DI,
  EducationSection,
  ExperienceDetailSection,
  HeadlineInstructionsSection,
  JobDescriptionSection,
  JwtTokenIssuer,
  OtherExperiencesSection,
  OutputConstraintsSection,
  PostgresAccountRepository,
  PostgresApplicationRepository,
  PostgresCompanyRepository,
  PostgresConceptRepository,
  PostgresEducationRepository,
  PostgresExperienceRepository,
  PostgresGenerationSettingsRepository,
  PostgresJobDescriptionRepository,
  PostgresJobFitScoreRepository,
  PostgresProfileRepository,
  PostgresResumeContentRepository,
  PostgresSkillCategoryRepository,
  PostgresSkillRepository,
  ProfileSection,
  RulesSection,
  SettingsSection,
  ToneSection,
  TypstResumeRendererFactory,
  UserInstructionsSection
} from '@tailoredin/infrastructure';
import { ApplicationController } from './application/application.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { CompanyController } from './company/company.controller.js';
import { EnvSchema } from './config/env.schema.js';
import { EducationController } from './education/education.controller.js';
import { ExperienceController } from './experience/experience.controller.js';
import { FactoryController } from './factory/factory.controller.js';
import { GenerationSettingsController } from './generation-settings/generation-settings.controller.js';
import { HealthController } from './health/health.controller.js';
import { JobDescriptionController } from './job-description/job-description.controller.js';
import { ProfileController } from './profile/profile.controller.js';
import { ResumeController } from './resume/resume.controller.js';
import { SkillController } from './skill/skill.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: config => EnvSchema.parse(config)
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createOrmConfig({
          timezone: config.get('TZ')!,
          user: config.get('POSTGRES_USER')!,
          password: config.get('POSTGRES_PASSWORD')!,
          dbName: config.get('POSTGRES_DB')!,
          schema: config.get('POSTGRES_SCHEMA')!,
          host: config.get('POSTGRES_HOST')!,
          port: config.get<number>('POSTGRES_PORT')!
        })
    })
  ],
  controllers: [
    AuthController,
    ProfileController,
    EducationController,
    ExperienceController,
    CompanyController,
    SkillController,
    JobDescriptionController,
    ApplicationController,
    ResumeController,
    GenerationSettingsController,
    FactoryController,
    HealthController
  ],
  providers: [
    // Global auth guard
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Infrastructure: Auth
    { provide: DI.Auth.Repository, useClass: PostgresAccountRepository },
    { provide: DI.Auth.PasswordHasher, useClass: Argon2PasswordHasher },
    {
      provide: DI.Auth.TokenIssuer,
      useFactory: (config: ConfigService) =>
        new JwtTokenIssuer(config.get('JWT_SECRET')!, config.get<number>('JWT_EXPIRES_IN_SECONDS')!),
      inject: [ConfigService]
    },
    { provide: DI.Auth.Login, useClass: Login },

    // Infrastructure: Repositories
    { provide: DI.Profile.Repository, useClass: PostgresProfileRepository },
    { provide: DI.Education.Repository, useClass: PostgresEducationRepository },
    { provide: DI.Experience.Repository, useClass: PostgresExperienceRepository },
    { provide: DI.Company.Repository, useClass: PostgresCompanyRepository },
    { provide: DI.Skill.Repository, useClass: PostgresSkillRepository },
    { provide: DI.Skill.CategoryRepository, useClass: PostgresSkillCategoryRepository },
    { provide: DI.Skill.ConceptRepository, useClass: PostgresConceptRepository },
    { provide: DI.Application.Repository, useClass: PostgresApplicationRepository },
    { provide: DI.JobDescription.Repository, useClass: PostgresJobDescriptionRepository },
    { provide: DI.JobDescription.FitScoreRepository, useClass: PostgresJobFitScoreRepository },
    { provide: DI.ResumeContent.Repository, useClass: PostgresResumeContentRepository },
    { provide: DI.GenerationSettings.Repository, useClass: PostgresGenerationSettingsRepository },

    // Infrastructure: External services
    {
      provide: DI.Llm.ClaudeApiKey,
      useFactory: (config: ConfigService) => config.get('CLAUDE_API_KEY') ?? '',
      inject: [ConfigService]
    },
    { provide: DI.Llm.ClaudeApiProvider, useClass: ClaudeApiProvider },
    { provide: DI.Company.DataProvider, useClass: ClaudeApiCompanyDataProvider },
    { provide: DI.Company.DiscoveryProvider, useClass: ClaudeApiCompanyDiscoveryProvider },
    { provide: DI.JobDescription.Parser, useClass: ClaudeApiJobDescriptionParser },
    { provide: DI.JobDescription.FitScorer, useClass: ClaudeApiFitScorer },
    { provide: DI.Resume.ElementGenerator, useClass: ClaudeApiResumeElementGenerator },
    { provide: DI.Resume.Scorer, useClass: ClaudeApiResumeScorer },
    { provide: DI.Resume.RendererFactory, useClass: TypstResumeRendererFactory },

    // Resume: Prompt pipeline
    {
      provide: DI.Resume.PromptRegistry,
      useFactory: () => {
        const sections = {
          rules: new RulesSection(),
          outputConstraints: new OutputConstraintsSection(),
          profile: new ProfileSection(),
          tone: new ToneSection(),
          companyContext: new CompanyContextSection(),
          education: new EducationSection(),
          settings: new SettingsSection(),
          jobDescription: new JobDescriptionSection(),
          experienceDetail: new ExperienceDetailSection(),
          otherExperiences: new OtherExperiencesSection(),
          userInstructions: new UserInstructionsSection(),
          bulletParams: new BulletParamsSection(),
          headlineInstructions: new HeadlineInstructionsSection(),
          careerTimeline: new CareerTimelineSection()
        };
        const defaultModel = 'claude-sonnet-4-6';
        return new PromptRegistry([
          createHeadlineRecipe(sections, defaultModel),
          createExperienceBulletsRecipe(sections, defaultModel),
          createExperienceSummaryRecipe(sections, defaultModel),
          createBulletRecipe(sections, defaultModel)
        ]);
      }
    },

    // Use cases: Profile
    { provide: DI.Profile.GetProfile, useClass: GetProfile },
    { provide: DI.Profile.UpdateProfile, useClass: UpdateProfile },

    // Use cases: Education
    { provide: DI.Education.ListEducation, useClass: ListEducation },
    { provide: DI.Education.CreateEducation, useClass: CreateEducation },
    { provide: DI.Education.UpdateEducation, useClass: UpdateEducation },
    { provide: DI.Education.DeleteEducation, useClass: DeleteEducation },

    // Use cases: Experience
    { provide: DI.Experience.List, useClass: ListExperiences },
    { provide: DI.Experience.Get, useClass: GetExperience },
    { provide: DI.Experience.Create, useClass: CreateExperience },
    { provide: DI.Experience.Update, useClass: UpdateExperience },
    { provide: DI.Experience.Delete, useClass: DeleteExperience },
    { provide: DI.Experience.AddAccomplishment, useClass: AddAccomplishment },
    { provide: DI.Experience.UpdateAccomplishment, useClass: UpdateAccomplishment },
    { provide: DI.Experience.DeleteAccomplishment, useClass: DeleteAccomplishment },
    { provide: DI.Experience.LinkCompany, useClass: LinkCompanyToExperience },
    { provide: DI.Experience.UnlinkCompany, useClass: UnlinkCompanyFromExperience },

    // Use cases: Skill
    { provide: DI.Skill.List, useClass: ListSkills },
    { provide: DI.Skill.Search, useClass: SearchSkills },
    { provide: DI.Skill.ListCategories, useClass: ListSkillCategories },
    { provide: DI.Skill.ListConcepts, useClass: ListConcepts },
    { provide: DI.Skill.SyncExperienceSkills, useClass: SyncExperienceSkills },

    // Use cases: Company
    { provide: DI.Company.List, useClass: ListCompanies },
    { provide: DI.Company.Get, useClass: GetCompany },
    { provide: DI.Company.Create, useClass: CreateCompany },
    { provide: DI.Company.Update, useClass: UpdateCompany },
    { provide: DI.Company.Delete, useClass: DeleteCompany },
    { provide: DI.Company.Enrich, useClass: EnrichCompanyData },
    { provide: DI.Company.Discover, useClass: DiscoverCompanies },

    // Use cases: Application
    { provide: DI.Application.Create, useClass: CreateApplication },
    { provide: DI.Application.Get, useClass: GetApplication },
    { provide: DI.Application.List, useClass: ListApplications },
    { provide: DI.Application.Update, useClass: UpdateApplication },
    { provide: DI.Application.UpdateStatus, useClass: UpdateApplicationStatus },
    { provide: DI.Application.Delete, useClass: DeleteApplication },

    // Use cases: Job Description
    { provide: DI.JobDescription.List, useClass: ListJobDescriptions },
    { provide: DI.JobDescription.Get, useClass: GetJobDescription },
    { provide: DI.JobDescription.Create, useClass: CreateJobDescription },
    { provide: DI.JobDescription.Update, useClass: UpdateJobDescription },
    { provide: DI.JobDescription.Delete, useClass: DeleteJobDescription },
    { provide: DI.JobDescription.Parse, useClass: ParseJobDescription },
    { provide: DI.JobDescription.ScoreFit, useClass: ScoreJobFit },

    // Use cases: Generation Settings
    { provide: DI.GenerationSettings.Get, useClass: GetGenerationSettings },
    { provide: DI.GenerationSettings.Update, useClass: UpdateGenerationSettings },

    // Use cases: Resume
    { provide: DI.Resume.ContextBuilder, useClass: GenerationContextBuilder },
    { provide: DI.Resume.Generate, useClass: GenerateResumeContent },
    { provide: DI.Resume.GeneratePdf, useClass: GenerateResumePdf },
    { provide: DI.Resume.GenerateContentWithPdf, useClass: GenerateResumeContentWithPdf },
    { provide: DI.Resume.GetCachedPdf, useClass: GetCachedResumePdf },
    { provide: DI.Resume.UpdateDisplaySettings, useClass: UpdateResumeDisplaySettings },
    { provide: DI.Resume.Score, useClass: ScoreResume }
  ]
})
export class AppModule {}
