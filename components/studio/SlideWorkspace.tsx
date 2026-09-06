'use client';
import EditorCanvas from './EditorCanvas';
import StudioThumbnail from './StudioThumbnail';
import type { StudioProject, Slide, SlideElement } from '@/lib/studio/types';
import { C } from './editorTheme';

// Painel CENTRO: navegação de slides, canvas de edição e tira de miniaturas.
export default function SlideWorkspace(props: {
  project: StudioProject;
  currentSlide: Slide;
  currentIndex: number;
  selectedElementId?: string;
  onGoTo: (slideId: string) => void;
  onSelectElement: (el: SlideElement) => void;
  onUpdateElement: (el: SlideElement) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
}) {
  const { project, currentSlide, currentIndex } = props;
  const slides = project.data.slides;
  const navBtn = { width: 30, height: 30, background: C.petroleo, color: C.gelo, border: `1px solid ${C.eucalipto}`, cursor: 'pointer' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: '#060c0d' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', color: C.gelo, fontSize: 13 }}>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.1em' }}>
          CARROSSEL {project.format}
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => props.onGoTo(slides[Math.max(0, currentIndex - 1)].id)} style={navBtn}>‹</button>
          <b>{currentIndex + 1} / {slides.length}</b>
          <button onClick={() => props.onGoTo(slides[Math.min(slides.length - 1, currentIndex + 1)].id)} style={navBtn}>›</button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <EditorCanvas
          slide={currentSlide}
          onElementSelect={props.onSelectElement}
          onElementUpdate={props.onUpdateElement}
          selectedId={props.selectedElementId}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', overflowX: 'auto', borderTop: `1px solid ${C.borda}`, background: C.petroleo }}>
        {slides.map((s, i) => (
          <div key={s.id} style={{ position: 'relative', flex: '0 0 auto' }}>
            <button
              onClick={() => props.onGoTo(s.id)}
              style={{ width: 60, height: 75, padding: 0, overflow: 'hidden', border: `2px solid ${s.id === currentSlide.id ? C.citrico : 'transparent'}`, background: '#000', cursor: 'pointer' }}
            >
              <StudioThumbnail slide={s} width={56} />
            </button>
            <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, color: C.gelo, fontFamily: 'JetBrains Mono, monospace' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
              <button onClick={() => props.onDuplicateSlide(s.id)} title="Duplicar" style={{ flex: 1, fontSize: 9, background: C.petroleoEscuro, color: C.eucalipto, border: 'none', cursor: 'pointer', padding: '2px 0' }}>⧉</button>
              <button onClick={() => props.onDeleteSlide(s.id)} title="Excluir" style={{ flex: 1, fontSize: 9, background: C.petroleoEscuro, color: '#c77', border: 'none', cursor: 'pointer', padding: '2px 0' }}>✕</button>
            </div>
          </div>
        ))}
        <button onClick={props.onAddSlide} style={{ height: 40, padding: '0 14px', border: `1px dashed ${C.eucalipto}`, background: 'transparent', color: C.citrico, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700, flex: '0 0 auto' }}>
          + Slide
        </button>
      </div>
    </div>
  );
}
