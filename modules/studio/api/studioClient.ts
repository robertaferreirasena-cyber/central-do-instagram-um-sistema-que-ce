// Domínio STUDIO — cliente de dados. Toda chamada HTTP do estúdio passa por aqui;
// a UI nunca faz fetch direto (fronteira da arquitetura modular).
import type { StudioProject, StudioTemplate, PostFormat } from '@/lib/studio/types';

export interface RoteiroData {
  arquetipo: string;
  objetivo: string;
  slides: Array<{ titulo: string; corpo: string; tipo?: string }>;
  caption: string;
  hashtags: string[];
}

async function json<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export async function listProjects(): Promise<StudioProject[]> {
  const r = await fetch('/api/studio/projects');
  return (await json<{ data?: StudioProject[] }>(r)).data || [];
}

export async function listTemplates(): Promise<StudioTemplate[]> {
  const r = await fetch('/api/studio/templates');
  return (await json<{ data?: StudioTemplate[] }>(r)).data || [];
}

export async function getProject(id: string): Promise<StudioProject | null> {
  try {
    const r = await fetch(`/api/studio/projects/${id}`);
    return (await json<{ data?: StudioProject }>(r)).data || null;
  } catch {
    return null;
  }
}

export async function createProject(input: {
  title: string;
  format: PostFormat;
  template_id?: string;
}): Promise<StudioProject | null> {
  const r = await fetch('/api/studio/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) return null;
  return (await json<{ data?: StudioProject }>(r)).data || null;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<StudioProject, 'title' | 'status' | 'caption' | 'hashtags' | 'data'>>,
): Promise<void> {
  await fetch(`/api/studio/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function deleteProject(id: string): Promise<boolean> {
  const r = await fetch(`/api/studio/projects/${id}`, { method: 'DELETE' });
  return r.ok;
}

// Re-seed dos templates de sistema (replace). Devolve a lista atualizada, se semeou.
export async function seedTemplatesIfNeeded(): Promise<StudioTemplate[] | null> {
  const res = await fetch('/api/studio/templates/seed', { method: 'POST' }).then((r) => r.json());
  if (res.inserted > 0) return listTemplates();
  return null;
}

// Gera o CONTEÚDO (textos/caption/hashtags) de um template já aplicado.
export async function generateContent(input: {
  templateId: string;
  briefing: string;
}): Promise<{ texts: string[]; caption?: string; hashtags?: string[]; fallback?: boolean; aviso?: string }> {
  const r = await fetch('/api/studio/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const j = await json<{ data?: { texts?: string[]; caption?: string; hashtags?: string[] }; fallback?: boolean; aviso?: string }>(r);
  return { texts: j.data?.texts || [], caption: j.data?.caption, hashtags: j.data?.hashtags, fallback: j.fallback, aviso: j.aviso };
}

// Salva o slide atual como novo MODELO custom (aparece na Biblioteca).
export async function saveTemplate(input: {
  name: string;
  category: string;
  template_json: StudioTemplate['template_json'];
}): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/studio/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (r.ok) return { ok: true };
  const j = await json<{ error?: string }>(r).catch(() => ({ error: undefined }));
  return { ok: false, error: j.error };
}

// Gera o roteiro completo (metodologia editorial). fallback=true = IA oscilou.
export async function gerarRoteiro(input: {
  tema: string;
  objetivo: string;
  numSlides: number;
}): Promise<{ data: RoteiroData | null; fallback: boolean }> {
  const r = await fetch('/api/studio/roteiro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const j = await json<{ data?: RoteiroData; fallback?: boolean }>(r);
  return { data: j.data || null, fallback: !!j.fallback };
}
