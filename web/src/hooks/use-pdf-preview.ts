import { useEffect, useRef, useState } from 'react';

type ContentSelection = {
  headlineText: string;
  experienceSelections: { experienceId: string; bulletIds: string[] }[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  templateKey?: string;
};

type PdfPreviewState = {
  pdfData: Uint8Array | null;
  isCompiling: boolean;
  error: string | null;
};

const DEBOUNCE_MS = 1000;

function serializeSelection(sel: ContentSelection): string {
  const sorted = {
    headlineText: sel.headlineText,
    experienceSelections: [...sel.experienceSelections]
      .sort((a, b) => a.experienceId.localeCompare(b.experienceId))
      .map(s => ({ ...s, bulletIds: [...s.bulletIds].sort() })),
    educationIds: [...sel.educationIds].sort(),
    skillCategoryIds: [...sel.skillCategoryIds].sort(),
    skillItemIds: [...sel.skillItemIds].sort(),
    templateKey: sel.templateKey
  };
  return JSON.stringify(sorted);
}

async function fetchPreview(selection: ContentSelection, signal: AbortSignal): Promise<Uint8Array> {
  const body: Record<string, unknown> = {
    headline_text: selection.headlineText,
    experience_selections: selection.experienceSelections.map(s => ({
      experience_id: s.experienceId,
      bullet_ids: s.bulletIds
    })),
    education_ids: selection.educationIds,
    skill_category_ids: selection.skillCategoryIds,
    skill_item_ids: selection.skillItemIds
  };
  if (selection.templateKey) {
    body.template_key = selection.templateKey;
  }

  const response = await fetch('/api/resumes/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message ?? 'Preview generation failed');
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export function usePdfPreview(selection: ContentSelection | null): PdfPreviewState {
  const [state, setState] = useState<PdfPreviewState>({
    pdfData: null,
    isCompiling: false,
    error: null
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const serialized = selection ? serializeSelection(selection) : null;

  useEffect(() => {
    if (!serialized || !selectionRef.current) return;

    const currentSelection = selectionRef.current;
    const isEmpty = currentSelection.experienceSelections.length === 0 && currentSelection.educationIds.length === 0;
    if (isEmpty) {
      setState(prev => ({ ...prev, pdfData: null, error: null, isCompiling: false }));
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState(prev => ({ ...prev, isCompiling: true, error: null }));

      try {
        const pdfData = await fetchPreview(currentSelection, controller.signal);
        setState({ pdfData, isCompiling: false, error: null });
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setState(prev => ({
          ...prev,
          isCompiling: false,
          error: e instanceof Error ? e.message : 'Preview generation failed'
        }));
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [serialized]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return state;
}
