// Brand Kit — camada MARCA do design system.
// Resolve os tokens visuais de uma conta a partir do brain.design, com
// fallback nos padrões IA Club V2. Templates e o render consomem esses tokens;
// applyBrandKit re-tinge um projeto para a identidade da marca ativa.
import { loadBrain } from "@/lib/brain";
import type { ProjectData } from "./types";

export interface BrandKit {
  cores: { fundo: string; tinta: string; acento: string; apoio: string; gradiente: [string, string] };
  fontes: { titulo: string; corpo: string; mono: string };
  logo_url: string;
  avatar_url: string;
  handle: string;
  tom_visual: string;
  regras_foto: string[];
}

// Identidade IA Club V2 (default quando o brain não tem design preenchido).
export const IACLUB_V2: BrandKit = {
  cores: {
    fundo: "#FAFAF8", // gelo
    tinta: "#0E2A2E", // petróleo
    acento: "#D6F24B", // cítrico
    apoio: "#46655C", // eucalipto
    gradiente: ["#0E2A2E", "#46655C"],
  },
  fontes: {
    titulo: "Archivo",
    corpo: "Instrument Sans",
    mono: "JetBrains Mono",
  },
  logo_url: "",
  avatar_url: "",
  handle: "@iaclub",
  tom_visual: "editorial e respirado, contraste alto, nada de stock óbvio",
  regras_foto: [
    "preferir imagem real/documental a ilustração genérica",
    "rosto ou cena concreta > banco de imagem abstrato",
    "luz natural, enquadramento limpo, espaço para texto",
    "sempre creditar autor/licença ao salvar",
  ],
};

function merge(base: BrandKit, d?: NonNullable<Parameters<typeof Object>[0]>): BrandKit {
  const des = (d || {}) as any;
  return {
    cores: {
      fundo: des?.cores?.fundo || base.cores.fundo,
      tinta: des?.cores?.tinta || base.cores.tinta,
      acento: des?.cores?.acento || base.cores.acento,
      apoio: des?.cores?.apoio || base.cores.apoio,
      gradiente: Array.isArray(des?.cores?.gradiente) && des.cores.gradiente.length === 2 ? des.cores.gradiente : base.cores.gradiente,
    },
    fontes: {
      titulo: des?.fontes?.titulo || base.fontes.titulo,
      corpo: des?.fontes?.corpo || base.fontes.corpo,
      mono: des?.fontes?.mono || base.fontes.mono,
    },
    logo_url: des?.logo_url || base.logo_url,
    avatar_url: des?.avatar_url || base.avatar_url,
    handle: des?.handle || base.handle,
    tom_visual: des?.tom_visual || base.tom_visual,
    regras_foto: Array.isArray(des?.regras_foto) && des.regras_foto.length ? des.regras_foto : base.regras_foto,
  };
}

// Resolve o Brand Kit da conta (design do brain sobre o default IA Club V2).
export async function resolveBrandKit(accountId: string): Promise<BrandKit> {
  try {
    const brain = await loadBrain(accountId);
    return merge(IACLUB_V2, brain?.secoes?.design);
  } catch {
    return IACLUB_V2;
  }
}

// Re-tinge um projeto para os tokens da marca (camada Marca aplicada a um bundle).
// Conservador: só troca cores de marca conhecidas, preserva estilos autorais dos
// templates de "estilo" (Brutalism, Terminal...) que têm identidade própria.
export function applyBrandKit(data: ProjectData, kit: BrandKit): ProjectData {
  const { fundo, tinta, acento, gradiente } = kit.cores;
  const grad = `linear-gradient(135deg, ${gradiente[0]}, ${gradiente[1]})`;
  return {
    slides: (data.slides || []).map((s) => ({
      ...s,
      background_value:
        s.background_type === "solid" && isDefaultInk(s.background_value)
          ? fundo
          : s.background_value,
      elements: (s.elements || []).map((el) => {
        const st = { ...el.styles_json };
        if (st.gradientText) st.gradientText = grad;
        if (st.color && isDefaultInk(st.color)) st.color = tinta;
        if (st.backgroundColor && isBrandAccent(st.backgroundColor)) st.backgroundColor = acento;
        if (!st.fontFamily && el.element_type === "text") st.fontFamily = kit.fontes.corpo;
        return { ...el, styles_json: st };
      }),
    })),
  };
}

// Heurísticas mínimas p/ não reescrever estilos autorais.
function isDefaultInk(c: string): boolean {
  const v = c.toLowerCase().replace(/\s/g, "");
  return ["#fafaf8", "#0e2a2e", "#ffffff", "#fff", "#111", "#000000", "#000"].includes(v);
}
function isBrandAccent(c: string): boolean {
  const v = c.toLowerCase().replace(/\s/g, "");
  return ["#d6f24b", "#46655c"].includes(v);
}
