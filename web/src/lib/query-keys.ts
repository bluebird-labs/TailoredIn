export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.jobs.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.jobs.all, 'detail', id] as const,
    top: (params: Record<string, unknown>) => [...queryKeys.jobs.all, 'top', params] as const
  },
  resume: {
    all: ['resume'] as const,
    companies: () => [...queryKeys.resume.all, 'companies'] as const,
    education: () => [...queryKeys.resume.all, 'education'] as const,
    skills: () => [...queryKeys.resume.all, 'skills'] as const,
    headlines: () => [...queryKeys.resume.all, 'headlines'] as const
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const
  },
  archetypes: {
    all: ['archetypes'] as const,
    list: () => [...queryKeys.archetypes.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.archetypes.all, 'detail', id] as const
  }
};
