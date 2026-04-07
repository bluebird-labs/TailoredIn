export const queryKeys = {
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const
  },
  educations: {
    all: ['educations'] as const,
    list: () => [...queryKeys.educations.all, 'list'] as const
  },
  experiences: {
    all: ['experiences'] as const,
    list: () => [...queryKeys.experiences.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.experiences.all, 'detail', id] as const
  },
  accomplishments: {
    all: ['accomplishments'] as const,
    byExperience: (experienceId: string) => ['accomplishments', 'experience', experienceId] as const
  },
  companies: {
    all: ['companies'] as const,
    list: () => [...queryKeys.companies.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.companies.all, 'detail', id] as const
  },
  jobDescriptions: {
    all: ['jobDescriptions'] as const,
    listAll: () => ['jobDescriptions', 'list'] as const,
    list: (companyId: string) => ['jobDescriptions', 'list', companyId] as const,
    detail: (id: string) => [...queryKeys.jobDescriptions.all, 'detail', id] as const
  },
  resume: {
    cachedPdf: (jobDescriptionId: string) => ['resume', 'cachedPdf', jobDescriptionId] as const
  },
  generationSettings: {
    all: ['generationSettings'] as const,
    detail: () => ['generationSettings', 'detail'] as const
  }
};
