// Studio Types — IA Club V2 adaptação para Next.js
export type PostFormat = "4:5" | "3:4" | "1:1" | "9:16";
export type ElementType = "text" | "image" | "shape" | "icon" | "box" | "deco";
export type BackgroundType = "solid" | "gradient" | "image";

export interface ElementStyles {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number | string;
  fontStyle?: "normal" | "italic";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textShadow?: string;
  webkitTextStroke?: string;
  gradientText?: string; // gradiente CSS aplicado ao texto via background-clip (título premium)
  background?: string;
  backgroundColor?: string;
  borderRadius?: number | string;
  borderColor?: string;
  borderWidth?: number;
  border?: string;
  borderLeft?: string;
  borderRight?: string;
  borderTop?: string;
  borderBottom?: string;
  boxShadow?: string;
  opacity?: number;
  rotation?: number;
  transform?: string;
  shape?: "rectangle" | "circle" | "line" | "arrow";
  backdropFilter?: string;
  padding?: string;
  imageUrl?: string;
  isCircle?: boolean;
  objectFit?: "cover" | "contain";
  iconName?: string;
  decoType?: "sparkle" | "arrow" | "chat" | "line";
  boxVariant?: "brown" | "gold" | "dark" | "outline" | "seal-zigzag" | "spiral-binding" | "seal-gold-wax";
  clipPath?: string;
}

export interface SlideElement {
  id: string;
  element_type: ElementType;
  content: string;
  styles_json: ElementStyles;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
}

export interface Slide {
  id: string;
  background_type: BackgroundType;
  background_value: string;
  overlay_color: string | null;
  overlay_value: string | null;
  canvas_width: number;
  canvas_height: number;
  elements: SlideElement[];
}

export interface ProjectData {
  slides: Slide[];
  // Conteúdo (roteiro) guardado SEPARADO do design (slides). Assim dá pra trocar de
  // template/re-renderizar sem perder o texto gerado. Editar no editor preserva estas
  // chaves (spread de data), o que evita apagar o roteiro ao salvar.
  roteiro?: Record<string, unknown>[];
  caption?: string;
  hashtags?: string[];
  estilo?: string;
}

export interface StudioProject {
  id: string;
  account_id: string;
  title: string;
  format: PostFormat;
  status: "rascunho" | "revisao" | "agendado" | "publicado";
  template_id?: string;
  data: ProjectData;
  caption?: string;
  hashtags?: string[];
  cover_url?: string;
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudioTemplate {
  id: string;
  account_id: string;
  name: string;
  category: string;
  format: PostFormat;
  template_json: TemplateSnapshot;
  preview_url?: string;
  is_system: boolean;
  sequence_order: number;
  created_at: string;
}

export interface TemplateElementSnapshot {
  element_type: ElementType;
  content: string;
  styles_json: ElementStyles;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
}

export interface TemplateSlideSnapshot {
  background_type: BackgroundType;
  background_value: string;
  overlay_color?: string | null;
  overlay_value?: string | null;
  canvas_width: number;
  canvas_height: number;
  elements: TemplateElementSnapshot[];
}

export interface TemplateSnapshot {
  format: PostFormat;
  slides: TemplateSlideSnapshot[];
}

export const CANVAS_DIMENSIONS: Record<PostFormat, { w: number; h: number }> = {
  "4:5": { w: 1080, h: 1350 },
  "3:4": { w: 1080, h: 1440 },
  "1:1": { w: 1080, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
};
