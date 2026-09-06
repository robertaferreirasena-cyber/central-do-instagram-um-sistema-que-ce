"use client";

import { CSSProperties } from "react";
import type { TemplateSnapshot, TemplateSlideSnapshot } from "@/lib/studio/types";
import { elementCss, slideBackgroundCss } from "@/lib/studio/elementCss";

interface StudioThumbnailProps {
  template?: TemplateSnapshot;
  slide?: TemplateSlideSnapshot;
  width: number;
}

export default function StudioThumbnail({
  template,
  slide,
  width,
}: StudioThumbnailProps) {
  // Obter o primeiro slide do template ou usar slide fornecido
  const targetSlide = slide || template?.slides?.[0];

  if (!targetSlide) {
    return (
      <div style={{ width, height: "auto", background: "#ccc", color: "#666" }}>
        Sem slide
      </div>
    );
  }

  // Calcular escala baseado na largura do canvas
  const canvasWidth = targetSlide.canvas_width || 1080;
  const canvasHeight = targetSlide.canvas_height || 1350;
  const scale = width / canvasWidth;
  const scaledHeight = canvasHeight * scale;

  // CSS do fundo do slide
  const bgCss = slideBackgroundCss({
    background_type: targetSlide.background_type,
    background_value: targetSlide.background_value,
    overlay_color: targetSlide.overlay_color || null,
    overlay_value: targetSlide.overlay_value || null,
    canvas_width: targetSlide.canvas_width,
    canvas_height: targetSlide.canvas_height,
  });

  // CSS do container com escala
  const containerStyle: CSSProperties = {
    position: "relative",
    width: canvasWidth,
    height: canvasHeight,
    transformOrigin: "top left",
    transform: `scale(${scale})`,
    overflow: "hidden",
    pointerEvents: "none",
  };

  // Wrapper exterior para tamanho final
  const wrapperStyle: CSSProperties = {
    position: "relative",
    width,
    height: scaledHeight,
    overflow: "hidden",
  };

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
        {/* Fundo do slide */}
        <div style={bgCss}>
          {/* Elementos do slide */}
          {targetSlide.elements?.map((el) => {
            const elStyle = elementCss(el as any);

            if (el.element_type === "text") {
              return (
                <div key={`${el.element_type}-${el.z_index}`} style={elStyle}>
                  {el.content}
                </div>
              );
            }

            if (el.element_type === "image") {
              return (
                <div key={`${el.element_type}-${el.z_index}`} style={elStyle} />
              );
            }

            if (el.element_type === "box") {
              return (
                <div key={`${el.element_type}-${el.z_index}`} style={elStyle} />
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
