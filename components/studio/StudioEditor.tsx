'use client';

import { useState, useCallback } from 'react';
import type { StudioProject, Slide, SlideElement, StudioTemplate } from '@/lib/studio/types';
import { useAutosave } from '@/modules/studio/hooks/useAutosave';
import { useProjectExport } from '@/modules/studio/hooks/useProjectExport';
import { useSlideImages } from '@/modules/studio/hooks/useSlideImages';
import * as slideOps from '@/modules/studio/services/slideOps';
import * as studio from '@/modules/studio/api/studioClient';
import EditorTopbar from './EditorTopbar';
import TemplateLibrary from './TemplateLibrary';
import SlideWorkspace from './SlideWorkspace';
import InspectorPanel from './InspectorPanel';
import { C } from './editorTheme';

interface StudioEditorProps {
  project: StudioProject;
  templates: StudioTemplate[];
  onProjectUpdate: (project: StudioProject) => void;
  onBack?: () => void;
}

// Orquestrador do editor 3 painéis: mantém o estado, liga os hooks (autosave,
// export, imagens) e as operações de slide (modules/studio/services/slideOps),
// e compõe Topbar + Biblioteca + Workspace + Inspetor. Sem regra pesada inline.
export default function StudioEditor({ project, templates, onProjectUpdate, onBack }: StudioEditorProps) {
  const [currentSlideId, setCurrentSlideId] = useState(project.data.slides[0]?.id || '');
  const [selectedElementId, setSelectedElementId] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const [briefing, setBriefing] = useState('');

  const saveStatus = useAutosave(project);
  const exporter = useProjectExport(project);

  const currentSlide = project.data.slides.find((s) => s.id === currentSlideId) || project.data.slides[0];
  const currentIndex = Math.max(0, project.data.slides.findIndex((s) => s.id === currentSlide?.id));
  const textEls = (currentSlide?.elements || []).filter((e) => e.element_type === 'text').sort((a, b) => a.position_y - b.position_y);
  const imageEls = (currentSlide?.elements || []).filter((e) => e.element_type === 'image').sort((a, b) => a.position_y - b.position_y);

  const change = useCallback((updated: StudioProject) => onProjectUpdate(updated), [onProjectUpdate]);

  const patchSlide = (slide: Slide) =>
    change({ ...project, data: { ...project.data, slides: project.data.slides.map((s) => (s.id === slide.id ? slide : s)) } });

  const handleElementUpdate = (el: SlideElement) => {
    if (!currentSlide) return;
    patchSlide({ ...currentSlide, elements: currentSlide.elements.map((e) => (e.id === el.id ? el : e)) });
  };

  // Imagens (upload / busca web / print) — o hook cuida do IO; aqui só aplico ao slide.
  const images = useSlideImages({
    onWebImage: (url) => {
      if (!currentSlide) return;
      const { slide, targetId } = slideOps.applyImageUrl(currentSlide, url, selectedElementId);
      patchSlide(slide);
      setSelectedElementId(targetId);
    },
    onUploadImage: (el, url) => handleElementUpdate({ ...el, styles_json: { ...el.styles_json, imageUrl: url } }),
  });

  const addElement = (make: (z: number) => SlideElement) => {
    if (!currentSlide) return;
    const nova = make(slideOps.topZ(currentSlide));
    patchSlide({ ...currentSlide, elements: [...currentSlide.elements, nova] });
    setSelectedElementId(nova.id);
  };

  const applyTemplate = (template: StudioTemplate) => {
    if (!currentSlide || !template.template_json.slides[0]) return;
    const updated = slideOps.applyTemplateToSlide(currentSlide, template);
    change({ ...project, template_id: template.id, data: { ...project.data, slides: project.data.slides.map((s) => (s.id === currentSlide.id ? updated : s)) } });
    setSelectedElementId(undefined);
  };

  const addSlide = () => {
    const novo = slideOps.makeEmptySlide(project.format, C.petroleo);
    change({ ...project, data: { ...project.data, slides: [...project.data.slides, novo] } });
    setCurrentSlideId(novo.id);
  };

  const duplicateSlide = (id: string) => {
    const slide = project.data.slides.find((s) => s.id === id);
    if (!slide) return;
    const clone = slideOps.cloneSlide(slide);
    const idx = project.data.slides.findIndex((s) => s.id === id) + 1;
    const slides = [...project.data.slides.slice(0, idx), clone, ...project.data.slides.slice(idx)];
    change({ ...project, data: { ...project.data, slides } });
  };

  const deleteSlide = (id: string) => {
    if (project.data.slides.length <= 1) { alert('Você precisa de pelo menos um slide.'); return; }
    const remaining = project.data.slides.filter((s) => s.id !== id);
    change({ ...project, data: { ...project.data, slides: remaining } });
    if (currentSlideId === id) setCurrentSlideId(remaining[0].id);
  };

  const generateAI = async () => {
    if (!project.template_id) { alert('Aplique um modelo da Biblioteca antes de gerar com IA.'); return; }
    setGenerating(true);
    try {
      const res = await studio.generateContent({ templateId: project.template_id, briefing: briefing.trim() || project.title });
      if (!res.texts.length) { alert('A IA não retornou conteúdo.'); return; }
      const updated = slideOps.applyGeneratedTexts(currentSlide, res.texts);
      change({
        ...project,
        caption: res.caption || project.caption,
        hashtags: res.hashtags || project.hashtags,
        data: { ...project.data, slides: project.data.slides.map((s) => (s.id === currentSlide.id ? updated : s)) },
      });
      if (res.fallback) console.warn('[studio] IA em fallback:', res.aviso);
    } catch {
      alert('Erro ao gerar com IA.');
    } finally {
      setGenerating(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!currentSlide) return;
    const name = window.prompt('Nome do novo modelo:', project.title);
    if (!name) return;
    const category = window.prompt('Categoria (ex.: capa, conteudo, cta, custom):', 'custom') || 'custom';
    const r = await studio.saveTemplate({ name, category, template_json: { format: project.format, slides: [currentSlide] } });
    alert(r.ok ? `Modelo "${name}" salvo! Aparece na Biblioteca de modelos.` : r.error || 'Falha ao salvar.');
  };

  if (!currentSlide) return <div style={{ padding: 24, color: C.gelo }}>Carregando…</div>;

  return (
    <div className="studio-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#060c0d' }}>
      <style>{`
        @media (max-width: 900px) {
          .studio-shell { height: auto !important; min-height: 100vh; }
          .studio-grid { grid-template-columns: 1fr !important; height: auto !important; min-height: 0 !important; }
          .studio-grid > * { height: auto !important; min-height: 0 !important; }
          .studio-grid > *:nth-child(1) { order: 3; }
          .studio-grid > *:nth-child(2) { order: 1; min-height: 58vh; }
          .studio-grid > *:nth-child(3) { order: 2; }
        }
      `}</style>
      <EditorTopbar
        project={project}
        saveStatus={saveStatus}
        generating={generating}
        isExporting={exporter.isExporting}
        onBack={onBack}
        onTitleChange={(title) => change({ ...project, title })}
        onSaveTemplate={saveAsTemplate}
        onGenerate={generateAI}
        onExportCurrent={() => exporter.exportCurrent(currentSlide, currentIndex)}
        onExportHD={exporter.exportHD}
        onExportZip={exporter.exportZip}
      />

      <div className="studio-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px minmax(0,1fr) 300px', minHeight: 0 }}>
        <TemplateLibrary templates={templates} onApply={applyTemplate} />

        <SlideWorkspace
          project={project}
          currentSlide={currentSlide}
          currentIndex={currentIndex}
          selectedElementId={selectedElementId}
          onGoTo={(id) => { setCurrentSlideId(id); setSelectedElementId(undefined); }}
          onSelectElement={(el) => setSelectedElementId(el.id)}
          onUpdateElement={handleElementUpdate}
          onAddSlide={addSlide}
          onDuplicateSlide={duplicateSlide}
          onDeleteSlide={deleteSlide}
        />

        <InspectorPanel
          textEls={textEls}
          imageEls={imageEls}
          selectedElementId={selectedElementId}
          images={images}
          briefing={briefing}
          setBriefing={setBriefing}
          generating={generating}
          canDeleteSlide={project.data.slides.length > 1}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleElementUpdate}
          onAddImage={() => addElement(slideOps.makeImageElement)}
          onAddText={() => addElement(slideOps.makeTextElement)}
          onClearImage={(el) => handleElementUpdate({ ...el, styles_json: { ...el.styles_json, imageUrl: undefined } })}
          onGenerate={generateAI}
          onDeleteSlide={() => deleteSlide(currentSlide.id)}
        />
      </div>
    </div>
  );
}
