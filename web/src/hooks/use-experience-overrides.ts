import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type EdenRouteSegment, extractApiError } from '@/lib/api-error';

type ExperienceGenerationOverride = {
  id: string;
  experienceId: string;
  bulletMin: number;
  bulletMax: number;
};

export function useSetExperienceOverride() {
  return useMutation({
    mutationFn: async (input: { experienceId: string; bullet_min: number; bullet_max: number }) => {
      const segment = api.experiences as EdenRouteSegment;
      const { data, error } = await segment({ id: input.experienceId })['generation-override'].put({
        bullet_min: input.bullet_min,
        bullet_max: input.bullet_max
      });
      if (error)
        throw new Error(
          extractApiError(error, `Could not set generation override for experience ${input.experienceId}`)
        );
      return data?.data as ExperienceGenerationOverride;
    }
  });
}

export function useRemoveExperienceOverride() {
  return useMutation({
    mutationFn: async (experienceId: string) => {
      const segment = api.experiences as EdenRouteSegment;
      const { error } = await segment({ id: experienceId })['generation-override'].delete();
      if (error)
        throw new Error(extractApiError(error, `Could not remove generation override for experience ${experienceId}`));
    }
  });
}
