export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    detail: (id: string) => [...queryKeys.companies.all, 'detail', id] as const
  },
  jobs: {
    all: ['jobs'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.jobs.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.jobs.all, 'detail', id] as const,
    brief: (jobId: string) => [...queryKeys.jobs.all, 'brief', jobId] as const,
    top: (params: Record<string, unknown>) => [...queryKeys.jobs.all, 'top', params] as const
  },
  resume: {
    all: ['resume'] as const,
    companies: () => [...queryKeys.resume.all, 'companies'] as const,
    education: () => [...queryKeys.resume.all, 'education'] as const,
    skillCategories: () => [...queryKeys.resume.all, 'skill-categories'] as const,
    headlines: () => [...queryKeys.resume.all, 'headlines'] as const
  },
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const
  },
  archetypes: {
    all: ['archetypes'] as const,
    list: () => [...queryKeys.archetypes.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.archetypes.all, 'detail', id] as const
  },
  config: {
    all: ['config'] as const,
    capabilities: () => [...queryKeys.config.all, 'capabilities'] as const
  },
  educations: {
    all: ['educations'] as const,
    list: () => [...queryKeys.educations.all, 'list'] as const
  },
  tags: {
    all: ['tags'] as const,
    byDimension: (dimension: string) => ['tags', dimension] as const
  }
};
