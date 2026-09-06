'use client';

import React from 'react';
import type { Slide } from '@/lib/studio/types';

interface SlideStripProps {
  slides: Slide[];
  currentSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
}

export default function SlideStrip({
  slides,
  currentSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
}: SlideStripProps) {
  return (
    <div
      style={{
        height: 100,
        backgroundColor: '#070d18',
        borderTop: '1px solid #46655C',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        overflowX: 'auto',
      }}
    >
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          style={{
            position: 'relative',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <div
            onClick={() => onSelectSlide(slide.id)}
            style={{
              width: 80,
              height: 80,
              backgroundColor: currentSlideId === slide.id ? '#D6F24B' : '#46655C',
              border: currentSlideId === slide.id ? '2px solid #D6F24B' : '1px solid #0a1315',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: currentSlideId === slide.id ? '#0E2A2E' : '#FAFAF8',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                currentSlideId === slide.id ? '#D6F24B' : '#46655C';
            }}
          >
            Slide {idx + 1}
          </div>

          {currentSlideId === slide.id && (
            <div
              style={{
                position: 'absolute',
                top: -28,
                left: 0,
                right: 0,
                display: 'flex',
                gap: 4,
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => onDuplicateSlide(slide.id)}
                title="Duplicar"
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#46655C',
                  color: '#FAFAF8',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                Dup
              </button>
              <button
                onClick={() => onDeleteSlide(slide.id)}
                title="Excluir"
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#8b3333',
                  color: '#FAFAF8',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                Del
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onAddSlide}
        style={{
          flexShrink: 0,
          width: 80,
          height: 80,
          backgroundColor: '#0a1315',
          color: '#D6F24B',
          border: '2px dashed #D6F24B',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 32,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Novo slide"
      >
        +
      </button>
    </div>
  );
}
