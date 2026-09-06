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

  // ─── 16 NOVOS TEMPLATES: 10 Macro + 6 Editoriais ───
  // 10 MACRO STYLES (1080×1440)
  {
    name: "Glassmorphism",
    category: "estilo",
    sequence_order: 40,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "gradient",
        background_value: "radial-gradient(circle at 14% 16%,#ffcb54 0 10%,transparent 31%),radial-gradient(circle at 91% 82%,#aa87ff 0 11%,transparent 35%),linear-gradient(135deg,#fff2df,#e8e3ff 55%,#d9f3ee)",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "rgba(255,255,255,.44)", border: "1px solid rgba(255,255,255,.8)", borderRadius: 28, boxShadow: "0 18px 45px #5b4a7c24", backdropFilter: "blur(16px)" }, 150, 300, 780, 800, 1),
          elSnap("box", "", { background: "#e46548", borderRadius: "50%" }, 450, 330, 180, 180, 2),
          elSnap("text", "01 · glassmorphism", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "rgba(0,0,0,.67)", fontWeight: 500, letterSpacing: 1.1, textTransform: "uppercase" }, 180, 220, 720, 35, 3),
          elSnap("text", "Ideias fortes precisam de espaço para respirar.", { fontFamily: "Sora", fontSize: 115, color: "#151515", fontWeight: 800, letterSpacing: -1.6, lineHeight: 0.93 }, 180, 600, 720, 360, 4),
          elSnap("text", "Análise com aparência premium, camadas de vidro e cor ambiente.", { fontFamily: "Instrument Sans", fontSize: 38, color: "#151515", fontWeight: 400, lineHeight: 1.48 }, 180, 1040, 720, 80, 5),
          elSnap("text", "01 / 08", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "rgba(0,0,0,.66)", fontWeight: 500 }, 900, 1350, 180, 50, 6),
        ],
      }],
    },
  },
  {
    name: "Ticket",
    category: "estilo",
    sequence_order: 41,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#111",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "#ffbe4f" }, 50, 50, 980, 1340, 1),
          elSnap("box", "", { background: "#111", borderRadius: "50%" }, 70, 260, 85, 85, 2),
          elSnap("box", "", { background: "#111", borderRadius: "50%" }, 925, 940, 85, 85, 3),
          elSnap("text", "02 · ticket zero to UI", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "rgba(0,0,0,.67)", fontWeight: 500, letterSpacing: 1.1, textTransform: "uppercase" }, 100, 90, 880, 35, 4),
          elSnap("text", "5 erros que fazem seu conteúdo sumir.", { fontFamily: "Fraunces", fontSize: 145, color: "#171313", fontWeight: 800, letterSpacing: -1.6, lineHeight: 0.88 }, 100, 180, 880, 360, 5),
          elSnap("text", "Formato forte para lista, princípio e dica prática.", { fontFamily: "Source Serif 4", fontSize: 44, color: "#171313", fontWeight: 400, lineHeight: 1.45 }, 100, 580, 880, 100, 6),
          elSnap("text", "GUIA PARA SALVAR · 02/08", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "#171313", fontWeight: 600, letterSpacing: 2.7, textAlign: "center", borderTop: "1px dashed #252020" }, 100, 1220, 880, 50, 7),
        ],
      }],
    },
  },
  {
    name: "Editorial Magazine",
    category: "estilo",
    sequence_order: 42,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#f7f1e8",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("text", "Relatório editorial · 2026", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "rgba(0,0,0,.67)", fontWeight: 500, letterSpacing: 1.1, textTransform: "uppercase" }, 60, 60, 960, 35, 1),
          elSnap("box", "", { background: "#171717", borderRadius: 0 }, 60, 130, 960, 3, 2),
          elSnap("text", "O QUE A SUA MARCA ESTÁ DEIXANDO DE DIZER?", { fontFamily: "Anton", fontSize: 160, color: "#171717", fontWeight: 400, letterSpacing: -0.65, textTransform: "uppercase", lineHeight: 0.8 }, 60, 180, 960, 320, 3),
          elSnap("text", "Um ponto de vista bem escrito vale mais do que publicar por obrigação.", { fontFamily: "Spectral", fontSize: 44, color: "#171717", fontWeight: 600, lineHeight: 1.45 }, 60, 540, 960, 120, 4),
          elSnap("box", "", { background: "#ef5d35" }, 60, 1120, 600, 240, 5),
          elSnap("text", "LEITURA DE MARCA\n03 / 08", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "#fff", fontWeight: 700, lineHeight: 1.2, textAlign: "center" }, 70, 1150, 580, 180, 6),
        ],
      }],
    },
  },
  {
    name: "Swiss Grid",
    category: "estilo",
    sequence_order: 43,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "gradient",
        background_value: "linear-gradient(#ddd 1px,transparent 1px),linear-gradient(90deg,#ddd 1px,transparent 1px)",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("text", "04 / SISTEMA DE CONTEÚDO", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "#d72020", fontWeight: 600, letterSpacing: 1.1, textTransform: "uppercase" }, 65, 220, 950, 35, 1),
          elSnap("text", "PARE DE CRIAR POST SEM UMA IDEIA CENTRAL.", { fontFamily: "Inter Tight", fontSize: 135, color: "#1c1840", fontWeight: 900, letterSpacing: -2.7, lineHeight: 0.86 }, 65, 300, 950, 320, 2),
          elSnap("text", "Grid visível, pouca cor e argumento muito claro.", { fontFamily: "Inter", fontSize: 44, color: "#1c1840", fontWeight: 600, lineHeight: 1.48 }, 65, 660, 950, 100, 3),
          elSnap("box", "", { background: "#e42020" }, 900, 1100, 190, 190, 4),
          elSnap("text", "04", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "#1c1840", fontWeight: 500, textAlign: "right" }, 65, 1340, 950, 50, 5),
        ],
      }],
    },
  },
  {
    name: "Brutalism",
    category: "estilo",
    sequence_order: 44,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#d7ff27",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "#d7ff27", border: "13px solid #141414", boxShadow: "21px 21px 0 #141414" }, 0, 0, 1080, 1440, 0),
          elSnap("text", "OPINIÃO DIRETA", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "#000", fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase" }, 70, 70, 940, 35, 1),
          elSnap("box", "", { background: "#141414", padding: "13px 0" }, 70, 130, 940, 35, 2),
          elSnap("text", "CONTEÚDO BONITO NÃO VENDE SOZINHO.", { fontFamily: "Anton", fontSize: 160, color: "#fff", fontWeight: 400, letterSpacing: 0, textTransform: "uppercase", lineHeight: 0.86, textAlign: "center" }, 70, 200, 940, 380, 3),
          elSnap("text", "O leitor precisa entender o que você quer que ele faça depois de parar o scroll.", { fontFamily: "IBM Plex Mono", fontSize: 36, color: "#141414", fontWeight: 600, lineHeight: 1.55 }, 70, 640, 940, 200, 4),
          elSnap("box", "", { background: "#ed3c8c", border: "8px solid #141414", boxShadow: "13px 13px 0 #141414" }, 880, 1180, 100, 100, 5),
          elSnap("text", "LEIA ISSO\nAGORA", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "#fff", fontWeight: 600, textAlign: "center", lineHeight: 1 }, 890, 1200, 80, 60, 6),
        ],
      }],
    },
  },
  {
    name: "Claymorphism",
    category: "estilo",
    sequence_order: 45,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#d9cfec",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "#f1ebfb", borderRadius: "50%", boxShadow: "inset 11px 11px 22px #ffffffa8, 35px 41px 59px #645d752e" }, 820, 140, 290, 290, 1),
          elSnap("box", "", { background: "#f1ebfb", borderRadius: "50%", boxShadow: "inset 11px 11px 22px #ffffffa8, 35px 41px 59px #645d752e" }, 620, 330, 160, 160, 2),
          elSnap("text", "06 · bem-vinda", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "rgba(0,0,0,.67)", fontWeight: 500, letterSpacing: 1.1, textTransform: "uppercase" }, 75, 220, 810, 35, 3),
          elSnap("text", "IA pode parecer mais leve.", { fontFamily: "Sora", fontSize: 120, color: "#171717", fontWeight: 800, letterSpacing: -2.7, lineHeight: 0.94 }, 75, 400, 810, 340, 4),
          elSnap("text", "A cara certa para explicar algo novo sem assustar quem está começando.", { fontFamily: "Instrument Sans", fontSize: 38, color: "#171717", fontWeight: 600, lineHeight: 1.48 }, 75, 840, 810, 150, 5),
          elSnap("text", "06 / 08", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "rgba(0,0,0,.66)", fontWeight: 500 }, 900, 1350, 180, 50, 6),
        ],
      }],
    },
  },
  {
    name: "Neo-newspaper",
    category: "estilo",
    sequence_order: 46,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#f5f0e8",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "radial-gradient(#0000000f .7px,transparent .7px)" }, 0, 0, 1080, 1440, 0),
          elSnap("box", "", { borderTop: "5px solid #151515", borderBottom: "3px solid #151515" }, 60, 60, 960, 35, 1),
          elSnap("text", "AGORA · MERCADO & TENDÊNCIAS", { fontFamily: "IBM Plex Mono", fontSize: 25, color: "#be2b22", fontWeight: 400, letterSpacing: 1.08, textTransform: "uppercase" }, 60, 68, 960, 18, 2),
          elSnap("text", "A notícia importa. A sua leitura é o que diferencia o post.", { fontFamily: "Playfair Display", fontSize: 120, color: "#151515", fontWeight: 900, letterSpacing: -1.4, lineHeight: 0.91 }, 60, 150, 960, 380, 3),
          elSnap("text", "Use dados, recortes e fontes.\nDepois dê ao público um ângulo que ajude a interpretar.", { fontFamily: "Lato", fontSize: 36, color: "#151515", fontWeight: 400, lineHeight: 1.45 }, 60, 580, 960, 200, 4),
          elSnap("text", "07/08", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "rgba(0,0,0,.66)", fontWeight: 500 }, 60, 1350, 180, 50, 5),
        ],
      }],
    },
  },
  {
    name: "Sticker",
    category: "estilo",
    sequence_order: 47,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "gradient",
        background_value: "radial-gradient(#ffffff35 1px,transparent 1px)",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "#a6de60", border: "16px solid white", borderRadius: "48% 52% 57% 43% / 45% 45% 55% 55%", boxShadow: "19px 19px 0 #1b1b1b", transform: "rotate(-10deg)" }, 790, 70, 450, 410, 1),
          elSnap("text", "08 · salvar pra depois", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "rgba(255,255,255,.67)", fontWeight: 500, letterSpacing: 1.1, textTransform: "uppercase" }, 65, 210, 720, 35, 2),
          elSnap("text", "POSTAR TODO DIA NÃO É ESTRATÉGIA.", { fontFamily: "Sora", fontSize: 130, color: "#fff", fontWeight: 800, letterSpacing: -2.7, lineHeight: 0.86, textShadow: "8px 8px 0 #1b1b1b" }, 65, 480, 720, 380, 3),
          elSnap("box", "", { background: "#fff", border: "11px solid #fff", boxShadow: "13px 13px 0 #1b1b1b", padding: "27px" }, 65, 960, 720, 80, 4),
          elSnap("text", "Frequência sem direção vira só mais uma tarefa na agenda.", { fontFamily: "Instrument Sans", fontSize: 36, color: "#211711", fontWeight: 800, textAlign: "center" }, 85, 975, 680, 50, 5),
          elSnap("text", "08 / 08", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "rgba(255,255,255,.66)", fontWeight: 500 }, 900, 1350, 180, 50, 6),
        ],
      }],
    },
  },
  {
    name: "Terminal",
    category: "estilo",
    sequence_order: 48,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#0b0e0d",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "repeating-linear-gradient(0deg,transparent 0 68px,#5ce677 71px 73px)", opacity: 0.18 }, 0, 0, 1080, 1440, 0),
          elSnap("text", "$ agente.conteudo --modo pesquisa", { fontFamily: "IBM Plex Mono", fontSize: 27, color: "#ffbe4c", fontWeight: 400, letterSpacing: 2.7 }, 65, 85, 950, 35, 1),
          elSnap("text", "O seu agente não deve só escrever.", { fontFamily: "IBM Plex Mono", fontSize: 100, color: "#74ff9d", fontWeight: 600, letterSpacing: -1.6, lineHeight: 1.05 }, 65, 220, 950, 340, 2),
          elSnap("text", "Ele pesquisa, registra fontes, sugere imagens e deixa o carrossel pronto para renderizar.", { fontFamily: "IBM Plex Mono", fontSize: 36, color: "#c5ffd5", fontWeight: 400, lineHeight: 1.65 }, 65, 620, 950, 280, 3),
          elSnap("box", "", { background: "#74ff9d", borderRadius: 0 }, 1050, 900, 14, 11, 4),
          elSnap("text", "status: pronto", { fontFamily: "IBM Plex Mono", fontSize: 30, color: "rgba(255,255,255,.66)", fontWeight: 500 }, 65, 1350, 950, 50, 5),
        ],
      }],
    },
  },
  {
    name: "Flat Colorido",
    category: "estilo",
    sequence_order: 49,
    template_json: {
      format: "3:4",
      slides: [{
        background_type: "solid",
        background_value: "#7652df",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1440,
        elements: [
          elSnap("box", "", { background: "#fff8e7", borderRadius: 82 }, 60, 60, 960, 1320, 1),
          elSnap("text", "10 · novidade", { fontFamily: "Sora", fontSize: 27, color: "#7652df", fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }, 90, 100, 900, 35, 2),
          elSnap("text", "O seu próximo lançamento merece cor.", { fontFamily: "Sora", fontSize: 135, color: "#1c1840", fontWeight: 800, letterSpacing: -2.7, lineHeight: 0.88 }, 90, 200, 900, 360, 3),
          elSnap("text", "Uma estrutura simples, chamativa e muito fácil de adaptar para evento, agenda ou campanha.", { fontFamily: "Instrument Sans", fontSize: 38, color: "#1c1840", fontWeight: 600, lineHeight: 1.48 }, 90, 620, 900, 200, 4),
          elSnap("box", "", { background: "#ff8f5a", borderRadius: "50%" }, 800, 1020, 200, 200, 5),
        ],
      }],
    },
  },

  // 6 EDITORIAL STYLES (1080×1350)
  {
    name: "Dark Thread",
    category: "editorial",
    sequence_order: 50,
    template_json: {
      format: "4:5",
      slides: [{
        background_type: "solid",
        background_value: "#090909",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1350,
        elements: [
          elSnap("image", "", { isCircle: true, borderRadius: "50%", backgroundColor: "linear-gradient(145deg,#8e7562 0 35%,#201d1d 36% 62%,#b6b6b5 63%)", objectFit: "cover" }, 95, 95, 100, 100, 1),
          elSnap("text", "Seu Nome", { fontFamily: "Manrope", fontSize: 40, color: "#f8f8f6", fontWeight: 700, lineHeight: 1.1 }, 210, 100, 800, 40, 2),
          elSnap("text", "@seuperfil", { fontFamily: "Manrope", fontSize: 33, color: "#a7a7a7", fontWeight: 400, lineHeight: 1.2 }, 210, 145, 800, 30, 3),
          elSnap("text", "Qual processo da sua empresa existe só porque um dia foi impossível fazer diferente?", { fontFamily: "Manrope", fontSize: 57, color: "#f8f8f6", fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.12 }, 95, 270, 890, 280, 4),
          elSnap("text", "Nem tudo que está ruim precisa ser consertado. Às vezes, o problema é que a empresa ainda opera seguindo uma regra que já morreu.", { fontFamily: "DM Sans", fontSize: 42, color: "#ececeb", fontWeight: 400, lineHeight: 1.45 }, 95, 600, 890, 200, 5),
          elSnap("text", "O que antes era uma limitação pode ter virado o seu maior atraso.", { fontFamily: "DM Sans", fontSize: 42, color: "#fff", fontWeight: 600, lineHeight: 1.45 }, 95, 820, 890, 120, 6),
          elSnap("text", "LEIA ATÉ O FIM · 01/07", { fontFamily: "DM Mono", fontSize: 27, color: "#a8a8a8", fontWeight: 400, letterSpacing: 2.2 }, 95, 1250, 890, 40, 7),
          elSnap("text", "↘", { fontFamily: "Arial", fontSize: 95, color: "#f8f8f6", fontWeight: 400 }, 950, 1220, 110, 120, 8),
        ],
      }],
    },
  },
  {
    name: "Case Study",
    category: "editorial",
    sequence_order: 51,
    template_json: {
      format: "4:5",
      slides: [{
        background_type: "solid",
        background_value: "#eae6df",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1350,
        elements: [
          elSnap("box", "", { borderBottom: "3px solid #242424", padding: "32px 0" }, 65, 55, 950, 35, 1),
          elSnap("text", "Case study / 01", { fontFamily: "DM Mono", fontSize: 27, color: "#1a1a1a", fontWeight: 500, letterSpacing: 1.6 }, 65, 58, 450, 27, 2),
          elSnap("text", "1899—1913", { fontFamily: "DM Mono", fontSize: 27, color: "#1a1a1a", fontWeight: 500, letterSpacing: 1.6 }, 850, 58, 185, 27, 3),
          elSnap("text", "A inovação chegou. O resultado ainda não.", { fontFamily: "Playfair Display", fontSize: 110, color: "#1a1a1a", fontWeight: 800, letterSpacing: -1.2, lineHeight: 0.91 }, 65, 140, 950, 280, 4),
          elSnap("box", "", { background: "linear-gradient(120deg,#423c36,#c4b9a9 37%,#605348 38% 42%,#bdb3a7 43% 55%,#262525 56%)" }, 65, 470, 950, 340, 5),
          elSnap("text", "1882", { fontFamily: "DM Mono", fontSize: 30, color: "#1a1a1a", fontWeight: 500 }, 95, 850, 120, 25, 6),
          elSnap("text", "A tecnologia muda.\nA operação continua organizada pela limitação antiga.", { fontFamily: "DM Sans", fontSize: 33, color: "#1a1a1a", fontWeight: 400, lineHeight: 1.35 }, 240, 850, 750, 85, 7),
          elSnap("text", "1913", { fontFamily: "DM Mono", fontSize: 30, color: "#1a1a1a", fontWeight: 500 }, 95, 1000, 120, 25, 8),
          elSnap("text", "O desenho do trabalho muda.\nÉ aí que a produtividade finalmente aparece.", { fontFamily: "DM Sans", fontSize: 33, color: "#1a1a1a", fontWeight: 400, lineHeight: 1.35 }, 240, 1000, 750, 85, 9),
          elSnap("text", "FONTE: inserir fonte histórica e licença", { fontFamily: "DM Mono", fontSize: 25, color: "#5c574f", fontWeight: 400, letterSpacing: 0.4 }, 95, 1270, 890, 30, 10),
        ],
      }],
    },
  },
  {
    name: "Newsroom Evidence",
    category: "editorial",
    sequence_order: 52,
    template_json: {
      format: "4:5",
      slides: [{
        background_type: "solid",
        background_value: "#faf9f6",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1350,
        elements: [
          elSnap("box", "", { borderBottom: "11px solid #181818" }, 60, 60, 960, 27, 1),
          elSnap("text", "NEWSROOM / EVIDÊNCIA", { fontFamily: "DM Mono", fontSize: 27, color: "#151515", fontWeight: 500, letterSpacing: 2.2 }, 60, 62, 650, 23, 2),
          elSnap("text", "03.2026", { fontFamily: "DM Mono", fontSize: 27, color: "#151515", fontWeight: 500, letterSpacing: 2.2 }, 900, 62, 120, 23, 3),
          elSnap("text", "A notícia é só o começo da conversa.", { fontFamily: "Manrope", fontSize: 85, color: "#151515", fontWeight: 800, letterSpacing: -2.2, lineHeight: 0.94 }, 60, 130, 960, 240, 4),
          elSnap("box", "", { border: "3px solid #b7b4ae", background: "#fff", padding: "35px" }, 60, 420, 960, 240, 5),
          elSnap("box", "", { background: "#dd503d", borderRadius: "50%" }, 85, 450, 30, 30, 6),
          elSnap("text", "VEÍCULO / FONTE VERIFICADA", { fontFamily: "DM Sans", fontSize: 28, color: "#151515", fontWeight: 700, letterSpacing: 0.4 }, 135, 453, 850, 23, 7),
          elSnap("text", "Empresa anuncia mudança que afeta o mercado inteiro.", { fontFamily: "Manrope", fontSize: 42, color: "#151515", fontWeight: 800, lineHeight: 1.1 }, 85, 520, 900, 80, 8),
          elSnap("box", "", { background: "repeating-linear-gradient(#bebbb5 0 5px,transparent 5px 24px)", opacity: 0.72 }, 85, 640, 900, 110, 9),
          elSnap("text", "O post não precisa repetir a manchete. Ele precisa explicar o que essa mudança significa para quem está lendo.", { fontFamily: "DM Serif Display", fontSize: 36, color: "#151515", fontWeight: 500, fontStyle: "italic", lineHeight: 1.42 }, 60, 840, 960, 160, 10),
          elSnap("text", "URL DA FONTE · AUTOR · DATA", { fontFamily: "DM Mono", fontSize: 25, color: "#777", fontWeight: 400, letterSpacing: 0.4 }, 60, 1270, 960, 30, 11),
        ],
      }],
    },
  },
  {
    name: "Photo-led Premium",
    category: "editorial",
    sequence_order: 53,
    template_json: {
      format: "4:5",
      slides: [{
        background_type: "solid",
        background_value: "#080808",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1350,
        elements: [
          elSnap("image", "", { isCircle: true, borderRadius: "50%", backgroundColor: "linear-gradient(145deg,#8e7562 0 35%,#201d1d 36% 62%,#b6b6b5 63%)", objectFit: "cover" }, 95, 55, 85, 85, 1),
          elSnap("text", "Seu Nome\n@seuperfil", { fontFamily: "Manrope", fontSize: 33, color: "#fff", fontWeight: 400, lineHeight: 1.4 }, 195, 62, 800, 70, 2),
          elSnap("text", "•••", { fontFamily: "Manrope", fontSize: 80, color: "#888", fontWeight: 800 }, 950, 55, 100, 85, 3),
          elSnap("text", "O melhor produto não vende só uma vez. Ele vira hábito.", { fontFamily: "Manrope", fontSize: 75, color: "#fff", fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.02 }, 95, 200, 890, 200, 4),
          elSnap("box", "", { background: "radial-gradient(ellipse at 48% 62%,#e8a15a 0 12%,#4c271a 13% 25%,transparent 26%),radial-gradient(ellipse at 51% 47%,#a75a37 0 7%,transparent 8%),linear-gradient(118deg,#462316 10%,#9a4c28 42%,#251412 75%)", borderRadius: 65 }, 95, 450, 890, 480, 5),
          elSnap("text", "Uma imagem grande segura o olhar. A análise curta dá ao leitor um motivo para deslizar.", { fontFamily: "DM Sans", fontSize: 38, color: "#e5e5e5", fontWeight: 400, lineHeight: 1.42 }, 95, 995, 890, 180, 6),
        ],
      }],
    },
  },
  {
    name: "Insight Minimal",
    category: "editorial",
    sequence_order: 54,
    template_json: {
      format: "4:5",
      slides: [{
        background_type: "solid",
        background_value: "#fff",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1350,
        elements: [
          elSnap("box", "", { background: "#151515", borderRadius: 0 }, 65, 55, 950, 3, 1),
          elSnap("text", "INSIGHT / 05", { fontFamily: "DM Mono", fontSize: 27, color: "#151515", fontWeight: 500, letterSpacing: 2.2, textTransform: "uppercase" }, 65, 85, 950, 27, 2),
          elSnap("text", "Você não precisa de mais ideias.", { fontFamily: "Manrope", fontSize: 130, color: "#151515", fontWeight: 800, letterSpacing: -2.7, lineHeight: 0.89 }, 65, 180, 950, 340, 3),
          elSnap("text", "Precisa decidir", { fontFamily: "DM Serif Display", fontSize: 110, color: "#151515", fontWeight: 400, fontStyle: "italic", letterSpacing: -1.5, lineHeight: 1 }, 65, 530, 950, 140, 4),
          elSnap("text", "qual delas merece estrutura.", { fontFamily: "Manrope", fontSize: 110, color: "#151515", fontWeight: 400, letterSpacing: -1.5, lineHeight: 1 }, 65, 650, 950, 140, 5),
          elSnap("text", "Uma ideia clara por slide. Espaço para a pessoa parar, pensar e compartilhar.", { fontFamily: "DM Mono", fontSize: 30, color: "#151515", fontWeight: 500, letterSpacing: 2.2 }, 65, 1220, 650, 80, 6),
          elSnap("box", "", { background: "#fff", border: "3px solid #181818", borderRadius: "50%" }, 900, 1200, 130, 130, 7),
          elSnap("text", "05", { fontFamily: "DM Mono", fontSize: 30, color: "#151515", fontWeight: 500, textAlign: "center" }, 920, 1245, 90, 40, 8),
        ],
      }],
    },
  },
  {
    name: "Social Proof",
    category: "editorial",
    sequence_order: 55,
    template_json: {
      format: "4:5",
      slides: [{
        background_type: "solid",
        background_value: "#f3ebe3",
        overlay_color: null,
        overlay_value: null,
        canvas_width: 1080,
        canvas_height: 1350,
        elements: [
          elSnap("box", "", { borderBottom: "3px solid #c9beb5", padding: "35px 0" }, 65, 55, 950, 27, 1),
          elSnap("text", "RESULTADOS REAIS", { fontFamily: "DM Mono", fontSize: 27, color: "#241a18", fontWeight: 500, letterSpacing: 2.2 }, 65, 58, 650, 23, 2),
          elSnap("text", "06/07", { fontFamily: "DM Mono", fontSize: 27, color: "#241a18", fontWeight: 500, letterSpacing: 2.2 }, 900, 58, 115, 23, 3),
          elSnap("text", "Quando o processo funciona, a prova aparece sem esforço.", { fontFamily: "Manrope", fontSize: 90, color: "#241a18", fontWeight: 800, letterSpacing: -1.75, lineHeight: 0.93 }, 65, 140, 950, 240, 4),
          elSnap("box", "", { background: "#fff", borderRadius: "11px", boxShadow: "0 5px 0 #ded5ce", padding: "35px" }, 95, 440, 890, 65, 5),
          elSnap("text", "\"Organizei o comercial e pela primeira vez sei o que entra no próximo mês.\"", { fontFamily: "DM Sans", fontSize: 33, color: "#000", fontWeight: 500, lineHeight: 1.35 }, 110, 455, 860, 35, 6),
          elSnap("box", "", { background: "#e5b5c1", borderRadius: "11px", boxShadow: "0 5px 0 #ded5ce", padding: "35px" }, 95, 540, 890, 65, 7),
          elSnap("text", "\"A equipe começou a resolver antes de me chamar.\"", { fontFamily: "DM Sans", fontSize: 33, color: "#000", fontWeight: 500, lineHeight: 1.35, textAlign: "right" }, 110, 555, 860, 35, 8),
          elSnap("text", "+40%", { fontFamily: "Manrope", fontSize: 130, color: "#241a18", fontWeight: 800, letterSpacing: -2.7, lineHeight: 0.8 }, 95, 670, 300, 200, 9),
          elSnap("text", "crescimento médio com\ncontexto e fonte.", { fontFamily: "DM Mono", fontSize: 27, color: "#241a18", fontWeight: 500, letterSpacing: 2.2 }, 420, 700, 450, 140, 10),
          elSnap("box", "", { background: "#241a18" }, 900, 1230, 180, 80, 11),
          elSnap("text", "VER COMO\nACONTECEU →", { fontFamily: "DM Mono", fontSize: 27, color: "#fff", fontWeight: 500, letterSpacing: 2.2, textAlign: "center", lineHeight: 1.2 }, 920, 1250, 140, 40, 12),
        ],
      }],
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
