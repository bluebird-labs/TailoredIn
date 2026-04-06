import { useMutation } from '@tanstack/react-query';

export function useGenerateResumePdf() {
  return useMutation({
    mutationFn: async (input: { jobDescriptionId: string; headlineId: string }) => {
      const response = await fetch('/api/resume/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        const serverMessage = (json as { error?: { message?: string } } | null)?.error?.message;
        throw new Error(serverMessage ?? 'Could not generate resume PDF');
      }
      return response.blob();
    }
  });
}
