import { InjectionToken } from '@needle-di/core';
import type {
  AddAccomplishment,
  CompanyDataProvider,
  CompanyDiscoveryProvider,
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
  GetApplication,
  GetCompany,
  GetExperience,
  GetJobDescription,
  GetProfile,
  JobDescriptionParser,
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
import type {
  ApplicationRepository,
  CompanyRepository,
  EducationRepository,
  ExperienceRepository,
  HeadlineRepository,
  JobDescriptionRepository,
  ProfileRepository
} from '@tailoredin/domain';
import type { ClaudeCliProvider } from './services/llm/ClaudeCliProvider.js';

export const DI = {
  Llm: {
    ClaudeCliProvider: new InjectionToken<ClaudeCliProvider>('DI.Llm.ClaudeCliProvider')
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

  Headline: {
    Repository: new InjectionToken<HeadlineRepository>('DI.Headline.Repository'),
    List: new InjectionToken<ListHeadlines>('DI.Headline.List'),
    Create: new InjectionToken<CreateHeadline>('DI.Headline.Create'),
    Update: new InjectionToken<UpdateHeadline>('DI.Headline.Update'),
    Delete: new InjectionToken<DeleteHeadline>('DI.Headline.Delete')
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

  Company: {
    Repository: new InjectionToken<CompanyRepository>('DI.Company.Repository'),
    DataProvider: new InjectionToken<CompanyDataProvider>('DI.Company.DataProvider'),
    DiscoveryProvider: new InjectionToken<CompanyDiscoveryProvider>('DI.Company.DiscoveryProvider'),
    List: new InjectionToken<ListCompanies>('DI.Company.List'),
    Enrich: new InjectionToken<EnrichCompanyData>('DI.Company.Enrich'),
    Discover: new InjectionToken<DiscoverCompanies>('DI.Company.Discover'),
    Create: new InjectionToken<CreateCompany>('DI.Company.Create'),
    Update: new InjectionToken<UpdateCompany>('DI.Company.Update'),
    Get: new InjectionToken<GetCompany>('DI.Company.Get')
  }
};
