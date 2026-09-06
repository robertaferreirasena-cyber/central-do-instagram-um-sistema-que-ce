import type { Slide, SlideElement, ElementStyles } from "./types";

const GOOGLE_FONTS_IMPORT = `@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap");`;

function stylesToCss(styles: ElementStyles): string {
  const css: Record<string, string | number> = {};

  if (styles.fontFamily) css.fontFamily = styles.fontFamily;
  if (styles.fontSize) css.fontSize = `${styles.fontSize}px`;
  if (styles.fontWeight) css.fontWeight = String(styles.fontWeight);
  if (styles.color) css.color = styles.color;
  if (styles.textAlign) css.textAlign = styles.textAlign;
  if (styles.lineHeight) css.lineHeight = String(styles.lineHeight);
  if (styles.letterSpacing) {
    if (typeof styles.letterSpacing === "number") {
      css.letterSpacing = `${styles.letterSpacing}px`;
    } else {
      css.letterSpacing = styles.letterSpacing;
    }
  }
  if (styles.fontStyle) css.fontStyle = styles.fontStyle;
  if (styles.textTransform) css.textTransform = styles.textTransform;
  if (styles.textShadow) css.textShadow = styles.textShadow;
  if (styles.webkitTextStroke) css.webkitTextStroke = styles.webkitTextStroke;
  if (styles.background) css.background = styles.background;
  if (styles.backgroundColor) css.backgroundColor = styles.backgroundColor;
  if (styles.borderRadius) {
    css.borderRadius = typeof styles.borderRadius === "number" ? `${styles.borderRadius}px` : String(styles.borderRadius);
  }
  if (styles.border) css.border = styles.border;
  if (styles.borderLeft) css.borderLeft = styles.borderLeft;
  if (styles.borderRight) css.borderRight = styles.borderRight;
  if (styles.borderTop) css.borderTop = styles.borderTop;
  if (styles.borderBottom) css.borderBottom = styles.borderBottom;
  if (styles.boxShadow) css.boxShadow = styles.boxShadow;
  if (styles.opacity) css.opacity = String(styles.opacity);
  if (styles.transform) css.transform = styles.transform;
  if (styles.backdropFilter) css.backdropFilter = styles.backdropFilter;
  if (styles.clipPath) css.clipPath = styles.clipPath;
  if (styles.padding) css.padding = styles.padding;
  if (styles.objectFit) css.objectFit = styles.objectFit;

  return Object.entries(css)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v};`)
    .join(" ");
}

function renderElement(el: SlideElement): string {
  const baseStyle = `position: absolute; left: ${el.position_x}px; top: ${el.position_y}px; width: ${el.width}px; height: ${el.height}px; z-index: ${el.z_index}; box-sizing: border-box;`;
  const elemStyle = stylesToCss(el.styles_json);

  switch (el.element_type) {
    case "text": {
      // Título premium: gradiente recortado no texto
      const grad = el.styles_json.gradientText
        ? `background: ${el.styles_json.gradientText}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;`
        : "";
      return `<div style="${baseStyle} ${elemStyle} white-space: pre-wrap; ${grad}">${escapeHtml(el.content)}</div>`;
    }

    case "image":
      if (el.styles_json.imageUrl) {
        return `<img src="${el.styles_json.imageUrl}" style="${baseStyle} ${elemStyle}" alt="" />`;
      }
      return `<div style="${baseStyle} ${elemStyle}"></div>`;

    case "box":
      return `<div style="${baseStyle} ${elemStyle}"></div>`;

    default:
      return `<div style="${baseStyle} ${elemStyle}"></div>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'"'"'/g, "&#39;");
}

export function slideToHtml(slide: Slide): string {
  const backgroundCss = getBgCss(slide);
  const overlayHtml = slide.overlay_color && slide.overlay_value
    ? `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${slide.overlay_color}; opacity: ${slide.overlay_value};"></div>`
    : "";

  const elementsHtml = slide.elements.map(renderElement).join("\n");

  return `<div class="slide" style="width: ${slide.canvas_width}px; height: ${slide.canvas_height}px; position: relative; overflow: hidden; ${backgroundCss}">
    ${overlayHtml}
    ${elementsHtml}
  </div>`;
}

function getBgCss(slide: Slide): string {
  if (slide.background_type === "gradient") {
    return `background: ${slide.background_value};`;
  } else if (slide.background_type === "image") {
    return `background-image: url("${slide.background_value}"); background-size: cover; background-position: center;`;
  } else {
    return `background-color: ${slide.background_value};`;
  }
}

export function generateHtmlForSlides(slides: Slide[]): string {
  const slidesHtml = slides.map(slideToHtml).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carrossel IA Club</title>
  <style>
    ${GOOGLE_FONTS_IMPORT}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; margin: 0; }
    /* cada slide empilhado, NUNCA encolhido (senão o screenshot sai estreito) */
    .slide { display: block; flex-shrink: 0; }
  </style>
</head>
<body>
  ${slidesHtml}
</body>
</html>`;
}
