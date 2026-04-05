import { InjectionToken } from '@needle-di/core';
import type {
  AddAccomplishment,
  CompanyDataProvider,
  CompanySearchProvider,
  CreateCompany,
  CreateEducation,
  CreateExperience,
  CreateHeadline,
  DeleteAccomplishment,
  DeleteEducation,
  DeleteExperience,
  DeleteHeadline,
  EnrichCompanyData,
  GetProfile,
  ListCompanies,
  ListEducation,
  ListExperiences,
  ListHeadlines,
  SearchCompanies,
  UpdateAccomplishment,
  UpdateCompany,
  UpdateEducation,
  UpdateExperience,
  UpdateHeadline,
  UpdateProfile
} from '@tailoredin/application';
import type {
  CompanyRepository,
  EducationRepository,
  ExperienceRepository,
  HeadlineRepository,
  ProfileRepository
} from '@tailoredin/domain';
import type { ClaudeCliProvider } from './services/llm/ClaudeCliProvider.js';

export const DI = {
  Llm: {
    ClaudeCliProvider: new InjectionToken<ClaudeCliProvider>('DI.Llm.ClaudeCliProvider')
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
    DeleteAccomplishment: new InjectionToken<DeleteAccomplishment>('DI.Experience.DeleteAccomplishment')
  },

  Company: {
    Repository: new InjectionToken<CompanyRepository>('DI.Company.Repository'),
    DataProvider: new InjectionToken<CompanyDataProvider>('DI.Company.DataProvider'),
    SearchProvider: new InjectionToken<CompanySearchProvider>('DI.Company.SearchProvider'),
    List: new InjectionToken<ListCompanies>('DI.Company.List'),
    Enrich: new InjectionToken<EnrichCompanyData>('DI.Company.Enrich'),
    Search: new InjectionToken<SearchCompanies>('DI.Company.Search'),
    Create: new InjectionToken<CreateCompany>('DI.Company.Create'),
    Update: new InjectionToken<UpdateCompany>('DI.Company.Update')
  }
};
