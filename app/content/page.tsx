'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import StudioEditor from '@/components/studio/StudioEditor';
import CriarComIaPanel from '@/components/content/CriarComIaPanel';
import ProjetosGrid from '@/components/content/ProjetosGrid';
import ModelosGrid from '@/components/content/ModelosGrid';
import type { StudioProject, StudioTemplate } from '@/lib/studio/types';
import type { Estilo } from '@/modules/studio/services/carouselBuilder';
import { montarSlidesDoRoteiro } from '@/modules/studio/services/carouselBuilder';
import * as studio from '@/modules/studio/api/studioClient';

// Página do Estúdio — só COMPÕE (tabs + seções + editor). A regra de negócio vive
// em modules/studio/services; o acesso a dados em modules/studio/api.
export default function ConteudoPage() {
  const [tab, setTab] = useState<'editor' | 'models' | 'projects'>('projects');
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  // Criar carrossel com IA
  const [iaTema, setIaTema] = useState('');
  const [iaObjetivo, setIaObjetivo] = useState<'salvar' | 'compartilhar' | 'seguir' | 'vender'>('seguir');
  const [iaEstilo, setIaEstilo] = useState<Estilo>('escuro');
  const [iaNum, setIaNum] = useState(7);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaAviso, setIaAviso] = useState<string | null>(null);

  // Carrega projetos/templates (+ abre projeto vindo da Biblioteca via ?project=<id>)
  useEffect(() => {
    (async () => {
      const [projs, tpls] = await Promise.all([studio.listProjects(), studio.listTemplates()]);
      setProjects(projs);
      setTemplates(tpls);
      const pid = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('project') : null;
      if (pid) {
        const proj = projs.find((p) => p.id === pid) || (await studio.getProject(pid));
        if (proj) { setSelectedProject(proj); setTab('editor'); }
      }
    })().finally(() => setIsLoading(false));
  }, []);

  // Semeia templates na primeira carga se a biblioteca estiver vazia
  useEffect(() => {
    if (templates.length === 0 && !isLoading) {
      studio.seedTemplatesIfNeeded().then((tpls) => { if (tpls) setTemplates(tpls); });
    }
  }, [isLoading, templates.length]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const data = await studio.createProject({ title: newProjectName, format: '4:5' });
    if (data) {
      setProjects([data, ...projects]);
      setSelectedProject(data);
      setNewProjectName('');
      setTab('editor');
    }
  };

  // Criar carrossel completo com IA: gera o roteiro e monta o projeto (autodidata).
  const criarCarrosselIA = async () => {
    if (!iaTema.trim()) return;
    setIaLoading(true);
    setIaAviso(null);
    try {
      const { data, fallback } = await studio.gerarRoteiro({ tema: iaTema, objetivo: iaObjetivo, numSlides: iaNum });
      if (!data?.slides?.length) {
        setIaAviso('A IA não retornou um roteiro. Tente reformular o tema.');
        return;
      }
      if (fallback) setIaAviso('IA em modo fallback — edite antes de publicar.');
      const slides = montarSlidesDoRoteiro(data.slides, iaEstilo, templates);
      const proj = await studio.createProject({ title: iaTema.slice(0, 60), format: '3:4' });
      if (!proj) { setIaAviso('Falha ao criar o projeto.'); return; }
      // Guarda o roteiro (conteúdo) junto dos slides (design): separar conteúdo de
      // design deixa trocar de template sem perder o texto gerado.
      const full: StudioProject = { ...proj, caption: data.caption || '', hashtags: data.hashtags || [], data: { slides, roteiro: data.slides } };
      await studio.updateProject(proj.id, { title: full.title, caption: full.caption, hashtags: full.hashtags, data: full.data });
      setProjects([full, ...projects]);
      setSelectedProject(full);
      setIaTema('');
      setTab('editor');
    } catch {
      setIaAviso('Erro ao gerar o carrossel.');
    } finally {
      setIaLoading(false);
    }
  };

  // Só estado — a persistência (PUT debouncado) é feita dentro do StudioEditor.
  const handleUpdateProject = (project: StudioProject) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    setSelectedProject(project);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    if (await studio.deleteProject(id)) {
      setProjects(projects.filter((p) => p.id !== id));
      if (selectedProject?.id === id) { setSelectedProject(null); setTab('projects'); }
    }
  };

  const usarModelo = async (tpl: StudioTemplate) => {
    const data = await studio.createProject({ title: `${tpl.name} - ${new Date().toLocaleDateString()}`, format: tpl.format, template_id: tpl.id });
    if (data) { setProjects([data, ...projects]); setSelectedProject(data); setTab('editor'); }
  };

  const abrirProjeto = (p: StudioProject) => { setSelectedProject(p); setTab('editor'); };

  // Editor em tela cheia (layout 3 painéis, cabeçalho próprio)
  if (tab === 'editor' && selectedProject) {
    return (
      <div style={{ height: '100vh', width: '100%' }}>
        <StudioEditor
          project={selectedProject}
          templates={templates}
          onProjectUpdate={handleUpdateProject}
          onBack={() => { setSelectedProject(null); setTab('projects'); }}
        />
      </div>
    );
  }

  const tabs = [
    { key: 'projects', label: 'Projetos' },
    { key: 'editor', label: 'Editor', disabled: !selectedProject },
    { key: 'models', label: 'Modelos' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <PageHeader title="Estúdio de Conteúdo" />

      <div style={{ height: 44, backgroundColor: '#0E2A2E', borderBottom: '1px solid #46655C', display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => !t.disabled && setTab(t.key as 'editor' | 'models' | 'projects')}
            disabled={t.disabled}
            style={{
              padding: '0 16px', height: '100%',
              backgroundColor: tab === t.key ? '#46655C' : 'transparent',
              color: tab === t.key ? '#D6F24B' : t.disabled ? '#666' : '#FAFAF8',
              border: 'none',
              borderBottom: tab === t.key ? '3px solid #D6F24B' : 'none',
              cursor: t.disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#070d18' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#FAFAF8' }}>Carregando...</div>
        ) : tab === 'projects' ? (
          <div style={{ padding: 24 }}>
            <CriarComIaPanel
              tema={iaTema} setTema={setIaTema}
              objetivo={iaObjetivo} setObjetivo={setIaObjetivo}
              estilo={iaEstilo} setEstilo={setIaEstilo}
              num={iaNum} setNum={setIaNum}
              loading={iaLoading} aviso={iaAviso}
              onGerar={criarCarrosselIA}
            />
            <ProjetosGrid
              projects={projects}
              newName={newProjectName} setNewName={setNewProjectName}
              onCreate={handleCreateProject}
              onOpen={abrirProjeto}
              onDelete={handleDeleteProject}
            />
          </div>
        ) : tab === 'models' ? (
          <ModelosGrid templates={templates} onUse={usarModelo} />
        ) : null}
      </div>
    </div>
  );
}
