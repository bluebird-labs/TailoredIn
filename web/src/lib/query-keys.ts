export const queryKeys = {
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const
  },
  headlines: {
    all: ['headlines'] as const,
    list: () => [...queryKeys.headlines.all, 'list'] as const
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
    list: (companyId: string) => ['jobDescriptions', 'list', companyId] as const
  }
};
