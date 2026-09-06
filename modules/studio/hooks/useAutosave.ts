'use client';
import { useEffect, useRef, useState } from 'react';
import type { StudioProject } from '@/lib/studio/types';
import { updateProject } from '@/modules/studio/api/studioClient';

export type SaveStatus = 'idle' | 'saving' | 'saved';

// Autosave DEBOUNCADO na versão mais nova do projeto (sem closure obsoleta).
// Dispara a cada mudança de `project`, exceto no primeiro render.
export function useAutosave(project: StudioProject): SaveStatus {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateProject(project.id, {
          title: project.title,
          status: project.status,
          caption: project.caption,
          hashtags: project.hashtags,
          data: project.data,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [project]);

  return saveStatus;
}
