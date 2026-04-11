import { InjectionToken } from '@needle-di/core';
import type {
  AddAccomplishment,
  CompanyDataProvider,
  CompanyDiscoveryProvider,
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
  JobDescriptionParser,
  LinkCompanyToExperience,
  ListApplications,
  ListCompanies,
  ListEducation,
  ListExperiences,
  ListJobDescriptions,
  ParseJobDescription,
  PromptRegistry,
  ResumeElementGenerator,
  ResumeRendererFactory,
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
import type {
  ApplicationRepository,
  CompanyRepository,
  EducationRepository,
  ExperienceRepository,
  GenerationSettingsRepository,
  JobDescriptionRepository,
  ProfileRepository,
  ResumeContentRepository
} from '@tailoredin/domain';
import type { ClaudeApiProvider } from './services/llm/ClaudeApiProvider.js';

export const DI = {
  Llm: {
    ClaudeApiKey: new InjectionToken<string>('DI.Llm.ClaudeApiKey'),
    ClaudeApiProvider: new InjectionToken<ClaudeApiProvider>('DI.Llm.ClaudeApiProvider')
  },

  Application: {
    Repository: new InjectionToken<ApplicationRepository>('DI.Application.Repository'),
    Create: new InjectionToken<CreateApplication>('DI.Application.Create'),
    Get: new InjectionToken<GetApplication>('DI.Application.Get'),
    List: new InjectionToken<ListApplications>('DI.Application.List'),
    Update: new InjectionToken<UpdateApplication>('DI.Application.Update'),
    UpdateStatus: new InjectionToken<UpdateApplicationStatus>('DI.Application.UpdateStatus'),
    Delete: new InjectionToken<DeleteApplication>('DI.Application.Delete')
  },

  JobDescription: {
    Repository: new InjectionToken<JobDescriptionRepository>('DI.JobDescription.Repository'),
    Parser: new InjectionToken<JobDescriptionParser>('DI.JobDescription.Parser'),
    Create: new InjectionToken<CreateJobDescription>('DI.JobDescription.Create'),
    Get: new InjectionToken<GetJobDescription>('DI.JobDescription.Get'),
    List: new InjectionToken<ListJobDescriptions>('DI.JobDescription.List'),
    Parse: new InjectionToken<ParseJobDescription>('DI.JobDescription.Parse'),
    Update: new InjectionToken<UpdateJobDescription>('DI.JobDescription.Update'),
    Delete: new InjectionToken<DeleteJobDescription>('DI.JobDescription.Delete')
  },

  Profile: {
    Repository: new InjectionToken<ProfileRepository>('DI.Profile.Repository'),
    GetProfile: new InjectionToken<GetProfile>('DI.Profile.GetProfile'),
    UpdateProfile: new InjectionToken<UpdateProfile>('DI.Profile.UpdateProfile')
  },

  Education: {
    Repository: new InjectionToken<EducationRepository>('DI.Education.Repository'),
    ListEducation: new InjectionToken<ListEducation>('DI.Education.ListEducation'),
    CreateEducation: new InjectionToken<CreateEducation>('DI.Education.CreateEducation'),
    UpdateEducation: new InjectionToken<UpdateEducation>('DI.Education.UpdateEducation'),
    DeleteEducation: new InjectionToken<DeleteEducation>('DI.Education.DeleteEducation')
  },

  Experience: {
    Repository: new InjectionToken<ExperienceRepository>('DI.Experience.Repository'),
    List: new InjectionToken<ListExperiences>('DI.Experience.List'),
    Create: new InjectionToken<CreateExperience>('DI.Experience.Create'),
    Update: new InjectionToken<UpdateExperience>('DI.Experience.Update'),
    Delete: new InjectionToken<DeleteExperience>('DI.Experience.Delete'),
    AddAccomplishment: new InjectionToken<AddAccomplishment>('DI.Experience.AddAccomplishment'),
    UpdateAccomplishment: new InjectionToken<UpdateAccomplishment>('DI.Experience.UpdateAccomplishment'),
    DeleteAccomplishment: new InjectionToken<DeleteAccomplishment>('DI.Experience.DeleteAccomplishment'),
    Get: new InjectionToken<GetExperience>('DI.Experience.Get'),
    LinkCompany: new InjectionToken<LinkCompanyToExperience>('DI.Experience.LinkCompany'),
    UnlinkCompany: new InjectionToken<UnlinkCompanyFromExperience>('DI.Experience.UnlinkCompany')
  },

  GenerationSettings: {
    Repository: new InjectionToken<GenerationSettingsRepository>('DI.GenerationSettings.Repository'),
    Get: new InjectionToken<GetGenerationSettings>('DI.GenerationSettings.Get'),
    Update: new InjectionToken<UpdateGenerationSettings>('DI.GenerationSettings.Update')
  },

  ResumeContent: {
    Repository: new InjectionToken<ResumeContentRepository>('DI.ResumeContent.Repository')
  },

  Resume: {
    ElementGenerator: new InjectionToken<ResumeElementGenerator>('DI.Resume.ElementGenerator'),
    PromptRegistry: new InjectionToken<PromptRegistry>('DI.Resume.PromptRegistry'),
    ContextBuilder: new InjectionToken<GenerationContextBuilder>('DI.Resume.ContextBuilder'),
    Generate: new InjectionToken<GenerateResumeContent>('DI.Resume.Generate'),
    RendererFactory: new InjectionToken<ResumeRendererFactory>('DI.Resume.RendererFactory'),
    GeneratePdf: new InjectionToken<GenerateResumePdf>('DI.Resume.GeneratePdf'),
    GenerateContentWithPdf: new InjectionToken<GenerateResumeContentWithPdf>('DI.Resume.GenerateContentWithPdf'),
    GetCachedPdf: new InjectionToken<GetCachedResumePdf>('DI.Resume.GetCachedPdf'),
    UpdateDisplaySettings: new InjectionToken<UpdateResumeDisplaySettings>('DI.Resume.UpdateDisplaySettings')
  },

  Company: {
    Repository: new InjectionToken<CompanyRepository>('DI.Company.Repository'),
    DataProvider: new InjectionToken<CompanyDataProvider>('DI.Company.DataProvider'),
    DiscoveryProvider: new InjectionToken<CompanyDiscoveryProvider>('DI.Company.DiscoveryProvider'),
    List: new InjectionToken<ListCompanies>('DI.Company.List'),
    Enrich: new InjectionToken<EnrichCompanyData>('DI.Company.Enrich'),
    Discover: new InjectionToken<DiscoverCompanies>('DI.Company.Discover'),
    Create: new InjectionToken<CreateCompany>('DI.Company.Create'),
    Update: new InjectionToken<UpdateCompany>('DI.Company.Update'),
    Get: new InjectionToken<GetCompany>('DI.Company.Get'),
    Delete: new InjectionToken<DeleteCompany>('DI.Company.Delete')
  }
};
