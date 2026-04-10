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
  ListEducation,
  ListExperiences,
  ListJobDescriptions,
  ParseJobDescription,
  RemoveExperienceGenerationOverride,
  SetExperienceGenerationOverride,
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
  ClaudeApiCompanyDataProvider,
  ClaudeApiCompanyDiscoveryProvider,
  ClaudeApiJobDescriptionParser,
  ClaudeApiProvider,
  ClaudeApiResumeContentGenerator,
  createOrmConfig,
  DI,
  PostgresApplicationRepository,
  PostgresCompanyRepository,
  PostgresEducationRepository,
  PostgresExperienceGenerationOverrideRepository,
  PostgresExperienceRepository,
  PostgresGenerationSettingsRepository,
  PostgresJobDescriptionRepository,
  PostgresProfileRepository,
  PostgresResumeContentRepository,
  TypstResumeRendererFactory
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
  useFactory: () => new ListExperiences(container.get(DI.Experience.Repository), container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Experience.Create,
  useFactory: () => new CreateExperience(container.get(DI.Experience.Repository))
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
  useFactory: () => new GetExperience(container.get(DI.Experience.Repository), container.get(DI.Company.Repository))
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
  useFactory: () => new UpdateApplicationStatus(container.get(DI.Application.Repository))
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
      container.get(DI.Company.Repository)
    )
});
container.bind({
  provide: DI.JobDescription.List,
  useFactory: () =>
    new ListJobDescriptions(container.get(DI.JobDescription.Repository), container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.JobDescription.Update,
  useFactory: () => new UpdateJobDescription(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.JobDescription.Delete,
  useFactory: () => new DeleteJobDescription(container.get(DI.JobDescription.Repository))
});

// Resume Content
container.bind({ provide: DI.ResumeContent.Repository, useClass: PostgresResumeContentRepository });

// Generation Settings
container.bind({ provide: DI.GenerationSettings.Repository, useClass: PostgresGenerationSettingsRepository });
container.bind({
  provide: DI.ExperienceGenerationOverride.Repository,
  useClass: PostgresExperienceGenerationOverrideRepository
});
container.bind({
  provide: DI.GenerationSettings.Get,
  useFactory: () =>
    new GetGenerationSettings(
      container.get(DI.GenerationSettings.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.ExperienceGenerationOverride.Repository)
    )
});
container.bind({
  provide: DI.GenerationSettings.Update,
  useFactory: () => new UpdateGenerationSettings(container.get(DI.GenerationSettings.Repository))
});
container.bind({
  provide: DI.ExperienceGenerationOverride.Set,
  useFactory: () => new SetExperienceGenerationOverride(container.get(DI.ExperienceGenerationOverride.Repository))
});
container.bind({
  provide: DI.ExperienceGenerationOverride.Remove,
  useFactory: () => new RemoveExperienceGenerationOverride(container.get(DI.ExperienceGenerationOverride.Repository))
});

// Resume
container.bind({ provide: DI.Resume.Generator, useClass: ClaudeApiResumeContentGenerator });
container.bind({
  provide: DI.Resume.Generate,
  useFactory: () =>
    new GenerateResumeContent(
      container.get(DI.Profile.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.ResumeContent.Repository),
      container.get(DI.Resume.Generator),
      container.get(DI.Education.Repository),
      container.get(DI.GenerationSettings.Repository),
      container.get(DI.ExperienceGenerationOverride.Repository)
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

export { container };
