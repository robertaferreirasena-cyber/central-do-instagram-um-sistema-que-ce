// Domínio STUDIO — operações PURAS sobre slides/elementos (sem React, sem IO).
// O editor só orquestra: chama estas funções e grava o resultado no estado.
import type { Slide, SlideElement, StudioTemplate, PostFormat } from '@/lib/studio/types';
import { CANVAS_DIMENSIONS } from '@/lib/studio/types';

const uid = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
export const topZ = (slide: Slide) => Math.max(0, ...slide.elements.map((e) => e.z_index)) + 1;

const GELO = '#FAFAF8';

export function makeImageElement(zIndex: number): SlideElement {
  return {
    id: uid(),
    element_type: 'image',
    content: '',
    styles_json: { backgroundColor: '#16181C', border: '1px solid #2F3336', borderRadius: 8, objectFit: 'cover' },
    position_x: 120, position_y: 320, width: 840, height: 620, z_index: zIndex,
  };
}

export function makeTextElement(zIndex: number): SlideElement {
  return {
    id: uid(),
    element_type: 'text',
    content: 'Novo texto',
    styles_json: { fontFamily: 'Instrument Sans', fontSize: 40, color: GELO, fontWeight: 400, lineHeight: 1.3 },
    position_x: 80, position_y: 200, width: 900, height: 200, z_index: zIndex,
  };
}

export function makeEmptySlide(format: PostFormat, background = '#0E2A2E'): Slide {
  const dim = CANVAS_DIMENSIONS[format];
  return {
    id: `slide-${Date.now()}`,
    background_type: 'solid',
    background_value: background,
    overlay_color: null,
    overlay_value: null,
    canvas_width: dim.w,
    canvas_height: dim.h,
    elements: [],
  };
}

export function cloneSlide(slide: Slide): Slide {
  return {
    ...slide,
    id: `slide-${Date.now()}`,
    elements: slide.elements.map((el, i) => ({ ...el, id: `el-${Date.now()}-${i}` })),
  };
}

// Aplica um template ao slide atual, preservando dimensões do slide.
export function applyTemplateToSlide(current: Slide, template: StudioTemplate): Slide {
  const ts = template.template_json.slides[0];
  return {
    ...current,
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
}

// Distribui os textos gerados pela IA nos elementos text (de cima p/ baixo).
export function applyGeneratedTexts(current: Slide, texts: string[]): Slide {
  const ordered = current.elements
    .filter((e) => e.element_type === 'text')
    .sort((a, b) => a.position_y - b.position_y);
  const map = new Map<string, string>();
  ordered.forEach((el, i) => {
    if (texts[i]) map.set(el.id, texts[i]);
  });
  return {
    ...current,
    elements: current.elements.map((e) => (map.has(e.id) ? { ...e, content: map.get(e.id)! } : e)),
  };
}

// Aplica uma imageUrl: no elemento selecionado (se image), no 1º image, ou cria um.
// Devolve o slide novo + o id do elemento afetado (para seleção na UI).
export function applyImageUrl(current: Slide, imageUrl: string, selectedId?: string): { slide: Slide; targetId: string } {
  const imgs = current.elements.filter((e) => e.element_type === 'image');
  const sel = current.elements.find((e) => e.id === selectedId);
  let targetId = sel?.element_type === 'image' ? sel.id : imgs[0]?.id;
  let elements = current.elements;
  if (!targetId) {
    const nova: SlideElement = {
      id: uid(), element_type: 'image', content: '',
      styles_json: { borderRadius: 8, objectFit: 'cover' },
      position_x: 120, position_y: 320, width: 840, height: 620, z_index: topZ(current),
    };
    elements = [...elements, nova];
    targetId = nova.id;
  }
  elements = elements.map((e) => (e.id === targetId ? { ...e, styles_json: { ...e.styles_json, imageUrl } } : e));
  return { slide: { ...current, elements }, targetId };
}
