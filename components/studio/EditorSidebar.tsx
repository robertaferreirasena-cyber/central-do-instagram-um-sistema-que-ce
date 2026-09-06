'use client';

import React, { useState } from 'react';
import type { Slide, SlideElement, StudioTemplate } from '@/lib/studio/types';

interface EditorSidebarProps {
  slide: Slide;
  selectedElement?: SlideElement;
  templates: StudioTemplate[];
  onApplyTemplate: (template: StudioTemplate) => void;
  onElementUpdate: (el: SlideElement) => void;
  onAddElement: (type: string) => void;
  onSlideUpdate: (slide: Slide) => void;
}

export default function EditorSidebar({
  slide,
  selectedElement,
  templates,
  onApplyTemplate,
  onElementUpdate,
  onAddElement,
  onSlideUpdate,
}: EditorSidebarProps) {
  const [tab, setTab] = useState<'templates' | 'elements' | 'text' | 'image' | 'background' | 'adjust'>('templates');

  return (
    <div
      style={{
        width: 320,
        backgroundColor: '#0E2A2E',
        borderRight: '1px solid #46655C',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #46655C' }}>
        {[
          { key: 'templates', label: 'Modelos' },
          { key: 'elements', label: 'Elementos' },
          { key: 'text', label: 'Texto' },
          { key: 'image', label: 'Imagem' },
          { key: 'background', label: 'Fundo' },
          { key: 'adjust', label: 'Ajustes' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              flex: 1,
              padding: '8px',
              background: tab === t.key ? '#46655C' : 'transparent',
              color: tab === t.key ? '#D6F24B' : '#FAFAF8',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: tab === t.key ? 700 : 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px', fontSize: 12, color: '#FAFAF8' }}>
        {tab === 'templates' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: '#D6F24B' }}>Modelos de Slide</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {templates.slice(0, 12).map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onApplyTemplate(tpl)}
                  style={{
                    padding: '8px',
                    backgroundColor: '#46655C',
                    color: '#FAFAF8',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'elements' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: '#D6F24B' }}>Adicionar Elemento</h3>
            {['text', 'image', 'box', 'deco'].map((type) => (
              <button
                key={type}
                onClick={() => onAddElement(type)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px',
                  marginBottom: 8,
                  backgroundColor: '#46655C',
                  color: '#FAFAF8',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                + {type === 'deco' ? 'Decoração' : type === 'text' ? 'Texto' : type === 'image' ? 'Imagem' : 'Caixa'}
              </button>
            ))}
          </div>
        )}

        {tab === 'text' && selectedElement?.element_type === 'text' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: '#D6F24B' }}>Editar Texto</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Conteúdo</label>
              <textarea
                value={selectedElement.content}
                onChange={(e) => onElementUpdate({ ...selectedElement, content: e.target.value })}
                style={{
                  width: '100%',
                  padding: 6,
                  backgroundColor: '#0a1315',
                  color: '#FAFAF8',
                  border: '1px solid #46655C',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  minHeight: 60,
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Tamanho</label>
                <input
                  type="number"
                  value={selectedElement.styles_json.fontSize || 24}
                  onChange={(e) =>
                    onElementUpdate({
                      ...selectedElement,
                      styles_json: { ...selectedElement.styles_json, fontSize: parseInt(e.target.value) },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Peso</label>
                <select
                  value={selectedElement.styles_json.fontWeight || 700}
                  onChange={(e) =>
                    onElementUpdate({
                      ...selectedElement,
                      styles_json: { ...selectedElement.styles_json, fontWeight: parseInt(e.target.value) },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  <option value="400">Normal</option>
                  <option value="600">Semi</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Cor</label>
                <input
                  type="color"
                  value={selectedElement.styles_json.color || '#FAFAF8'}
                  onChange={(e) =>
                    onElementUpdate({
                      ...selectedElement,
                      styles_json: { ...selectedElement.styles_json, color: e.target.value },
                    })
                  }
                  style={{ width: '100%', height: 32, cursor: 'pointer', border: 'none', borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Alinhamento</label>
                <select
                  value={selectedElement.styles_json.textAlign || 'left'}
                  onChange={(e) =>
                    onElementUpdate({
                      ...selectedElement,
                      styles_json: { ...selectedElement.styles_json, textAlign: e.target.value as any },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {tab === 'image' && selectedElement?.element_type === 'image' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: '#D6F24B' }}>Editar Imagem</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>URL da Imagem</label>
              <input
                type="text"
                value={selectedElement.styles_json.imageUrl || ''}
                onChange={(e) =>
                  onElementUpdate({
                    ...selectedElement,
                    styles_json: { ...selectedElement.styles_json, imageUrl: e.target.value },
                  })
                }
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: 6,
                  backgroundColor: '#0a1315',
                  color: '#FAFAF8',
                  border: '1px solid #46655C',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Ajuste</label>
              <select
                value={selectedElement.styles_json.objectFit || 'cover'}
                onChange={(e) =>
                  onElementUpdate({
                    ...selectedElement,
                    styles_json: { ...selectedElement.styles_json, objectFit: e.target.value as any },
                  })
                }
                style={{
                  width: '100%',
                  padding: 4,
                  backgroundColor: '#0a1315',
                  color: '#FAFAF8',
                  border: '1px solid #46655C',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                <option value="cover">Cobrir</option>
                <option value="contain">Conter</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'background' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: '#D6F24B' }}>Fundo do Slide</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Tipo</label>
              <select
                value={slide.background_type}
                onChange={(e) =>
                  onSlideUpdate({ ...slide, background_type: e.target.value as any })
                }
                style={{
                  width: '100%',
                  padding: 4,
                  backgroundColor: '#0a1315',
                  color: '#FAFAF8',
                  border: '1px solid #46655C',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                <option value="solid">Sólido</option>
                <option value="gradient">Gradiente</option>
                <option value="image">Imagem</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Valor</label>
              {slide.background_type === 'solid' ? (
                <input
                  type="color"
                  value={slide.background_value}
                  onChange={(e) => onSlideUpdate({ ...slide, background_value: e.target.value })}
                  style={{ width: '100%', height: 32, cursor: 'pointer', border: 'none', borderRadius: 4 }}
                />
              ) : (
                <input
                  type="text"
                  value={slide.background_value}
                  onChange={(e) => onSlideUpdate({ ...slide, background_value: e.target.value })}
                  placeholder={slide.background_type === 'gradient' ? 'linear-gradient(...)' : 'https://...'}
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                />
              )}
            </div>
          </div>
        )}

        {tab === 'adjust' && selectedElement && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, color: '#D6F24B' }}>Ajustes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>X</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.position_x)}
                  onChange={(e) =>
                    onElementUpdate({ ...selectedElement, position_x: parseInt(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Y</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.position_y)}
                  onChange={(e) =>
                    onElementUpdate({ ...selectedElement, position_y: parseInt(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Larg</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => onElementUpdate({ ...selectedElement, width: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Alt</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => onElementUpdate({ ...selectedElement, height: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Z-Index</label>
                <input
                  type="number"
                  value={selectedElement.z_index}
                  onChange={(e) => onElementUpdate({ ...selectedElement, z_index: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 4,
                    backgroundColor: '#0a1315',
                    color: '#FAFAF8',
                    border: '1px solid #46655C',
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 11 }}>Opacidade</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedElement.styles_json.opacity || 1}
                  onChange={(e) =>
                    onElementUpdate({
                      ...selectedElement,
                      styles_json: { ...selectedElement.styles_json, opacity: parseFloat(e.target.value) },
                    })
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
