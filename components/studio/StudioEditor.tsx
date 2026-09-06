'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { StudioProject, Slide, SlideElement, StudioTemplate } from '@/lib/studio/types';
import { CANVAS_DIMENSIONS } from '@/lib/studio/types';
import EditorCanvas from './EditorCanvas';
import StudioThumbnail from './StudioThumbnail';

interface StudioEditorProps {
  project: StudioProject;
  templates: StudioTemplate[];
  onProjectUpdate: (project: StudioProject) => void;
  onBack?: () => void;
}

// Paleta IA Club V2
const C = {
  gelo: '#FAFAF8',
  petroleo: '#0E2A2E',
  citrico: '#D6F24B',
  eucalipto: '#46655C',
  petroleoEscuro: '#0a1315',
  borda: '#1c3b3f',
};

export default function StudioEditor({ project, templates, onProjectUpdate, onBack }: StudioEditorProps) {
  const [currentSlideId, setCurrentSlideId] = useState(project.data.slides[0]?.id || '');
  const [selectedElementId, setSelectedElementId] = useState<string>();
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('');
  const [briefing, setBriefing] = useState('');

  const currentSlide =
    project.data.slides.find((s) => s.id === currentSlideId) || project.data.slides[0];
  const currentIndex = Math.max(0, project.data.slides.findIndex((s) => s.id === currentSlide?.id));
  const textEls = (currentSlide?.elements || [])
    .filter((e) => e.element_type === 'text')
    .sort((a, b) => a.position_y - b.position_y);
  const imageEls = (currentSlide?.elements || [])
    .filter((e) => e.element_type === 'image')
    .sort((a, b) => a.position_y - b.position_y);

  // Autosave DEBOUNCED na versão mais nova do projeto (sem closure obsoleta)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/studio/projects/${project.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: project.title,
            status: project.status,
            caption: project.caption,
            hashtags: project.hashtags,
            data: project.data,
          }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [project]);

  const change = useCallback(
    (updated: StudioProject) => onProjectUpdate(updated),
    [onProjectUpdate],
  );

  const patchSlide = (slide: Slide) => {
    change({
      ...project,
      data: { slides: project.data.slides.map((s) => (s.id === slide.id ? slide : s)) },
    });
  };

  const handleElementUpdate = (el: SlideElement) => {
    if (!currentSlide) return;
    patchSlide({
      ...currentSlide,
      elements: currentSlide.elements.map((e) => (e.id === el.id ? el : e)),
    });
  };

  // Upload de imagem para um elemento image (avatar, foto de conteúdo, etc.)
  const uploadImage = async (el: SlideElement, file: File) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/studio/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json?.url) {
        handleElementUpdate({ ...el, styles_json: { ...el.styles_json, imageUrl: json.url } });
      } else {
        alert('Falha no upload da imagem.');
      }
    } catch {
      alert('Erro ao enviar a imagem.');
    }
  };

  const applyTemplate = (template: StudioTemplate) => {
    if (!currentSlide || !template.template_json.slides[0]) return;
    const ts = template.template_json.slides[0];
    const updatedSlide: Slide = {
      ...currentSlide,
      background_type: ts.background_type,
      background_value: ts.background_value,
      overlay_color: ts.overlay_color || null,
      overlay_value: ts.overlay_value || null,
      elements: ts.elements.map((el, i) => ({
        id: `el-${Date.now()}-${i}`,
        element_type: el.element_type,
        content: el.content,
        styles_json: el.styles_json,
        position_x: el.position_x,
        position_y: el.position_y,
        width: el.width,
        height: el.height,
        z_index: el.z_index,
      })),
    };
    // aplica + registra o template_id no projeto (para a IA saber o layout)
    change({
      ...project,
      template_id: template.id,
      data: { slides: project.data.slides.map((s) => (s.id === currentSlide.id ? updatedSlide : s)) },
    });
    setSelectedElementId(undefined);
  };

  const addSlide = () => {
    const dim = CANVAS_DIMENSIONS[project.format];
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      background_type: 'solid',
      background_value: C.petroleo,
      overlay_color: null,
      overlay_value: null,
      canvas_width: dim.w,
      canvas_height: dim.h,
      elements: [],
    };
    change({ ...project, data: { slides: [...project.data.slides, newSlide] } });
    setCurrentSlideId(newSlide.id);
  };

  const duplicateSlide = (id: string) => {
    const slide = project.data.slides.find((s) => s.id === id);
    if (!slide) return;
    const clone: Slide = {
      ...slide,
      id: `slide-${Date.now()}`,
      elements: slide.elements.map((el, i) => ({ ...el, id: `el-${Date.now()}-${i}` })),
    };
    const idx = project.data.slides.findIndex((s) => s.id === id) + 1;
    const slides = [
      ...project.data.slides.slice(0, idx),
      clone,
      ...project.data.slides.slice(idx),
    ];
    change({ ...project, data: { slides } });
  };

  const deleteSlide = (id: string) => {
    if (project.data.slides.length <= 1) {
      alert('Você precisa de pelo menos um slide.');
      return;
    }
    const remaining = project.data.slides.filter((s) => s.id !== id);
    change({ ...project, data: { slides: remaining } });
    if (currentSlideId === id) setCurrentSlideId(remaining[0].id);
  };

  // ---------- Gerar com IA ----------
  const generateAI = async () => {
    if (!project.template_id) {
      alert('Aplique um modelo da Biblioteca antes de gerar com IA.');
      return;
    }
    const tema = briefing.trim() || project.title;
    setGenerating(true);
    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: project.template_id, briefing: tema }),
      });
      const json = await res.json();
      const texts: string[] = json?.data?.texts || [];
      if (!texts.length) {
        alert('A IA não retornou conteúdo.');
        return;
      }
      // aplica os textos gerados nos elementos text (na ordem de cima p/ baixo)
      const ordered = [...currentSlide.elements]
        .filter((e) => e.element_type === 'text')
        .sort((a, b) => a.position_y - b.position_y);
      const map = new Map<string, string>();
      ordered.forEach((el, i) => {
        if (texts[i]) map.set(el.id, texts[i]);
      });
      const updatedSlide: Slide = {
        ...currentSlide,
        elements: currentSlide.elements.map((e) =>
          map.has(e.id) ? { ...e, content: map.get(e.id)! } : e,
        ),
      };
      change({
        ...project,
        caption: json?.data?.caption || project.caption,
        hashtags: json?.data?.hashtags || project.hashtags,
        data: { slides: project.data.slides.map((s) => (s.id === currentSlide.id ? updatedSlide : s)) },
      });
      if (json.fallback) {
        console.warn('[studio] IA em fallback:', json.aviso);
      }
    } catch (e) {
      alert('Erro ao gerar com IA.');
    } finally {
      setGenerating(false);
    }
  };

  // ---------- Export (tudo via render server-side Playwright, alta fidelidade) ----------
  const exportCurrent = async () => {
    if (!currentSlide) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/studio/export-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: [currentSlide] }),
      });
      if (!response.ok) throw new Error('falhou');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'post'}-${currentIndex + 1}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar slide.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportHD = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/studio/export-png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: project.data.slides }),
      });

      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'carrossel'}-hd.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar HD.');
    } finally {
      setIsExporting(false);
    }
  };

  // Baixar ZIP = mesmo render server-side de alta fidelidade (Playwright, todos os slides).
  // O antigo html-to-image em clone off-screen saía branco/estreito — abandonado.
  const exportZip = exportHD;

  // Salvar o slide atual como um novo MODELO (aparece na Biblioteca de modelos)
  const saveAsTemplate = async () => {
    if (!currentSlide) return;
    const name = window.prompt('Nome do novo modelo:', project.title);
    if (!name) return;
    const category = window.prompt('Categoria (ex.: capa, conteudo, cta, custom):', 'custom') || 'custom';
    try {
      const res = await fetch('/api/studio/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, template_json: { format: project.format, slides: [currentSlide] } }),
      });
      const json = await res.json();
      alert(res.ok ? `Modelo "${name}" salvo! Aparece na Biblioteca de modelos.` : json.error || 'Falha ao salvar.');
    } catch {
      alert('Erro ao salvar o modelo.');
    }
  };

  if (!currentSlide) return <div style={{ padding: 24, color: C.gelo }}>Carregando…</div>;

  const btn = (bg: string, fg: string): React.CSSProperties => ({
    padding: '10px 16px',
    background: bg,
    color: fg,
    border: `1px solid ${bg === 'transparent' ? C.eucalipto : bg}`,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'Archivo, sans-serif',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#060c0d' }}>
      {/* Header */}
      <div
        style={{
          height: 60,
          background: C.petroleo,
          borderBottom: `1px solid ${C.borda}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
        }}
      >
        {onBack && (
          <button onClick={onBack} style={btn('transparent', C.gelo)}>
            ← Projetos
          </button>
        )}
        <input
          value={project.title}
          onChange={(e) => change({ ...project, title: e.target.value })}
          style={{
            background: C.petroleoEscuro,
            color: C.gelo,
            border: `1px solid ${C.eucalipto}`,
            padding: '8px 12px',
            fontSize: 14,
            fontWeight: 700,
            minWidth: 220,
            fontFamily: 'Archivo, sans-serif',
          }}
        />
        <span style={{ fontSize: 12, color: saveStatus === 'saved' ? C.citrico : C.eucalipto, marginLeft: 4 }}>
          {saveStatus === 'saving' ? 'Salvando…' : saveStatus === 'saved' ? '✓ Salvo' : 'Salvo automaticamente'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={saveAsTemplate} style={btn('transparent', C.gelo)}>
            💾 Salvar modelo
          </button>
          <button onClick={generateAI} disabled={generating} style={btn(C.citrico, C.petroleo)}>
            {generating ? 'Gerando…' : '✦ Gerar com IA'}
          </button>
          <button onClick={exportCurrent} disabled={isExporting} style={btn('transparent', C.gelo)}>
            ↓ PNG
          </button>
          <button onClick={exportHD} disabled={isExporting} style={btn(C.citrico, C.petroleo)}>
            {isExporting ? '…' : '🔶 Exportar HD'}
          </button>
          <button onClick={exportZip} disabled={isExporting} style={btn(C.eucalipto, C.gelo)}>
            {isExporting ? '…' : '⤓ Baixar ZIP'}
          </button>
        </div>
      </div>

      {/* Shell 3 colunas */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px minmax(0,1fr) 300px', minHeight: 0 }}>
        {/* ESQUERDA — Biblioteca */}
        <div style={{ background: C.petroleo, borderRight: `1px solid ${C.borda}`, overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
            BIBLIOTECA
          </div>
          <div style={{ fontSize: 12, color: C.eucalipto, marginBottom: 12 }}>Modelos do seu Post Studio</div>
          <input
            placeholder="Buscar modelo…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: C.petroleoEscuro,
              color: C.gelo,
              border: `1px solid ${C.eucalipto}`,
              padding: '9px 10px',
              fontSize: 12,
              marginBottom: 14,
            }}
          />
          <div style={{ display: 'grid', gap: 10 }}>
            {templates
              .filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
              .map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  title="Aplicar ao slide atual"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr',
                    gap: 10,
                    alignItems: 'center',
                    textAlign: 'left',
                    background: C.petroleoEscuro,
                    border: `1px solid ${C.borda}`,
                    padding: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 64, height: 80, overflow: 'hidden', background: '#000', flex: 'none' }}>
                    <StudioThumbnail template={tpl.template_json} width={64} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: 12, color: C.gelo, fontFamily: 'Archivo, sans-serif' }}>
                      {tpl.name}
                    </b>
                    <small style={{ display: 'block', fontSize: 10, color: C.eucalipto, margin: '2px 0 6px' }}>
                      {tpl.category}
                    </small>
                    <em style={{ fontSize: 10, fontStyle: 'normal', color: C.citrico }}>Aplicar ao slide</em>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* CENTRO — Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: '#060c0d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', color: C.gelo, fontSize: 13 }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.1em' }}>
              CARROSSEL {project.format}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentSlideId(project.data.slides[Math.max(0, currentIndex - 1)].id)}
                style={{ width: 30, height: 30, background: C.petroleo, color: C.gelo, border: `1px solid ${C.eucalipto}`, cursor: 'pointer' }}
              >
                ‹
              </button>
              <b>{currentIndex + 1} / {project.data.slides.length}</b>
              <button
                onClick={() => setCurrentSlideId(project.data.slides[Math.min(project.data.slides.length - 1, currentIndex + 1)].id)}
                style={{ width: 30, height: 30, background: C.petroleo, color: C.gelo, border: `1px solid ${C.eucalipto}`, cursor: 'pointer' }}
              >
                ›
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <EditorCanvas
              slide={currentSlide}
              onElementSelect={(el) => setSelectedElementId(el.id)}
              onElementUpdate={handleElementUpdate}
              selectedId={selectedElementId}
            />
          </div>

          {/* Tira de slides */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', overflowX: 'auto', borderTop: `1px solid ${C.borda}`, background: C.petroleo }}>
            {project.data.slides.map((s, i) => (
              <div key={s.id} style={{ position: 'relative', flex: '0 0 auto' }}>
                <button
                  onClick={() => { setCurrentSlideId(s.id); setSelectedElementId(undefined); }}
                  style={{
                    width: 60,
                    height: 75,
                    padding: 0,
                    overflow: 'hidden',
                    border: `2px solid ${s.id === currentSlide.id ? C.citrico : 'transparent'}`,
                    background: '#000',
                    cursor: 'pointer',
                  }}
                >
                  <StudioThumbnail slide={s as any} width={56} />
                </button>
                <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, color: C.gelo, fontFamily: 'JetBrains Mono, monospace' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                  <button onClick={() => duplicateSlide(s.id)} title="Duplicar" style={{ flex: 1, fontSize: 9, background: C.petroleoEscuro, color: C.eucalipto, border: 'none', cursor: 'pointer', padding: '2px 0' }}>⧉</button>
                  <button onClick={() => deleteSlide(s.id)} title="Excluir" style={{ flex: 1, fontSize: 9, background: C.petroleoEscuro, color: '#c77', border: 'none', cursor: 'pointer', padding: '2px 0' }}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={addSlide} style={{ height: 40, padding: '0 14px', border: `1px dashed ${C.eucalipto}`, background: 'transparent', color: C.citrico, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700, flex: '0 0 auto' }}>
              + Slide
            </button>
          </div>
        </div>

        {/* DIREITA — Inspetor */}
        <div style={{ background: C.petroleo, borderLeft: `1px solid ${C.borda}`, overflowY: 'auto', padding: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>
            EDITAR CONTEÚDO
          </div>

          {textEls.length === 0 && (
            <div style={{ fontSize: 12, color: C.eucalipto, lineHeight: 1.5 }}>
              Aplique um modelo da Biblioteca para editar os textos aqui.
            </div>
          )}

          {textEls.map((el, i) => (
            <label key={el.id} style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gelo }}>
                {i === 0 ? 'Cabeçalho / etiqueta' : i === 1 ? 'Manchete' : i === textEls.length - 1 ? 'CTA / rodapé' : `Texto ${i + 1}`}
              </span>
              <textarea
                value={el.content}
                onChange={(e) => handleElementUpdate({ ...el, content: e.target.value })}
                onFocus={() => setSelectedElementId(el.id)}
                rows={el.content.length > 60 ? 3 : 2}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  marginTop: 6,
                  background: C.petroleoEscuro,
                  color: C.gelo,
                  border: `1px solid ${selectedElementId === el.id ? C.citrico : C.eucalipto}`,
                  padding: 9,
                  fontSize: 12,
                  fontFamily: 'Instrument Sans, sans-serif',
                  resize: 'vertical',
                }}
              />
              <span style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={el.styles_json.color || C.gelo}
                  onChange={(e) => handleElementUpdate({ ...el, styles_json: { ...el.styles_json, color: e.target.value } })}
                  style={{ width: 26, height: 26, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                  title="Cor do texto"
                />
                <input
                  type="number"
                  value={el.styles_json.fontSize || 24}
                  onChange={(e) => handleElementUpdate({ ...el, styles_json: { ...el.styles_json, fontSize: parseInt(e.target.value) || 24 } })}
                  style={{ width: 64, background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: 4, fontSize: 11 }}
                  title="Tamanho"
                />
                <span style={{ fontSize: 10, color: C.eucalipto, marginLeft: 'auto' }}>{el.content.length} car.</span>
              </span>
            </label>
          ))}

          {imageEls.length > 0 && (
            <div style={{ marginTop: 8, borderTop: `1px solid ${C.borda}`, paddingTop: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>
                IMAGENS
              </div>
              {imageEls.map((el, i) => (
                <div key={el.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ width: 52, height: 52, flex: 'none', overflow: 'hidden', background: '#000', border: `1px solid ${C.eucalipto}`, borderRadius: el.styles_json.isCircle ? '50%' : 4, backgroundImage: el.styles_json.imageUrl ? `url(${el.styles_json.imageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: C.gelo, marginBottom: 4 }}>
                      {el.styles_json.isCircle ? 'Avatar' : `Imagem ${i + 1}`}
                    </div>
                    <label style={{ display: 'inline-block', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: C.petroleo, background: C.citrico, padding: '5px 10px' }}>
                      {el.styles_json.imageUrl ? 'Trocar' : 'Enviar'} imagem
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(el, f); e.currentTarget.value = ''; }} />
                    </label>
                    {el.styles_json.imageUrl && (
                      <button onClick={() => handleElementUpdate({ ...el, styles_json: { ...el.styles_json, imageUrl: undefined } })}
                        style={{ marginLeft: 6, fontSize: 11, background: 'transparent', color: '#c77', border: 'none', cursor: 'pointer' }}>remover</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, background: 'rgba(214,242,75,0.08)', color: C.citrico, padding: 12, fontSize: 11, lineHeight: 1.45, marginTop: 8 }}>
            ✦ A IA preenche só os textos; o layout e a marca IA Club ficam protegidos.
          </div>

          <label style={{ display: 'block', marginTop: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gelo }}>Tema / briefing (opcional)</span>
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Ex.: como a IA ajuda pequenos negócios a ganhar tempo"
              rows={2}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                marginTop: 6,
                background: C.petroleoEscuro,
                color: C.gelo,
                border: `1px solid ${C.eucalipto}`,
                padding: 9,
                fontSize: 12,
                fontFamily: 'Instrument Sans, sans-serif',
                resize: 'vertical',
              }}
            />
          </label>

          <button onClick={generateAI} disabled={generating} style={{ ...btn(C.citrico, C.petroleo), width: '100%', justifyContent: 'center', marginTop: 12 }}>
            {generating ? 'Gerando…' : '✦ Gerar com IA'}
          </button>

          {project.data.slides.length > 1 && (
            <button onClick={() => deleteSlide(currentSlide.id)} style={{ ...btn('transparent', '#e08a8a'), width: '100%', justifyContent: 'center', marginTop: 10, borderColor: '#5c2b2b' }}>
              🗑 Excluir slide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
