'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { Slide, SlideElement } from '@/lib/studio/types';
import { elementCss, slideBackgroundCss } from '@/lib/studio/elementCss';

interface EditorCanvasProps {
  slide: Slide;
  onElementSelect: (el: SlideElement) => void;
  onElementUpdate: (el: SlideElement) => void;
  selectedId?: string;
}

export default function EditorCanvas({
  slide,
  onElementSelect,
  onElementUpdate,
  selectedId,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ el: SlideElement; startX: number; startY: number } | null>(null);
  const [resizing, setResizing] = useState<
    { el: SlideElement; startX: number; startY: number; origW: number; origH: number } | null
  >(null);

  // Auto-fit zoom — cabe na LARGURA e ALTURA do container (ResizeObserver p/ medir certo)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const recalc = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const pad = 48;
      const z = Math.min(
        (w - pad) / slide.canvas_width,
        (h - pad) / slide.canvas_height,
      );
      setZoom(Math.max(0.05, Math.min(z, 1)));
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slide.canvas_width, slide.canvas_height]);

  // Atalhos de teclado: setas movem o elemento selecionado (Shift = 10px)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const t = e.target as HTMLElement;
      if (t?.isContentEditable || t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.tagName === 'SELECT') return;
      const el = slide.elements.find((x) => x.id === selectedId);
      if (!el) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') { e.preventDefault(); onElementUpdate({ ...el, position_y: el.position_y - step }); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onElementUpdate({ ...el, position_y: el.position_y + step }); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onElementUpdate({ ...el, position_x: el.position_x - step }); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onElementUpdate({ ...el, position_x: el.position_x + step }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, slide.elements, onElementUpdate]);

  const handleMouseDown = (e: React.MouseEvent, el?: SlideElement) => {
    if (!el) return;
    if ((e.target as HTMLElement).dataset.editorHandle === 'true') return;

    onElementSelect(el);
    setDragging({
      el,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizing) {
      const deltaX = (e.clientX - resizing.startX) / zoom;
      const deltaY = (e.clientY - resizing.startY) / zoom;
      const updated = {
        ...resizing.el,
        width: Math.max(24, Math.round(resizing.origW + deltaX)),
        height: Math.max(20, Math.round(resizing.origH + deltaY)),
      };
      onElementUpdate(updated);
      return;
    }
    if (!dragging) return;

    const deltaX = (e.clientX - dragging.startX) / zoom;
    const deltaY = (e.clientY - dragging.startY) / zoom;

    const updated = {
      ...dragging.el,
      position_x: Math.max(0, Math.round(dragging.el.position_x + deltaX)),
      position_y: Math.max(0, Math.round(dragging.el.position_y + deltaY)),
    };

    onElementUpdate(updated);
    setDragging({ ...dragging, el: updated, startX: e.clientX, startY: e.clientY });
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const handleDoubleClick = (el: SlideElement) => {
    if (el.element_type === 'text') {
      const editArea = document.createElement('input');
      editArea.value = el.content;
      editArea.style.position = 'fixed';
      editArea.style.left = `${el.position_x * zoom + (containerRef.current?.getBoundingClientRect().left || 0)}px`;
      editArea.style.top = `${el.position_y * zoom + (containerRef.current?.getBoundingClientRect().top || 0)}px`;
      editArea.style.width = `${el.width * zoom}px`;
      editArea.style.fontSize = `${(el.styles_json.fontSize || 24) * zoom}px`;
      editArea.style.fontFamily = el.styles_json.fontFamily || 'Instrument Sans';
      editArea.style.color = el.styles_json.color || '#dce9f7';
      editArea.style.border = '2px solid #D6F24B';
      editArea.style.zIndex = '1000';
      editArea.style.padding = '4px';

      document.body.appendChild(editArea);
      editArea.focus();
      editArea.select();

      const finishEdit = () => {
        const updated = { ...el, content: editArea.value };
        onElementUpdate(updated);
        editArea.remove();
      };

      editArea.onblur = finishEdit;
      editArea.onkeydown = (e) => {
        if (e.key === 'Enter') finishEdit();
        if (e.key === 'Escape') editArea.remove();
      };
    }
  };

  const canvasStyle = slideBackgroundCss(slide);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        backgroundColor: '#070d18',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={canvasRef}
        id={`slide-render-${slide.id}`}
        style={{
          ...canvasStyle,
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: 'default',
          flex: 'none',
        } as React.CSSProperties}
      >
        {slide.elements.map((el) => (
          <div
            key={el.id}
            style={elementCss(el)}
            onMouseDown={(e) => handleMouseDown(e, el)}
            onDoubleClick={() => handleDoubleClick(el)}
            onClick={() => onElementSelect(el)}
            data-element-id={el.id}
          >
            {el.element_type === 'text' && (
              <div style={{ whiteSpace: 'pre-wrap', width: '100%', height: '100%' }}>
                {el.content}
              </div>
            )}

            {el.element_type === 'image' &&
              (el.styles_json.imageUrl ? (
                <img
                  src={el.styles_json.imageUrl}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: el.styles_json.objectFit || 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(250,250,248,0.4)',
                    fontSize: 12,
                  }}
                >
                  🖼
                </div>
              ))}

            {selectedId === el.id && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '2px solid #D6F24B',
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 4px rgba(214, 242, 75, 0.2)',
                }}
              >
                <div
                  data-editor-handle="true"
                  data-editor-chrome="true"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizing({
                      el,
                      startX: e.clientX,
                      startY: e.clientY,
                      origW: el.width,
                      origH: el.height,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    width: 16,
                    height: 16,
                    backgroundColor: '#D6F24B',
                    border: '2px solid #0E2A2E',
                    bottom: -8,
                    right: -8,
                    cursor: 'nwse-resize',
                    pointerEvents: 'auto',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
