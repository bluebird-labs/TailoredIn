import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateTailoredResumeFromText() {
  return useMutation({
    mutationFn: async (jdContent: string) => {
      const { data, error } = await api.resumes.tailored.post({ jd_content: jdContent });
      if (error) throw new Error('Failed to generate resume');
      return data?.data;
    }
  });
}

export function useExtractTextFromFile() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/factory/extract-text', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Failed to extract text from file');
      const json = (await res.json()) as { data: { text: string } };
      return json.data.text;
    }
  });
}
