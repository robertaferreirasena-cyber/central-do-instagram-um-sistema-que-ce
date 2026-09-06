'use client';
import { useState } from 'react';
import StudioThumbnail from './StudioThumbnail';
import type { StudioTemplate } from '@/lib/studio/types';
import { C } from './editorTheme';

// Painel ESQUERDA: modelos do Post Studio; clicar aplica ao slide atual.
export default function TemplateLibrary(props: {
  templates: StudioTemplate[];
  onApply: (tpl: StudioTemplate) => void;
}) {
  const [filter, setFilter] = useState('');
  return (
    <div style={{ background: C.petroleo, borderRight: `1px solid ${C.borda}`, overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
        BIBLIOTECA
      </div>
      <div style={{ fontSize: 12, color: C.eucalipto, marginBottom: 12 }}>Modelos do seu Post Studio</div>
      <input
        placeholder="Buscar modelo…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: '9px 10px', fontSize: 12, marginBottom: 14 }}
      />
      <div style={{ display: 'grid', gap: 10 }}>
        {props.templates
          .filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
          .map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => props.onApply(tpl)}
              title="Aplicar ao slide atual"
              style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'center', textAlign: 'left', background: C.petroleoEscuro, border: `1px solid ${C.borda}`, padding: 8, cursor: 'pointer' }}
            >
              <div style={{ width: 64, height: 80, overflow: 'hidden', background: '#000', flex: 'none' }}>
                <StudioThumbnail template={tpl.template_json} width={64} />
              </div>
              <div style={{ minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: 12, color: C.gelo, fontFamily: 'Archivo, sans-serif' }}>{tpl.name}</b>
                <small style={{ display: 'block', fontSize: 10, color: C.eucalipto, margin: '2px 0 6px' }}>{tpl.category}</small>
                <em style={{ fontSize: 10, fontStyle: 'normal', color: C.citrico }}>Aplicar ao slide</em>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
