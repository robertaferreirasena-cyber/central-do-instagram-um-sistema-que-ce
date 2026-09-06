import { CSSProperties } from "react";
import type { SlideElement, Slide, ElementStyles } from "./types";

export function elementCss(el: SlideElement): CSSProperties {
  const s = el.styles_json || {};
  const css: CSSProperties = {
    position: "absolute",
    left: el.position_x,
    top: el.position_y,
    width: el.width,
    height: el.height,
    zIndex: el.z_index,
  };

  if (s.background) css.background = s.background;
  if (s.backgroundColor) css.backgroundColor = s.backgroundColor;
  if (s.border) css.border = s.border;
  if (s.borderRadius !== undefined) css.borderRadius = s.borderRadius;
  if (s.opacity !== undefined) css.opacity = s.opacity;
  if (s.transform) css.transform = s.transform;
  if (s.backdropFilter) {
    css.backdropFilter = s.backdropFilter;
    (css as any).WebkitBackdropFilter = s.backdropFilter;
  }
  if (s.padding) css.padding = s.padding;
  if (s.boxShadow) css.boxShadow = s.boxShadow;
  if (s.clipPath) {
    css.clipPath = s.clipPath;
    (css as any).WebkitClipPath = s.clipPath;
  }
  if (s.borderLeft) css.borderLeft = s.borderLeft;
  if (s.borderRight) css.borderRight = s.borderRight;
  if (s.borderTop) css.borderTop = s.borderTop;
  if (s.borderBottom) css.borderBottom = s.borderBottom;

  if (el.element_type === "text") {
    css.fontFamily = `"${s.fontFamily || "Instrument Sans"}", sans-serif`;
    css.fontSize = s.fontSize || 24;
    css.color = s.color || "#dce9f7";
    css.fontWeight = s.fontWeight ?? 700;
    css.fontStyle = s.fontStyle || "normal";
    css.textAlign = s.textAlign || "left";
    css.lineHeight = s.lineHeight ?? 1.15;
    if (s.letterSpacing !== undefined) {
      css.letterSpacing = typeof s.letterSpacing === "number" ? `${s.letterSpacing}px` : s.letterSpacing;
    }
    if (s.textTransform) css.textTransform = s.textTransform;
    if (s.textShadow) css.textShadow = s.textShadow;
    if (s.webkitTextStroke) (css as any).WebkitTextStroke = s.webkitTextStroke;
    css.wordBreak = "break-word";
    css.whiteSpace = "pre-wrap";
    // Título premium: gradiente recortado no texto (background-clip)
    if (s.gradientText) {
      css.background = s.gradientText;
      (css as any).WebkitBackgroundClip = "text";
      (css as any).backgroundClip = "text";
      (css as any).WebkitTextFillColor = "transparent";
      css.color = "transparent";
    }
  }

  if (el.element_type === "image" && s.imageUrl) {
    css.backgroundImage = `url(${s.imageUrl})`;
    css.backgroundSize = s.objectFit === "contain" ? "contain" : "cover";
    css.backgroundPosition = "center";
    css.backgroundRepeat = "no-repeat";
  }

  return css;
}

export function slideBackgroundCss(slide: {
  background_type: string;
  background_value: string;
  overlay_color: string | null;
  overlay_value: string | null;
  canvas_width: number;
  canvas_height: number;
}): CSSProperties {
  const css: CSSProperties = {
    width: slide.canvas_width,
    height: slide.canvas_height,
    position: "relative",
    overflow: "hidden",
  };

  if (slide.background_type === "image") {
    css.backgroundImage = `url(${slide.background_value})`;
    css.backgroundSize = "cover";
    css.backgroundPosition = "center";
  } else {
    css.background = slide.background_value;
  }

  // Apply overlay if present
  if (slide.overlay_color && slide.overlay_value) {
    const overlayAlpha = parseFloat(slide.overlay_value);
    if (!isNaN(overlayAlpha)) {
      const [r, g, b] = slide.overlay_color === "#000000" ? [0, 0, 0] : [255, 255, 255];
      css.boxShadow = `inset 0 0 0 9999px rgba(${r}, ${g}, ${b}, ${overlayAlpha})`;
    }
  }

  return css;
}
