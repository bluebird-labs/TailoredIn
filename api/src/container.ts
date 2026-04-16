import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
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
import { env, envInt, envOptional } from '@tailoredin/core';
import {
  BulletParamsSection,
  BunPasswordHasher,
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

const orm = await MikroORM.init(
  createOrmConfig({
    timezone: env('TZ'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
    dbName: env('POSTGRES_DB'),
    schema: env('POSTGRES_SCHEMA'),
    host: env('POSTGRES_HOST'),
    port: envInt('POSTGRES_PORT')
  })
);

const container = new Container();

// Infrastructure: ORM
container.bind({ provide: MikroORM, useValue: orm });

// Auth
container.bind({ provide: DI.Auth.Repository, useClass: PostgresAccountRepository });
container.bind({ provide: DI.Auth.PasswordHasher, useClass: BunPasswordHasher });
container.bind({
  provide: DI.Auth.TokenIssuer,
  useFactory: () => new JwtTokenIssuer(env('JWT_SECRET'), envInt('JWT_EXPIRES_IN_SECONDS'))
});
container.bind({
  provide: DI.Auth.Login,
  useFactory: () =>
    new Login(
      container.get(DI.Auth.Repository),
      container.get(DI.Auth.PasswordHasher),
      container.get(DI.Auth.TokenIssuer)
    )
});

// Profile
container.bind({ provide: DI.Profile.Repository, useClass: PostgresProfileRepository });
container.bind({
  provide: DI.Profile.GetProfile,
  useFactory: () => new GetProfile(container.get(DI.Profile.Repository))
});
container.bind({
  provide: DI.Profile.UpdateProfile,
  useFactory: () => new UpdateProfile(container.get(DI.Profile.Repository))
});

// Education
container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
container.bind({
  provide: DI.Education.ListEducation,
  useFactory: () => new ListEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.CreateEducation,
  useFactory: () => new CreateEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.UpdateEducation,
  useFactory: () => new UpdateEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.DeleteEducation,
  useFactory: () => new DeleteEducation(container.get(DI.Education.Repository))
});

// Experience
container.bind({ provide: DI.Experience.Repository, useClass: PostgresExperienceRepository });
container.bind({
  provide: DI.Experience.List,
  useFactory: () =>
    new ListExperiences(
      container.get(DI.Experience.Repository),
      container.get(DI.Company.Repository),
      container.get(DI.Skill.Repository)
    )
});
container.bind({
  provide: DI.Experience.Create,
  useFactory: () =>
    new CreateExperience(container.get(DI.Experience.Repository), container.get(DI.GenerationSettings.Repository))
});
container.bind({
  provide: DI.Experience.Update,
  useFactory: () => new UpdateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Delete,
  useFactory: () => new DeleteExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.AddAccomplishment,
  useFactory: () => new AddAccomplishment(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.UpdateAccomplishment,
  useFactory: () => new UpdateAccomplishment(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.DeleteAccomplishment,
  useFactory: () => new DeleteAccomplishment(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Get,
  useFactory: () =>
    new GetExperience(
      container.get(DI.Experience.Repository),
      container.get(DI.Company.Repository),
      container.get(DI.Skill.Repository)
    )
});
container.bind({
  provide: DI.Experience.LinkCompany,
  useFactory: () =>
    new LinkCompanyToExperience(container.get(DI.Experience.Repository), container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Experience.UnlinkCompany,
  useFactory: () => new UnlinkCompanyFromExperience(container.get(DI.Experience.Repository))
});

// Skill
container.bind({ provide: DI.Skill.Repository, useClass: PostgresSkillRepository });
container.bind({ provide: DI.Skill.CategoryRepository, useClass: PostgresSkillCategoryRepository });
container.bind({
  provide: DI.Skill.List,
  useFactory: () => new ListSkills(container.get(DI.Skill.Repository), container.get(DI.Skill.CategoryRepository))
});
container.bind({
  provide: DI.Skill.Search,
  useFactory: () => new SearchSkills(container.get(DI.Skill.Repository), container.get(DI.Skill.CategoryRepository))
});
container.bind({
  provide: DI.Skill.ListCategories,
  useFactory: () => new ListSkillCategories(container.get(DI.Skill.CategoryRepository))
});
container.bind({
  provide: DI.Skill.SyncExperienceSkills,
  useFactory: () =>
    new SyncExperienceSkills(
      container.get(DI.Experience.Repository),
      container.get(DI.Skill.Repository),
      container.get(DI.Company.Repository)
    )
});
container.bind({ provide: DI.Skill.ConceptRepository, useClass: PostgresConceptRepository });
container.bind({
  provide: DI.Skill.ListConcepts,
  useFactory: () => new ListConcepts(container.get(DI.Skill.ConceptRepository))
});

// LLM
container.bind({ provide: DI.Llm.ClaudeApiKey, useValue: envOptional('CLAUDE_API_KEY') ?? '' });
container.bind({ provide: DI.Llm.ClaudeApiProvider, useClass: ClaudeApiProvider });

// Company
container.bind({ provide: DI.Company.Repository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Company.DataProvider, useClass: ClaudeApiCompanyDataProvider });
container.bind({ provide: DI.Company.DiscoveryProvider, useClass: ClaudeApiCompanyDiscoveryProvider });
container.bind({
  provide: DI.Company.Enrich,
  useFactory: () => new EnrichCompanyData(container.get(DI.Company.DataProvider))
});
container.bind({
  provide: DI.Company.Discover,
  useFactory: () => new DiscoverCompanies(container.get(DI.Company.DiscoveryProvider))
});
container.bind({
  provide: DI.Company.List,
  useFactory: () => new ListCompanies(container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Company.Create,
  useFactory: () => new CreateCompany(container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Company.Update,
  useFactory: () => new UpdateCompany(container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Company.Get,
  useFactory: () => new GetCompany(container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Company.Delete,
  useFactory: () => new DeleteCompany(container.get(DI.Company.Repository))
});

// Application (job applications)
container.bind({ provide: DI.Application.Repository, useClass: PostgresApplicationRepository });
container.bind({
  provide: DI.Application.Create,
  useFactory: () => new CreateApplication(container.get(DI.Application.Repository))
});
container.bind({
  provide: DI.Application.Get,
  useFactory: () => new GetApplication(container.get(DI.Application.Repository))
});
container.bind({
  provide: DI.Application.List,
  useFactory: () => new ListApplications(container.get(DI.Application.Repository))
});
container.bind({
  provide: DI.Application.Update,
  useFactory: () => new UpdateApplication(container.get(DI.Application.Repository))
});
container.bind({
  provide: DI.Application.UpdateStatus,
  useFactory: () =>
    new UpdateApplicationStatus(container.get(DI.Application.Repository), container.get(DI.ResumeContent.Repository))
});
container.bind({
  provide: DI.Application.Delete,
  useFactory: () => new DeleteApplication(container.get(DI.Application.Repository))
});

// Job Descriptions
container.bind({ provide: DI.JobDescription.Repository, useClass: PostgresJobDescriptionRepository });
container.bind({ provide: DI.JobDescription.Parser, useClass: ClaudeApiJobDescriptionParser });
container.bind({
  provide: DI.JobDescription.Parse,
  useFactory: () => new ParseJobDescription(container.get(DI.JobDescription.Parser))
});
container.bind({
  provide: DI.JobDescription.Create,
  useFactory: () => new CreateJobDescription(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.JobDescription.Get,
  useFactory: () =>
    new GetJobDescription(
      container.get(DI.JobDescription.Repository),
      container.get(DI.ResumeContent.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.Company.Repository),
      container.get(DI.JobDescription.FitScoreRepository)
    )
});
container.bind({
  provide: DI.JobDescription.List,
  useFactory: () =>
    new ListJobDescriptions(
      container.get(DI.JobDescription.Repository),
      container.get(DI.Company.Repository),
      container.get(DI.JobDescription.FitScoreRepository)
    )
});
container.bind({
  provide: DI.JobDescription.Update,
  useFactory: () => new UpdateJobDescription(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.JobDescription.Delete,
  useFactory: () => new DeleteJobDescription(container.get(DI.JobDescription.Repository))
});
container.bind({ provide: DI.JobDescription.FitScoreRepository, useClass: PostgresJobFitScoreRepository });
container.bind({ provide: DI.JobDescription.FitScorer, useClass: ClaudeApiFitScorer });
container.bind({
  provide: DI.JobDescription.ScoreFit,
  useFactory: () =>
    new ScoreJobFit(
      container.get(DI.Profile.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.Company.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.JobDescription.FitScoreRepository),
      container.get(DI.JobDescription.FitScorer)
    )
});

// Resume Content
container.bind({ provide: DI.ResumeContent.Repository, useClass: PostgresResumeContentRepository });

// Generation Settings
container.bind({ provide: DI.GenerationSettings.Repository, useClass: PostgresGenerationSettingsRepository });
container.bind({
  provide: DI.GenerationSettings.Get,
  useFactory: () => new GetGenerationSettings(container.get(DI.GenerationSettings.Repository))
});
container.bind({
  provide: DI.GenerationSettings.Update,
  useFactory: () => new UpdateGenerationSettings(container.get(DI.GenerationSettings.Repository))
});

// Resume — prompt pipeline
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
const promptRegistry = new PromptRegistry([
  createHeadlineRecipe(sections, defaultModel),
  createExperienceBulletsRecipe(sections, defaultModel),
  createExperienceSummaryRecipe(sections, defaultModel),
  createBulletRecipe(sections, defaultModel)
]);

container.bind({ provide: DI.Resume.PromptRegistry, useValue: promptRegistry });
container.bind({ provide: DI.Resume.ElementGenerator, useClass: ClaudeApiResumeElementGenerator });
container.bind({
  provide: DI.Resume.ContextBuilder,
  useFactory: () =>
    new GenerationContextBuilder(
      container.get(DI.Profile.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.Education.Repository),
      container.get(DI.Company.Repository),
      container.get(DI.GenerationSettings.Repository)
    )
});
container.bind({
  provide: DI.Resume.Generate,
  useFactory: () =>
    new GenerateResumeContent(
      container.get(DI.Resume.ContextBuilder),
      container.get(DI.Resume.PromptRegistry),
      container.get(DI.Resume.ElementGenerator),
      container.get(DI.ResumeContent.Repository),
      container.get(DI.Education.Repository)
    )
});
container.bind({ provide: DI.Resume.RendererFactory, useClass: TypstResumeRendererFactory });
container.bind({
  provide: DI.Resume.GeneratePdf,
  useFactory: () =>
    new GenerateResumePdf(
      container.get(DI.Profile.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.Education.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.ResumeContent.Repository),
      container.get(DI.Resume.RendererFactory)
    )
});
container.bind({
  provide: DI.Resume.GenerateContentWithPdf,
  useFactory: () =>
    new GenerateResumeContentWithPdf(container.get(DI.Resume.Generate), container.get(DI.Resume.GeneratePdf))
});
container.bind({
  provide: DI.Resume.GetCachedPdf,
  useFactory: () => new GetCachedResumePdf(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.Resume.UpdateDisplaySettings,
  useFactory: () => new UpdateResumeDisplaySettings(container.get(DI.ResumeContent.Repository))
});
container.bind({ provide: DI.Resume.Scorer, useClass: ClaudeApiResumeScorer });
container.bind({
  provide: DI.Resume.Score,
  useFactory: () =>
    new ScoreResume(
      container.get(DI.ResumeContent.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.Resume.Scorer)
    )
});

export { container };
