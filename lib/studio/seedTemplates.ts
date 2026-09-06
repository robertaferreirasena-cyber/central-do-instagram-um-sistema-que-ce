import type { TemplateSnapshot, TemplateElementSnapshot, ElementStyles } from "./types";

interface SeedTemplate {
  name: string;
  category: string;
  template_json: TemplateSnapshot;
  sequence_order?: number;
}

const S = 2.7; // fator de escala 400→1080
const CW = 1080;
const CH = 1350;

// Identidade IA Club V2
const COLORS = {
  gelo: "#FAFAF8",
  petroleo: "#0E2A2E",
  citrico: "#D6F24B",
  eucalipto: "#46655C",
  dark: "rgba(14, 42, 46, 0.95)",
};

let zCounter = 1;
const resetZ = () => { zCounter = 1; };

function T(
  text: string,
  font: string,
  size: number,
  color: string,
  italic: boolean,
  x: number,
  y: number,
  w: number,
  extra: Partial<ElementStyles> = {},
): TemplateElementSnapshot {
  zCounter += 1;
  const styles: ElementStyles = {
    fontFamily: font,
    fontSize: Math.round(size * S),
    color,
    fontStyle: italic ? "italic" : "normal",
    fontWeight: 700,
    textAlign: "left",
    lineHeight: 1.1,
    letterSpacing: 0,
    textShadow: "0 2px 20px rgba(0,0,0,.6)",
    ...extra,
  };
  return {
    element_type: "text",
    content: text,
    styles_json: styles,
    position_x: Math.round(x * S),
    position_y: Math.round(y * S),
    width: Math.round(w * S),
    height: Math.round((size * 1.4 * Math.max(1, text.split("\n").length)) * S),
    z_index: zCounter,
  };
}

function B(
  variant: "brown" | "gold" | "dark" | "outline",
  x: number,
  y: number,
  w: number,
  h: number,
  extra: Partial<ElementStyles> = {},
): TemplateElementSnapshot {
  zCounter += 1;
  const variants: Record<string, ElementStyles> = {
    brown: {
      background: "rgba(70, 101, 92, 0.9)",
      borderRadius: 4,
      border: "1.5px dashed rgba(255,255,255,.38)",
    },
    gold: { background: COLORS.citrico, borderRadius: 26 },
    dark: {
      background: "rgba(14, 42, 46, 0.85)",
      borderRadius: 10,
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,.13)",
    },
    outline: {
      background: "transparent",
      borderRadius: 6,
      border: "2px solid rgba(214, 242, 75, 0.75)",
    },
  };
  return {
    element_type: "box",
    content: "",
    styles_json: { boxVariant: variant, ...variants[variant], ...extra },
    position_x: Math.round(x * S),
    position_y: Math.round(y * S),
    width: Math.round(w * S),
    height: Math.round(h * S),
    z_index: zCounter,
  };
}

function I(x: number, y: number, w: number, h: number, isCircle = false): TemplateElementSnapshot {
  zCounter += 1;
  return {
    element_type: "image",
    content: "",
    styles_json: {
      isCircle,
      borderRadius: isCircle ? "50%" : 0,
      backgroundColor: "rgba(200,200,200,0.2)",
      border: "2px dashed rgba(200,200,200,0.6)",
    },
    position_x: Math.round(x * S),
    position_y: Math.round(y * S),
    width: Math.round(w * S),
    height: Math.round(h * S),
    z_index: zCounter,
  };
}

const HEADER = (centered = false): TemplateElementSnapshot =>
  T("@SeunomeAqui  •  Seu nicho", "Instrument Sans", 11, "rgba(250, 250, 248, .8)", false, 20, 16, 360, {
    fontWeight: 400,
    textAlign: centered ? "center" : "left",
  });

function B_seal_zigzag(x: number, y: number, size: number, bg: string, fg: string): TemplateElementSnapshot {
  zCounter += 1;
  return {
    element_type: "box",
    content: "",
    styles_json: {
      background: bg,
      border: `3px solid ${fg}`,
      clipPath: "polygon(0% 8%,8% 0%,16% 8%,24% 0%,32% 8%,40% 0%,48% 8%,56% 0%,64% 8%,72% 0%,80% 8%,88% 0%,96% 8%,100% 16%,92% 24%,100% 32%,92% 40%,100% 48%,92% 56%,100% 64%,92% 72%,100% 80%,92% 88%,100% 96%,84% 100%,76% 92%,68% 100%,60% 92%,52% 100%,44% 92%,36% 100%,28% 92%,20% 100%,12% 92%,4% 100%,0% 84%,8% 76%,0% 68%,8% 60%,0% 52%,8% 44%,0% 36%,8% 28%,0% 20%)",
      boxShadow: "0 4px 14px rgba(0,0,0,.25)",
    },
    position_x: Math.round(x * S),
    position_y: Math.round(y * S),
    width: Math.round(size * S),
    height: Math.round(size * S),
    z_index: zCounter,
  };
}

function B_spiral_binding(x: number, y: number, w: number): TemplateElementSnapshot {
  zCounter += 1;
  const holeColor = "#8899aa";
  const shadows: string[] = [];
  const holes = 12;
  const step = (w - 16) / (holes - 1);
  for (let i = 0; i < holes; i++) {
    const cx = 8 + i * step;
    shadows.push(`${cx}px 4px 0 1px ${holeColor}, ${cx}px 4px 6px 2px rgba(0,0,0,.45)`);
  }
  return {
    element_type: "box",
    content: "",
    styles_json: {
      background: "transparent",
      boxShadow: shadows.join(", "),
    },
    position_x: Math.round(x * S),
    position_y: Math.round(y * S),
    width: Math.round(w * S),
    height: Math.round(14 * S),
    z_index: zCounter,
  };
}

function B_seal_citric(x: number, y: number, size: number): TemplateElementSnapshot {
  zCounter += 1;
  return {
    element_type: "box",
    content: "",
    styles_json: {
      background: `radial-gradient(circle at 30% 30%, ${COLORS.citrico} 0%, #a8c520 45%, #7a9518 100%)`,
      clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
      boxShadow: "0 6px 18px rgba(0,0,0,.5)",
    },
    position_x: Math.round(x * S),
    position_y: Math.round(y * S),
    width: Math.round(size * S),
    height: Math.round(size * S),
    z_index: zCounter,
  };
}

function build(
  bg: string,
  overlayAlpha: number,
  builder: () => TemplateElementSnapshot[],
): TemplateSnapshot {
  resetZ();
  const elements = builder();
  return {
    format: "4:5",
    slides: [
      {
        background_type: bg.startsWith("linear-gradient") ? "gradient" : "solid",
        background_value: bg,
        overlay_color: "#000000",
        overlay_value: String(overlayAlpha / 100),
        canvas_width: CW,
        canvas_height: CH,
        elements,
      },
    ],
  };
}

// Tweet estilo Twitter/X 1080×1440, fundo escuro ou claro
function TWEET(dark: boolean): TemplateSnapshot {
  const bg = dark ? "#000000" : "#FFFFFF";
  const nomeCor = dark ? "#FFFFFF" : "#0F1419";
  const handleCor = dark ? "#71767B" : "#536471";
  const corpoCor = dark ? "#E7E9EA" : "#0F1419";
  const imgBg = dark ? "#16181C" : "#F7F9F9";
  const imgBorda = dark ? "1px solid #2F3336" : "1px solid #EFF3F4";
  const avatarBg = dark ? "#2F3336" : "#E1E8ED";
  const el = (
    element_type: TemplateElementSnapshot["element_type"],
    content: string,
    styles_json: ElementStyles,
    position_x: number, position_y: number, width: number, height: number, z_index: number,
  ): TemplateElementSnapshot => ({ element_type, content, styles_json, position_x, position_y, width, height, z_index });
  return {
    format: "3:4",
    slides: [
      {
        background_type: "solid",
        background_value: bg,
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          el("image", "", { isCircle: true, borderRadius: "50%", backgroundColor: avatarBg, objectFit: "cover" }, 64, 84, 108, 108, 1),
          el("text", "Seu Nome", { fontFamily: "Archivo", fontSize: 38, color: nomeCor, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }, 196, 88, 520, 50, 2),
          el("text", "✓", { fontFamily: "Archivo", fontSize: 34, color: "#1D9BF0", fontWeight: 800 }, 406, 88, 60, 50, 3),
          el("text", "@seuhandle", { fontFamily: "Instrument Sans", fontSize: 30, color: handleCor, fontWeight: 400, lineHeight: 1.2 }, 196, 140, 520, 42, 4),
          el("text", "Escreva aqui a ideia principal.\nUma frase por linha, direto ao ponto, no seu tom.", { fontFamily: "Instrument Sans", fontSize: 44, color: corpoCor, fontWeight: 400, lineHeight: 1.4 }, 64, 250, 952, 540, 5),
          el("image", "", { borderRadius: 28, backgroundColor: imgBg, border: imgBorda, objectFit: "cover" }, 64, 840, 952, 470, 6),
          el("text", "♡      💬      ➤", { fontFamily: "Instrument Sans", fontSize: 40, color: handleCor, fontWeight: 400 }, 64, 1350, 900, 54, 7),
        ],
      },
    ],
  };
}

// helper de elemento em coords absolutas 1080×1440
const elSnap = (
  element_type: TemplateElementSnapshot["element_type"],
  content: string,
  styles_json: ElementStyles,
  position_x: number, position_y: number, width: number, height: number, z_index: number,
): TemplateElementSnapshot => ({ element_type, content, styles_json, position_x, position_y, width, height, z_index });

function tweetHeader(dark: boolean, menu = false): TemplateElementSnapshot[] {
  const nomeCor = dark ? "#FFFFFF" : "#0F1419";
  const handleCor = dark ? "#71767B" : "#536471";
  const avatarBg = dark ? "#2F3336" : "#E1E8ED";
  const arr = [
    elSnap("image", "", { isCircle: true, borderRadius: "50%", backgroundColor: avatarBg, objectFit: "cover" }, 64, 84, 108, 108, 1),
    elSnap("text", "Seu Nome", { fontFamily: "Archivo", fontSize: 38, color: nomeCor, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }, 196, 88, 520, 50, 2),
    elSnap("text", "@seuhandle", { fontFamily: "Instrument Sans", fontSize: 30, color: handleCor, fontWeight: 400, lineHeight: 1.2 }, 196, 140, 520, 42, 4),
  ];
  if (menu) arr.push(elSnap("text", "•••", { fontFamily: "Instrument Sans", fontSize: 40, color: handleCor, fontWeight: 700 }, 936, 82, 90, 44, 3));
  else arr.push(elSnap("text", "✓", { fontFamily: "Archivo", fontSize: 34, color: "#1D9BF0", fontWeight: 800 }, 406, 88, 60, 50, 3));
  return arr;
}

// Tweet gancho: pergunta/manchete forte + corpo + CTA em negrito (sem imagem)
function TWEET_GANCHO(dark: boolean): TemplateSnapshot {
  const corpoCor = dark ? "#E7E9EA" : "#0F1419";
  const forte = dark ? "#FFFFFF" : "#0F1419";
  return {
    format: "3:4",
    slides: [{
      background_type: "solid", background_value: dark ? "#000000" : "#FFFFFF",
      overlay_color: null, overlay_value: null, canvas_width: 1080, canvas_height: 1440,
      elements: [
        ...tweetHeader(dark),
        elSnap("text", "Qual pergunta forte abre o seu conteúdo?", { fontFamily: "Archivo", fontSize: 50, color: forte, fontWeight: 800, letterSpacing: -1, lineHeight: 1.12 }, 64, 260, 952, 240, 5),
        elSnap("text", "Escreva o desenvolvimento em uma ou duas frases curtas.\nUma ideia por linha, direto ao ponto, no seu tom.", { fontFamily: "Instrument Sans", fontSize: 42, color: corpoCor, fontWeight: 400, lineHeight: 1.4 }, 64, 540, 952, 520, 6),
        elSnap("text", "Clique no link da bio e se cadastre.", { fontFamily: "Archivo", fontSize: 44, color: forte, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }, 64, 1250, 952, 120, 7),
      ],
    }],
  };
}

// Tweet notícia + imagem: manchete + imagem grande (upload) + legenda + seta
function TWEET_IMAGEM(dark: boolean): TemplateSnapshot {
  const corpoCor = dark ? "#E7E9EA" : "#0F1419";
  const forte = dark ? "#FFFFFF" : "#0F1419";
  const handleCor = dark ? "#71767B" : "#536471";
  const imgBg = dark ? "#16181C" : "#F7F9F9";
  const imgBorda = dark ? "1px solid #2F3336" : "1px solid #EFF3F4";
  return {
    format: "3:4",
    slides: [{
      background_type: "solid", background_value: dark ? "#000000" : "#FFFFFF",
      overlay_color: null, overlay_value: null, canvas_width: 1080, canvas_height: 1440,
      elements: [
        ...tweetHeader(dark, true),
        elSnap("text", "Manchete forte do seu post vai aqui.", { fontFamily: "Archivo", fontSize: 46, color: forte, fontWeight: 800, letterSpacing: -1, lineHeight: 1.14 }, 64, 250, 952, 170, 5),
        elSnap("image", "", { borderRadius: 28, backgroundColor: imgBg, border: imgBorda, objectFit: "cover" }, 64, 450, 952, 560, 6),
        elSnap("text", "Uma linha de contexto com uma parte em destaque.", { fontFamily: "Instrument Sans", fontSize: 40, color: corpoCor, fontWeight: 400, lineHeight: 1.4 }, 64, 1060, 860, 200, 7),
        elSnap("text", "➜", { fontFamily: "Instrument Sans", fontSize: 60, color: handleCor, fontWeight: 400 }, 940, 1330, 90, 80, 8),
      ],
    }],
  };
}

// Converte um arquétipo escuro (petróleo/cítrico) numa versão CLARA (gelo/petróleo/eucalipto)
function toClaro(snap: TemplateSnapshot): TemplateSnapshot {
  const mapTextColor = (c?: string): string | undefined => {
    if (!c) return c;
    const low = c.toLowerCase().replace(/\s+/g, "");
    if (low === "#fafaf8") return COLORS.petroleo; // gelo -> petróleo
    if (low === "#d6f24b") return COLORS.eucalipto; // cítrico -> eucalipto (legível no claro)
    if (low.startsWith("rgba(250,250,248")) return c.replace(/250,\s*250,\s*248/, "14, 42, 46");
    if (low.startsWith("rgba(214,242,75")) return c.replace(/214,\s*242,\s*75/, "70, 101, 92");
    return c; // petróleo e demais permanecem
  };
  // no claro, o gradiente gelo→cítrico ficaria invisível: troca por petróleo→eucalipto
  const mapGrad = (g?: string): string | undefined =>
    g ? g.replace(/#FAFAF8/gi, COLORS.petroleo).replace(/#D6F24B/gi, COLORS.eucalipto) : g;
  return {
    ...snap,
    slides: snap.slides.map((s) => ({
      ...s,
      background_type: "solid",
      background_value: COLORS.gelo,
      overlay_color: null,
      overlay_value: null,
      elements: s.elements.map((e) => ({
        ...e,
        styles_json: {
          ...e.styles_json,
          color: e.element_type === "text" ? mapTextColor(e.styles_json.color) : e.styles_json.color,
          gradientText: mapGrad(e.styles_json.gradientText),
          textShadow: undefined,
        },
      })),
    })),
  };
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  // Estilo Twitter/X (escuro + claro + gancho + notícia) — PRESERVAR
  { name: "Tweet • Escuro", category: "conversa", template_json: TWEET(true), sequence_order: 1 },
  { name: "Tweet • Claro", category: "conversa", template_json: TWEET(false), sequence_order: 2 },
  { name: "Tweet • Gancho", category: "conversa", template_json: TWEET_GANCHO(true), sequence_order: 3 },
  { name: "Tweet • Notícia + Imagem", category: "conversa", template_json: TWEET_IMAGEM(true), sequence_order: 4 },

  // Arquetipos IA Club V2 1080×1440 — identidade gelo/petróleo/cítrico/eucalipto
  {
    name: "IA Club • Capa",
    category: "capa",
    sequence_order: 5,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.petroleo,
          overlay_color: "#000000",
          overlay_value: "0.4",
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "IA CLUB //", { fontFamily: "JetBrains Mono", fontSize: 32, color: COLORS.citrico, fontWeight: 700, letterSpacing: 2 }, 54, 120, 972, 50, 1),
            elSnap("text", "Inteligência estratégica sem paternidade", { fontFamily: "Archivo", fontSize: 88, color: COLORS.gelo, fontWeight: 800, letterSpacing: -1, lineHeight: 1.0, gradientText: "linear-gradient(100deg, #FAFAF8 0%, #D6F24B 60%, #FAFAF8 100%)" }, 54, 200, 972, 380, 2),
            elSnap("text", "Método IA Club • Edição V2", { fontFamily: "Instrument Sans", fontSize: 40, color: "rgba(250,250,248,0.8)", fontWeight: 400, lineHeight: 1.2 }, 54, 1260, 972, 100, 3),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • Conteúdo Denso",
    category: "conteudo",
    sequence_order: 6,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.petroleo,
          overlay_color: null,
          overlay_value: null,
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "DESENVOLVIMENTO", { fontFamily: "JetBrains Mono", fontSize: 28, color: COLORS.citrico, fontWeight: 700, letterSpacing: 1 }, 54, 80, 972, 40, 1),
            elSnap("text", "Conteúdo estruturado em blocos.\nCada frase é uma linha distinta.", { fontFamily: "Archivo", fontSize: 64, color: COLORS.gelo, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }, 54, 160, 972, 320, 2),
            elSnap("text", "Primeiro bloco de contexto.", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(250,250,248,0.9)", fontWeight: 400, lineHeight: 1.3 }, 54, 520, 972, 100, 3),
            elSnap("text", "Segundo bloco com detalhe.", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(250,250,248,0.9)", fontWeight: 400, lineHeight: 1.3 }, 54, 680, 972, 100, 4),
            elSnap("text", "Terceiro ponto de clareza.", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(250,250,248,0.9)", fontWeight: 400, lineHeight: 1.3 }, 54, 840, 972, 100, 5),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • Conteúdo Claro",
    category: "conteudo",
    sequence_order: 7,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.gelo,
          overlay_color: null,
          overlay_value: null,
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "LEITURA CLARA", { fontFamily: "JetBrains Mono", fontSize: 28, color: COLORS.petroleo, fontWeight: 700, letterSpacing: 1 }, 54, 80, 972, 40, 1),
            elSnap("text", "Conteúdo em fundo claro.\nMelhor legibilidade.", { fontFamily: "Archivo", fontSize: 64, color: COLORS.petroleo, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }, 54, 160, 972, 320, 2),
            elSnap("text", "Primeiro argumento estruturado.", { fontFamily: "Instrument Sans", fontSize: 36, color: COLORS.petroleo, fontWeight: 400, lineHeight: 1.3 }, 54, 520, 972, 100, 3),
            elSnap("text", "Segundo argumento amplificado.", { fontFamily: "Instrument Sans", fontSize: 36, color: COLORS.petroleo, fontWeight: 400, lineHeight: 1.3 }, 54, 680, 972, 100, 4),
            elSnap("text", "Terceira camada de sentido.", { fontFamily: "Instrument Sans", fontSize: 36, color: COLORS.petroleo, fontWeight: 400, lineHeight: 1.3 }, 54, 840, 972, 100, 5),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • Citação Impacto",
    category: "impacto",
    sequence_order: 8,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.petroleo,
          overlay_color: "#000000",
          overlay_value: "0.3",
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "Crescer sem ser refém é uma escolha.", { fontFamily: "Archivo", fontSize: 72, color: COLORS.gelo, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, textAlign: "center", gradientText: "linear-gradient(100deg, #FAFAF8 0%, #D6F24B 60%, #FAFAF8 100%)" }, 54, 300, 972, 480, 1),
            elSnap("text", "É método.", { fontFamily: "Archivo", fontSize: 64, color: COLORS.citrico, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.0, textAlign: "center" }, 54, 880, 972, 150, 2),
            elSnap("text", "// IA CLUB", { fontFamily: "JetBrains Mono", fontSize: 28, color: "rgba(250,250,248,0.6)", fontWeight: 500, letterSpacing: 1, textAlign: "center" }, 54, 1150, 972, 50, 3),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • Lista 4 Itens",
    category: "lista",
    sequence_order: 9,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.petroleo,
          overlay_color: null,
          overlay_value: null,
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "OS 4 PILARES", { fontFamily: "JetBrains Mono", fontSize: 28, color: COLORS.citrico, fontWeight: 700, letterSpacing: 1 }, 54, 80, 972, 40, 1),
            elSnap("text", "Método que escala sem você.", { fontFamily: "Archivo", fontSize: 60, color: COLORS.gelo, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15 }, 54, 160, 972, 200, 2),
            elSnap("text", "• Inteligência estratégica", { fontFamily: "Instrument Sans", fontSize: 44, color: COLORS.gelo, fontWeight: 400, lineHeight: 1.4 }, 54, 420, 972, 100, 3),
            elSnap("text", "• Autoridade comprovada", { fontFamily: "Instrument Sans", fontSize: 44, color: COLORS.gelo, fontWeight: 400, lineHeight: 1.4 }, 54, 580, 972, 100, 4),
            elSnap("text", "• Conhecimento único", { fontFamily: "Instrument Sans", fontSize: 44, color: COLORS.gelo, fontWeight: 400, lineHeight: 1.4 }, 54, 740, 972, 100, 5),
            elSnap("text", "• Liderança escalável", { fontFamily: "Instrument Sans", fontSize: 44, color: COLORS.gelo, fontWeight: 400, lineHeight: 1.4 }, 54, 900, 972, 100, 6),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • Comparativo Antes-Depois",
    category: "lista",
    sequence_order: 10,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.petroleo,
          overlay_color: null,
          overlay_value: null,
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "A TRANSFORMAÇÃO", { fontFamily: "JetBrains Mono", fontSize: 28, color: COLORS.citrico, fontWeight: 700, letterSpacing: 1 }, 54, 80, 972, 40, 1),
            elSnap("text", "ANTES", { fontFamily: "Archivo", fontSize: 48, color: COLORS.gelo, fontWeight: 800, letterSpacing: -1 }, 54, 160, 450, 80, 2),
            elSnap("text", "Você é o gargalo", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(250,250,248,0.8)", fontWeight: 400, lineHeight: 1.3 }, 54, 280, 450, 60, 3),
            elSnap("text", "Sem você nada acontece", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(250,250,248,0.8)", fontWeight: 400, lineHeight: 1.3 }, 54, 380, 450, 80, 4),
            elSnap("text", "Crescer = cansaço", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(250,250,248,0.8)", fontWeight: 400, lineHeight: 1.3 }, 54, 500, 450, 80, 5),
            elSnap("text", "DEPOIS", { fontFamily: "Archivo", fontSize: 48, color: COLORS.citrico, fontWeight: 800, letterSpacing: -1 }, 576, 160, 450, 80, 6),
            elSnap("text", "Sistema que roda sozinho", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(214,242,75,0.9)", fontWeight: 400, lineHeight: 1.3 }, 576, 280, 450, 80, 7),
            elSnap("text", "Delegação natural", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(214,242,75,0.9)", fontWeight: 400, lineHeight: 1.3 }, 576, 400, 450, 60, 8),
            elSnap("text", "Crescer = liberdade", { fontFamily: "Instrument Sans", fontSize: 36, color: "rgba(214,242,75,0.9)", fontWeight: 400, lineHeight: 1.3 }, 576, 500, 450, 80, 9),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • Número Grande",
    category: "impacto",
    sequence_order: 11,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.citrico,
          overlay_color: null,
          overlay_value: null,
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "540%", { fontFamily: "Archivo", fontSize: 200, color: COLORS.petroleo, fontWeight: 800, letterSpacing: -2, lineHeight: 0.9, textAlign: "center", gradientText: "linear-gradient(105deg, #0E2A2E 0%, #46655C 55%, #0E2A2E 100%)" }, 54, 240, 972, 380, 1),
            elSnap("text", "Aumento de receita sem aumentar horas trabalhadas.", { fontFamily: "Instrument Sans", fontSize: 40, color: COLORS.petroleo, fontWeight: 400, lineHeight: 1.4, textAlign: "center" }, 54, 700, 972, 200, 2),
            elSnap("text", "Resultado médio método IA Club.", { fontFamily: "JetBrains Mono", fontSize: 28, color: COLORS.petroleo, fontWeight: 500, letterSpacing: 1, textAlign: "center" }, 54, 1080, 972, 60, 3),
          ],
        },
      ],
    },
  },
  {
    name: "IA Club • CTA Final",
    category: "cta",
    sequence_order: 12,
    template_json: {
      format: "3:4",
      slides: [
        {
          background_type: "solid",
          background_value: COLORS.citrico,
          overlay_color: null,
          overlay_value: null,
          canvas_width: 1080,
          canvas_height: 1440,
          elements: [
            elSnap("text", "Pronto para virar CEO?", { fontFamily: "Archivo", fontSize: 72, color: COLORS.petroleo, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, textAlign: "center", gradientText: "linear-gradient(105deg, #0E2A2E 0%, #46655C 55%, #0E2A2E 100%)" }, 54, 200, 972, 300, 1),
            elSnap("text", "Comenta MÉTODO\ne receba o guia de transformação.", { fontFamily: "Instrument Sans", fontSize: 44, color: COLORS.petroleo, fontWeight: 400, lineHeight: 1.3, textAlign: "center" }, 54, 560, 972, 260, 2),
            elSnap("text", "@iaclubcomunidade", { fontFamily: "JetBrains Mono", fontSize: 36, color: COLORS.petroleo, fontWeight: 700, letterSpacing: 1, textAlign: "center" }, 54, 1200, 972, 80, 3),
          ],
        },
      ],
    },
  },
];

// Variantes CLARAS (fundo gelo) dos arquétipos escuros — geradas a partir dos escuros
const _CLARO_DE = [
  "IA Club • Capa",
  "IA Club • Citação Impacto",
  "IA Club • Lista 4 Itens",
  "IA Club • Comparativo Antes-Depois",
  "IA Club • Número Grande",
];
let _soClaro = 13;
for (const nome of _CLARO_DE) {
  const base = SEED_TEMPLATES.find((t) => t.name === nome);
  if (base) {
    SEED_TEMPLATES.push({
      name: `${nome} (Claro)`,
      category: base.category,
      template_json: toClaro(base.template_json),
      sequence_order: _soClaro++,
    });
  }
}

// ─── 2º passe de refino: fundo com gradiente sutil + barra-assinatura no rodapé ───
function refinar(snap: TemplateSnapshot): TemplateSnapshot {
  return {
    ...snap,
    slides: snap.slides.map((s) => {
      const v = (s.background_value || "").toUpperCase();
      let bgGrad = s.background_value;
      let barra = COLORS.citrico; // acento no rodapé
      if (v.includes("0E2A2E") || v.includes("0A1315")) {
        bgGrad = "linear-gradient(157deg, #123A3F 0%, #0E2A2E 52%, #071417 100%)"; // petróleo com profundidade
        barra = COLORS.citrico;
      } else if (v.includes("D6F24B")) {
        bgGrad = "linear-gradient(157deg, #E4FA6E 0%, #D6F24B 55%, #C2E03F 100%)"; // cítrico
        barra = COLORS.petroleo;
      } else if (v.includes("FAFAF8") || v.includes("FFFFFF")) {
        bgGrad = "linear-gradient(157deg, #FFFFFF 0%, #FAFAF8 60%, #EFEFE9 100%)"; // gelo
        barra = COLORS.eucalipto;
      } else {
        return s; // fundos fora da paleta (ex.: Tweet) não mudam
      }
      const jaTem = s.elements.some((e) => e.styles_json?.background === barra && e.height === 8);
      const elements = jaTem
        ? s.elements
        : [
            ...s.elements,
            elSnap("box", "", { background: barra, borderRadius: 0 }, 54, 1400, 160, 8, 99),
          ];
      return { ...s, background_type: "gradient" as const, background_value: bgGrad, elements };
    }),
  };
}
// aplica o refino a TODOS os arquétipos IA Club (base + claro); Tweets ficam intactos
for (const t of SEED_TEMPLATES) {
  if (t.name.startsWith("IA Club")) t.template_json = refinar(t.template_json);
}

export function getSeedTemplates(): SeedTemplate[] {
  return SEED_TEMPLATES;
}
