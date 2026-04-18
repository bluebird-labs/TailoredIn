export const DI = {
  Llm: {
    ClaudeApiKey: 'DI.Llm.ClaudeApiKey' as const,
    ClaudeApiProvider: 'DI.Llm.ClaudeApiProvider' as const
  },

  Auth: {
    Repository: 'DI.Auth.Repository' as const,
    PasswordHasher: 'DI.Auth.PasswordHasher' as const,
    TokenIssuer: 'DI.Auth.TokenIssuer' as const,
    Login: 'DI.Auth.Login' as const
  },

  Application: {
    Repository: 'DI.Application.Repository' as const,
    Create: 'DI.Application.Create' as const,
    Get: 'DI.Application.Get' as const,
    List: 'DI.Application.List' as const,
    Update: 'DI.Application.Update' as const,
    UpdateStatus: 'DI.Application.UpdateStatus' as const,
    Delete: 'DI.Application.Delete' as const
  },

  JobDescription: {
    Repository: 'DI.JobDescription.Repository' as const,
    Parser: 'DI.JobDescription.Parser' as const,
    Create: 'DI.JobDescription.Create' as const,
    Get: 'DI.JobDescription.Get' as const,
    List: 'DI.JobDescription.List' as const,
    Parse: 'DI.JobDescription.Parse' as const,
    Update: 'DI.JobDescription.Update' as const,
    Delete: 'DI.JobDescription.Delete' as const,
    FitScoreRepository: 'DI.JobDescription.FitScoreRepository' as const,
    FitScorer: 'DI.JobDescription.FitScorer' as const,
    ScoreFit: 'DI.JobDescription.ScoreFit' as const
  },

  Profile: {
    Repository: 'DI.Profile.Repository' as const,
    GetProfile: 'DI.Profile.GetProfile' as const,
    UpdateProfile: 'DI.Profile.UpdateProfile' as const
  },

  Education: {
    Repository: 'DI.Education.Repository' as const,
    ListEducation: 'DI.Education.ListEducation' as const,
    CreateEducation: 'DI.Education.CreateEducation' as const,
    UpdateEducation: 'DI.Education.UpdateEducation' as const,
    DeleteEducation: 'DI.Education.DeleteEducation' as const
  },

  Experience: {
    Repository: 'DI.Experience.Repository' as const,
    List: 'DI.Experience.List' as const,
    Create: 'DI.Experience.Create' as const,
    Update: 'DI.Experience.Update' as const,
    Delete: 'DI.Experience.Delete' as const,
    AddAccomplishment: 'DI.Experience.AddAccomplishment' as const,
    UpdateAccomplishment: 'DI.Experience.UpdateAccomplishment' as const,
    DeleteAccomplishment: 'DI.Experience.DeleteAccomplishment' as const,
    Get: 'DI.Experience.Get' as const,
    LinkCompany: 'DI.Experience.LinkCompany' as const,
    UnlinkCompany: 'DI.Experience.UnlinkCompany' as const
  },

  GenerationSettings: {
    Repository: 'DI.GenerationSettings.Repository' as const,
    Get: 'DI.GenerationSettings.Get' as const,
    Update: 'DI.GenerationSettings.Update' as const
  },

  ResumeContent: {
    Repository: 'DI.ResumeContent.Repository' as const
  },

  Resume: {
    ElementGenerator: 'DI.Resume.ElementGenerator' as const,
    PromptRegistry: 'DI.Resume.PromptRegistry' as const,
    ContextBuilder: 'DI.Resume.ContextBuilder' as const,
    Generate: 'DI.Resume.Generate' as const,
    RendererFactory: 'DI.Resume.RendererFactory' as const,
    GeneratePdf: 'DI.Resume.GeneratePdf' as const,
    GenerateContentWithPdf: 'DI.Resume.GenerateContentWithPdf' as const,
    GetCachedPdf: 'DI.Resume.GetCachedPdf' as const,
    UpdateDisplaySettings: 'DI.Resume.UpdateDisplaySettings' as const,
    Scorer: 'DI.Resume.Scorer' as const,
    Score: 'DI.Resume.Score' as const
  },

  Skill: {
    Repository: 'DI.Skill.Repository' as const,
    CategoryRepository: 'DI.Skill.CategoryRepository' as const,
    ConceptRepository: 'DI.Skill.ConceptRepository' as const,
    List: 'DI.Skill.List' as const,
    Search: 'DI.Skill.Search' as const,
    ListCategories: 'DI.Skill.ListCategories' as const,
    ListConcepts: 'DI.Skill.ListConcepts' as const,
    SyncExperienceSkills: 'DI.Skill.SyncExperienceSkills' as const
  },

  Company: {
    Repository: 'DI.Company.Repository' as const,
    DataProvider: 'DI.Company.DataProvider' as const,
    DiscoveryProvider: 'DI.Company.DiscoveryProvider' as const,
    List: 'DI.Company.List' as const,
    Enrich: 'DI.Company.Enrich' as const,
    Discover: 'DI.Company.Discover' as const,
    Create: 'DI.Company.Create' as const,
    Update: 'DI.Company.Update' as const,
    Get: 'DI.Company.Get' as const,
    Delete: 'DI.Company.Delete' as const
  }
};
