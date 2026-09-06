// Domínio STUDIO — regra de negócio do "autodidata" de carrossel.
// Pega o roteiro (metodologia carrossel-instagram) e monta os slides no formato
// do editor, escolhendo o melhor template por tipo/estilo e injetando o conteúdo.
// SEM UI e SEM fetch — só transformação de dados (testável isolado).
import type { StudioTemplate, Slide } from '@/lib/studio/types';

export type Estilo = 'escuro' | 'claro' | 'tweet';

// Converte um roteiro em slides na identidade IA Club V2 (fallback quando não há
// template combinando — mantém o carrossel utilizável mesmo sem biblioteca).
export function roteiroToSlides(
  roteiro: { slides: { titulo: string; corpo: string }[] },
  w = 1080,
  h = 1350,
): Slide[] {
  return roteiro.slides.map((s, i) => {
    const elements: Slide['elements'] = [];
    let z = 1;
    elements.push({
      id: `el-${Date.now()}-${i}-tag`,
      element_type: 'text',
      content: `IA CLUB // ${String(i + 1).padStart(2, '0')}`,
      styles_json: { fontFamily: 'JetBrains Mono', fontSize: 26, color: '#D6F24B', fontWeight: 700, letterSpacing: 2, textAlign: 'left', lineHeight: 1.2 },
      position_x: 80, position_y: 90, width: 900, height: 40, z_index: z++,
    });
    if (s.titulo) {
      elements.push({
        id: `el-${Date.now()}-${i}-tit`,
        element_type: 'text',
        content: s.titulo,
        styles_json: { fontFamily: 'Archivo', fontSize: i === 0 ? 82 : 60, color: '#FAFAF8', fontWeight: 800, textAlign: 'left', lineHeight: 1.05, letterSpacing: -1 },
        position_x: 80, position_y: i === 0 ? 430 : 200, width: 920, height: 300, z_index: z++,
      });
    }
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

// AUTODIDATA: nomes de template preferidos para um tipo de slide, no estilo dado.
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

export function escolherTemplate(tipo: string, estilo: Estilo, templates: StudioTemplate[]): StudioTemplate | null {
  for (const n of nomesTemplatePorTipo(tipo, estilo)) {
    const t = templates.find((t) => t.name === n);
    if (t) return t;
  }
  return templates.find((t) => t.name.startsWith('IA Club • Conteúdo')) || templates[0] || null;
}

// Extrai o número/estatística mais forte (para o slot gigante do "Número Grande").
export function extrairNumero(texto: string): string | null {
  const t = texto || '';
  const m =
    t.match(/\d{1,3}([.,]\d+)?\s*%/) ||
    t.match(/\d+\s*em\s*cada\s*\d+/i) ||
    t.match(/\b\d+\s*x\b/i) ||
    t.match(/R\$\s?\d{1,3}([.,]\d{3})*([.,]\d+)?/) ||
    t.match(/\b\d{2,}([.,]\d+)?\b/);
  return m ? m[0].trim() : null;
}

// DESIGNER: injeta o conteúdo do slide no template escolhido.
export function preencherTemplate(tpl: StudioTemplate, s: { titulo: string; corpo: string }): Slide {
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
  const ehNumero = !!titulo && (titulo.styles_json.fontSize || 0) >= 120;
  if (ehNumero) {
    const num = extrairNumero(`${s.titulo} ${s.corpo}`);
    if (titulo) titulo.content = num || s.titulo || titulo.content;
    if (corpo) corpo.content = s.titulo || s.corpo || corpo.content;
  } else {
    if (titulo && s.titulo) titulo.content = s.titulo;
    if (corpo && s.corpo) corpo.content = s.corpo;
  }
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

// Alto nível: transforma os slides do roteiro em slides do editor (autodidata).
export function montarSlidesDoRoteiro(
  roteiroSlides: Array<{ titulo: string; corpo: string; tipo?: string }>,
  estilo: Estilo,
  templates: StudioTemplate[],
): Slide[] {
  return roteiroSlides.map((s) => {
    const tpl = templates.length ? escolherTemplate(s.tipo || 'conteudo', estilo, templates) : null;
    return tpl ? preencherTemplate(tpl, s) : roteiroToSlides({ slides: [s] })[0];
  });
}
