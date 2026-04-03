import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type BulletSuggestion = {
  bulletId: string;
  score: number;
  reasoning: string;
};

type SuggestBulletsResult = {
  suggestions: BulletSuggestion[];
  summary: string;
};

export function useSuggestBullets() {
  return useMutation({
    mutationFn: async (input: { job_description: string; provider?: string }) => {
      const { data } = await api.archetypes['suggest-bullets'].post(input);
      return data?.data as SuggestBulletsResult;
    }
  });
}
