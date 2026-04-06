import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import {
  AddAccomplishment,
  CreateApplication,
  CreateCompany,
  CreateEducation,
  CreateExperience,
  CreateHeadline,
  CreateJobDescription,
  DeleteAccomplishment,
  DeleteApplication,
  DeleteEducation,
  DeleteExperience,
  DeleteHeadline,
  DeleteJobDescription,
  DiscoverCompanies,
  EnrichCompanyData,
  GenerateResumeContent,
  GenerateResumePdf,
  GetApplication,
  GetCompany,
  GetExperience,
  GetJobDescription,
  GetProfile,
  LinkCompanyToExperience,
  ListApplications,
  ListCompanies,
  ListEducation,
  ListExperiences,
  ListHeadlines,
  ListJobDescriptions,
  ParseJobDescription,
  UnlinkCompanyFromExperience,
  UpdateAccomplishment,
  UpdateApplication,
  UpdateApplicationStatus,
  UpdateCompany,
  UpdateEducation,
  UpdateExperience,
  UpdateHeadline,
  UpdateJobDescription,
  UpdateProfile
} from '@tailoredin/application';
import { env, envInt } from '@tailoredin/core';
import {
  ClaudeCliCompanyDataProvider,
  ClaudeCliCompanyDiscoveryProvider,
  ClaudeCliJobDescriptionParser,
  ClaudeCliProvider,
  ClaudeCliResumeContentGenerator,
  createOrmConfig,
  DI,
  PostgresApplicationRepository,
  PostgresCompanyRepository,
  PostgresEducationRepository,
  PostgresExperienceRepository,
  PostgresHeadlineRepository,
  PostgresJobDescriptionRepository,
  PostgresProfileRepository,
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

// Headlines
container.bind({ provide: DI.Headline.Repository, useClass: PostgresHeadlineRepository });
container.bind({
  provide: DI.Headline.List,
  useFactory: () => new ListHeadlines(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Create,
  useFactory: () => new CreateHeadline(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Update,
  useFactory: () => new UpdateHeadline(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Delete,
  useFactory: () => new DeleteHeadline(container.get(DI.Headline.Repository))
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
container.bind({ provide: DI.Llm.ClaudeCliProvider, useClass: ClaudeCliProvider });

// Company
container.bind({ provide: DI.Company.Repository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Company.DataProvider, useClass: ClaudeCliCompanyDataProvider });
container.bind({ provide: DI.Company.DiscoveryProvider, useClass: ClaudeCliCompanyDiscoveryProvider });
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
container.bind({ provide: DI.JobDescription.Parser, useClass: ClaudeCliJobDescriptionParser });
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
  useFactory: () => new GetJobDescription(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.JobDescription.List,
  useFactory: () => new ListJobDescriptions(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.JobDescription.Update,
  useFactory: () => new UpdateJobDescription(container.get(DI.JobDescription.Repository))
});
container.bind({
  provide: DI.JobDescription.Delete,
  useFactory: () => new DeleteJobDescription(container.get(DI.JobDescription.Repository))
});

// Resume
container.bind({ provide: DI.Resume.Generator, useClass: ClaudeCliResumeContentGenerator });
container.bind({
  provide: DI.Resume.Generate,
  useFactory: () =>
    new GenerateResumeContent(
      container.get(DI.Profile.Repository),
      container.get(DI.Headline.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.Resume.Generator)
    )
});
container.bind({ provide: DI.Resume.RendererFactory, useClass: TypstResumeRendererFactory });
container.bind({
  provide: DI.Resume.GeneratePdf,
  useFactory: () =>
    new GenerateResumePdf(
      container.get(DI.Profile.Repository),
      container.get(DI.Headline.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.Education.Repository),
      container.get(DI.JobDescription.Repository),
      container.get(DI.Resume.Generator),
      container.get(DI.Resume.RendererFactory)
    )
});

export { container };
