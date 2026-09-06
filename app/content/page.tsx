'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import StudioEditor from '@/components/studio/StudioEditor';
import StudioThumbnail from '@/components/studio/StudioThumbnail';
import type { StudioProject, StudioTemplate, Slide } from '@/lib/studio/types';

// Converte um roteiro gerado pela IA (metodologia carrossel-instagram) em slides
// editáveis no formato do Estúdio, na identidade IA Club V2 (petróleo/cítrico/gelo).
function roteiroToSlides(
  roteiro: { slides: { titulo: string; corpo: string }[] },
  w = 1080,
  h = 1350,
): Slide[] {
  return roteiro.slides.map((s, i) => {
    const elements: Slide['elements'] = [];
    let z = 1;
    // etiqueta mono (IA CLUB // NN)
    elements.push({
      id: `el-${Date.now()}-${i}-tag`,
      element_type: 'text',
      content: `IA CLUB // ${String(i + 1).padStart(2, '0')}`,
      styles_json: { fontFamily: 'JetBrains Mono', fontSize: 26, color: '#D6F24B', fontWeight: 700, letterSpacing: 2, textAlign: 'left', lineHeight: 1.2 },
      position_x: 80, position_y: 90, width: 900, height: 40, z_index: z++,
    });
    // título (Archivo forte)
    if (s.titulo) {
      elements.push({
        id: `el-${Date.now()}-${i}-tit`,
        element_type: 'text',
        content: s.titulo,
        styles_json: { fontFamily: 'Archivo', fontSize: i === 0 ? 82 : 60, color: '#FAFAF8', fontWeight: 800, textAlign: 'left', lineHeight: 1.05, letterSpacing: -1 },
        position_x: 80, position_y: i === 0 ? 430 : 200, width: 920, height: 300, z_index: z++,
      });
    }
    // corpo (Instrument)
    if (s.corpo) {
      elements.push({
        id: `el-${Date.now()}-${i}-corpo`,
        element_type: 'text',
        content: s.corpo,
        styles_json: { fontFamily: 'Instrument Sans', fontSize: 36, color: '#FAFAF8', fontWeight: 400, textAlign: 'left', lineHeight: 1.35 },
        position_x: 80, position_y: i === 0 ? 760 : 560, width: 920, height: 640, z_index: z++,
      });
    }
    return {
      id: `slide-${Date.now()}-${i}`,
      background_type: 'solid' as const,
      background_value: i === 0 ? '#0E2A2E' : i % 2 === 0 ? '#0E2A2E' : '#0a1315',
      overlay_color: null,
      overlay_value: null,
      canvas_width: w,
      canvas_height: h,
      elements,
    };
  });
}

type Estilo = 'escuro' | 'claro' | 'tweet';

// AUTODIDATA: escolhe o melhor template para o slide (tipo → template), respeitando o estilo visual.
function nomesTemplatePorTipo(tipo: string, estilo: Estilo): string[] {
  if (estilo === 'tweet') {
    if (tipo === 'capa' || tipo === 'cta') return ['Tweet • Gancho'];
    return ['Tweet • Escuro'];
  }
  const suf = estilo === 'claro' ? ' (Claro)' : '';
  switch (tipo) {
    case 'capa': return [`IA Club • Capa${suf}`, 'IA Club • Capa'];
    case 'numero': return [`IA Club • Número Grande${suf}`, 'IA Club • Número Grande'];
    case 'citacao': return [`IA Club • Citação Impacto${suf}`, 'IA Club • Citação Impacto'];
    case 'lista': return [`IA Club • Lista 4 Itens${suf}`, 'IA Club • Lista 4 Itens'];
    case 'comparativo': return [`IA Club • Comparativo Antes-Depois${suf}`, 'IA Club • Comparativo Antes-Depois'];
    case 'cta': return ['IA Club • CTA Final'];
    default: return estilo === 'claro' ? ['IA Club • Conteúdo Claro', 'IA Club • Conteúdo Denso'] : ['IA Club • Conteúdo Denso'];
  }
}

function escolherTemplate(tipo: string, estilo: Estilo, templates: StudioTemplate[]): StudioTemplate | null {
  for (const n of nomesTemplatePorTipo(tipo, estilo)) {
    const t = templates.find((t) => t.name === n);
    if (t) return t;
  }
  return templates.find((t) => t.name.startsWith('IA Club • Conteúdo')) || templates[0] || null;
}

// Extrai o número/estatística mais forte do conteúdo (para o slot gigante do template "Número Grande").
function extrairNumero(texto: string): string | null {
  const t = texto || '';
  const m =
    t.match(/\d{1,3}([.,]\d+)?\s*%/) || // 32%  /  4,5%
    t.match(/\d+\s*em\s*cada\s*\d+/i) || // 2 em cada 3
    t.match(/\b\d+\s*x\b/i) || // 3x
    t.match(/R\$\s?\d{1,3}([.,]\d{3})*([.,]\d+)?/) || // R$ 8.000
    t.match(/\b\d{2,}([.,]\d+)?\b/); // um número "grande" solto (>= 2 dígitos)
  return m ? m[0].trim() : null;
}

// DESIGNER: injeta o conteúdo do slide no template escolhido (título no maior texto, corpo no parágrafo).
function preencherTemplate(tpl: StudioTemplate, s: { titulo: string; corpo: string }): Slide {
  const ts = tpl.template_json.slides[0];
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const els: Slide['elements'] = ts.elements.map((e, i) => ({
    id: `el-${uid()}-${i}`,
    element_type: e.element_type,
    content: e.content,
    styles_json: { ...e.styles_json },
    position_x: e.position_x,
    position_y: e.position_y,
    width: e.width,
    height: e.height,
    z_index: e.z_index,
  }));
  const textos = els
    .filter((e) => e.element_type === 'text')
    .sort((a, b) => (b.styles_json.fontSize || 0) - (a.styles_json.fontSize || 0));
  const titulo = textos[0];
  const corpo = textos.find(
    (e) => e !== titulo && (e.styles_json.fontSize || 0) >= 32 && String(e.styles_json.fontFamily || '').includes('Instrument'),
  );
  // Slot gigante (fontSize >= 120) = template de NÚMERO: joga só o número no slot,
  // e a frase (título) no parágrafo de contexto.
  const ehNumero = !!titulo && (titulo.styles_json.fontSize || 0) >= 120;
  if (ehNumero) {
    const num = extrairNumero(`${s.titulo} ${s.corpo}`);
    if (titulo) titulo.content = num || s.titulo || titulo.content;
    if (corpo) corpo.content = s.titulo || s.corpo || corpo.content;
  } else {
    if (titulo && s.titulo) titulo.content = s.titulo;
    if (corpo && s.corpo) corpo.content = s.corpo;
  }
  // remove blocos de corpo extra (placeholders além do preenchido)
  const extras = new Set(
    textos
      .filter((e) => e !== titulo && e !== corpo && (e.styles_json.fontSize || 0) >= 34 && String(e.styles_json.fontFamily || '').includes('Instrument'))
      .map((e) => e.id),
  );
  return {
    id: `slide-${uid()}`,
    background_type: ts.background_type,
    background_value: ts.background_value,
    overlay_color: ts.overlay_color || null,
    overlay_value: ts.overlay_value || null,
    canvas_width: ts.canvas_width,
    canvas_height: ts.canvas_height,
    elements: els.filter((e) => !extras.has(e.id)),
  };
}

export default function ConteudoPage() {
  const [tab, setTab] = useState<'editor' | 'models' | 'projects'>('projects');
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  // Criar carrossel com IA (metodologia carrossel-instagram)
  const [iaTema, setIaTema] = useState('');
  const [iaObjetivo, setIaObjetivo] = useState<'salvar' | 'compartilhar' | 'seguir' | 'vender'>('seguir');
  const [iaEstilo, setIaEstilo] = useState<Estilo>('escuro');
  const [iaNum, setIaNum] = useState(7);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaAviso, setIaAviso] = useState<string | null>(null);

  // Load projects and templates (+ abre projeto vindo da Biblioteca via ?project=<id>)
  useEffect(() => {
    Promise.all([
      fetch('/api/studio/projects').then((r) => r.json()),
      fetch('/api/studio/templates').then((r) => r.json()),
    ])
      .then(async ([projectsRes, templatesRes]) => {
        const projs: StudioProject[] = projectsRes.data || [];
        setProjects(projs);
        setTemplates(templatesRes.data || []);
        const pid = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('project') : null;
        if (pid) {
          let proj = projs.find((p) => p.id === pid) || null;
          if (!proj) {
            const one = await fetch(`/api/studio/projects/${pid}`).then((r) => r.json()).catch(() => null);
            proj = one?.data || null;
          }
          if (proj) {
            setSelectedProject(proj);
            setTab('editor');
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Seed templates on first load
  useEffect(() => {
    if (templates.length === 0 && !isLoading) {
      fetch('/api/studio/templates/seed', { method: 'POST' })
        .then((r) => r.json())
        .then((res) => {
          if (res.inserted > 0) {
            return fetch('/api/studio/templates').then((r) => r.json());
          }
        })
        .then((res) => {
          if (res.data) setTemplates(res.data);
        });
    }
  }, [isLoading, templates.length]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const res = await fetch('/api/studio/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newProjectName,
        format: '4:5',
      }),
    });

    if (res.ok) {
      const { data } = await res.json();
      setProjects([data, ...projects]);
      setSelectedProject(data);
      setNewProjectName('');
      setTab('editor');
    }
  };

  // Criar carrossel completo com IA: gera o roteiro (método editorial) e monta o projeto.
  const criarCarrosselIA = async () => {
    if (!iaTema.trim()) return;
    setIaLoading(true);
    setIaAviso(null);
    try {
      const r = await fetch('/api/studio/roteiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: iaTema, objetivo: iaObjetivo, numSlides: iaNum }),
      });
      const json = await r.json();
      if (!json?.data?.slides?.length) {
        setIaAviso('A IA não retornou um roteiro. Tente reformular o tema.');
        return;
      }
      if (json.fallback) setIaAviso('IA em modo fallback — edite antes de publicar.');
      // AUTODIDATA: cada slide escolhe o melhor template pelo tipo + estilo, e o designer injeta o conteúdo.
      const slides: Slide[] = json.data.slides.map((s: any) => {
        const tpl = templates.length ? escolherTemplate(s.tipo || 'conteudo', iaEstilo, templates) : null;
        return tpl ? preencherTemplate(tpl, s) : roteiroToSlides({ slides: [s] })[0];
      });
      // cria o projeto e grava o bundle + legenda/hashtags
      const created = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: iaTema.slice(0, 60), format: '3:4' }),
      }).then((x) => x.json());
      const proj: StudioProject = created.data;
      if (!proj) {
        setIaAviso('Falha ao criar o projeto.');
        return;
      }
      const full: StudioProject = {
        ...proj,
        caption: json.data.caption || '',
        hashtags: json.data.hashtags || [],
        data: { slides },
      };
      await fetch(`/api/studio/projects/${proj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: full.title, caption: full.caption, hashtags: full.hashtags, data: full.data }),
      });
      setProjects([full, ...projects]);
      setSelectedProject(full);
      setIaTema('');
      setTab('editor');
    } catch (e) {
      setIaAviso('Erro ao gerar o carrossel.');
    } finally {
      setIaLoading(false);
    }
  };

  // Apenas estado — a persistência (PUT debouncado) é feita dentro do StudioEditor.
  const handleUpdateProject = (project: StudioProject) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    setSelectedProject(project);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

    const res = await fetch(`/api/studio/projects/${id}`, { method: 'DELETE' });

    if (res.ok) {
      setProjects(projects.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setTab('projects');
      }
    }
  };

  // Editor em tela cheia (layout 3 painéis, cabeçalho próprio)
  if (tab === 'editor' && selectedProject) {
    return (
      <div style={{ height: '100vh', width: '100%' }}>
        <StudioEditor
          project={selectedProject}
          templates={templates}
          onProjectUpdate={handleUpdateProject}
          onBack={() => {
            setSelectedProject(null);
            setTab('projects');
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <PageHeader title="Estúdio de Conteúdo" />

      {/* Tabs */}
      <div
        style={{
          height: 44,
          backgroundColor: '#0E2A2E',
          borderBottom: '1px solid #46655C',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          gap: 0,
        }}
      >
        {[
          { key: 'projects', label: 'Projetos' },
          { key: 'editor', label: 'Editor', disabled: !selectedProject },
          { key: 'models', label: 'Modelos' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => !t.disabled && setTab(t.key as any)}
            disabled={t.disabled}
            style={{
              padding: '0 16px',
              height: '100%',
              backgroundColor: tab === t.key ? '#46655C' : 'transparent',
              color: tab === t.key ? '#D6F24B' : t.disabled ? '#666' : '#FAFAF8',
              border: 'none',
              borderBottom: tab === t.key ? '3px solid #D6F24B' : 'none',
              cursor: t.disabled ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#070d18' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#FAFAF8' }}>
            Carregando...
          </div>
        ) : tab === 'projects' ? (
          <div style={{ padding: 24 }}>
            {/* Criar carrossel completo com IA (metodologia editorial) */}
            <div style={{ marginBottom: 28, background: '#0E2A2E', border: '1px solid #46655C', padding: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#D6F24B', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                ✦ CRIAR CARROSSEL COM IA
              </div>
              <div style={{ fontSize: 12, color: '#7A8B84', marginBottom: 14 }}>
                A IA age como editora: arquétipo, densidade e humanização no tom IA Club. Você edita e publica.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Tema do carrossel (ex.: como usar IA sem gastar nada)"
                  value={iaTema}
                  onChange={(e) => setIaTema(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !iaLoading) criarCarrosselIA(); }}
                  style={{ flex: 1, minWidth: 280, padding: '10px 12px', background: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', fontSize: 13 }}
                />
                <select value={iaObjetivo} onChange={(e) => setIaObjetivo(e.target.value as any)}
                  style={{ padding: '10px', background: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', fontSize: 13, cursor: 'pointer' }}>
                  <option value="seguir">Objetivo: Seguir</option>
                  <option value="salvar">Objetivo: Salvar</option>
                  <option value="compartilhar">Objetivo: Compartilhar</option>
                  <option value="vender">Objetivo: Vender</option>
                </select>
                <select value={iaEstilo} onChange={(e) => setIaEstilo(e.target.value as Estilo)}
                  style={{ padding: '10px', background: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', fontSize: 13, cursor: 'pointer' }}>
                  <option value="escuro">Estilo: Escuro</option>
                  <option value="claro">Estilo: Claro</option>
                  <option value="tweet">Estilo: Twitter/X</option>
                </select>
                <select value={iaNum} onChange={(e) => setIaNum(parseInt(e.target.value))}
                  style={{ padding: '10px', background: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', fontSize: 13, cursor: 'pointer' }}>
                  {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} slides</option>)}
                </select>
                <button onClick={criarCarrosselIA} disabled={iaLoading || !iaTema.trim()}
                  style={{ padding: '10px 18px', background: '#D6F24B', color: '#0E2A2E', border: 'none', cursor: iaLoading ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {iaLoading ? 'Gerando roteiro…' : '✦ Gerar carrossel'}
                </button>
              </div>
              {iaAviso && <div style={{ marginTop: 10, fontSize: 12, color: '#e0c060' }}>{iaAviso}</div>}
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ marginTop: 0, marginBottom: 12, color: '#D6F24B' }}>Seus Projetos</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Nome do novo projeto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreateProject();
                  }}
                  style={{
                    flex: 1,
                    maxWidth: 300,
                    padding: '8px 12px',
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={handleCreateProject}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#D6F24B',
                    color: '#0E2A2E',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  + Novo Projeto
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: '#0E2A2E',
                    border: '1px solid #46655C',
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#D6F24B';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#0a1315';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#46655C';
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#0E2A2E';
                  }}
                  onClick={() => {
                    setSelectedProject(project);
                    setTab('editor');
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', color: '#D6F24B', fontSize: 14 }}>
                    {project.title}
                  </h3>
                  <div style={{ fontSize: 12, color: '#46655C', marginBottom: 12 }}>
                    <div>{project.format} • {project.data.slides.length} slide{project.data.slides.length !== 1 ? 's' : ''}</div>
                    <div>{new Date(project.updated_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setTab('editor');
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        backgroundColor: '#46655C',
                        color: '#FAFAF8',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#8b3333',
                        color: '#FAFAF8',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <div style={{ textAlign: 'center', color: '#46655C', padding: 40 }}>
                Nenhum projeto ainda. Crie um para começar!
              </div>
            )}
          </div>
        ) : tab === 'editor' && selectedProject ? (
          <StudioEditor
            project={selectedProject}
            templates={templates}
            onProjectUpdate={handleUpdateProject}
          />
        ) : tab === 'models' ? (
          <div style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, color: '#D6F24B' }}>Modelos de Post</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  style={{
                    backgroundColor: '#0E2A2E',
                    border: '1px solid #46655C',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={async () => {
                    const res = await fetch('/api/studio/projects', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: `${tpl.name} - ${new Date().toLocaleDateString()}`,
                        format: tpl.format,
                        template_id: tpl.id,
                      }),
                    });
                    if (res.ok) {
                      const { data } = await res.json();
                      setProjects([data, ...projects]);
                      setSelectedProject(data);
                      setTab('editor');
                    }
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '4 / 5', overflow: 'hidden', background: '#000', marginBottom: 8 }}>
                    <StudioThumbnail template={tpl.template_json} width={200} />
                  </div>
                  <h4 style={{ margin: 0, marginBottom: 4, color: '#D6F24B', fontSize: 13 }}>
                    {tpl.name}
                  </h4>
                  <div style={{ fontSize: 11, color: '#46655C' }}>
                    {tpl.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
