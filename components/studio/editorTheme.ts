import type { CSSProperties } from 'react';

// Paleta IA Club V2 e helper de botão — compartilhados pelos painéis do editor.
export const C = {
  gelo: '#FAFAF8',
  petroleo: '#0E2A2E',
  citrico: '#D6F24B',
  eucalipto: '#46655C',
  petroleoEscuro: '#0a1315',
  borda: '#1c3b3f',
};

export const btn = (bg: string, fg: string): CSSProperties => ({
  padding: '10px 16px',
  background: bg,
  color: fg,
  border: `1px solid ${bg === 'transparent' ? C.eucalipto : bg}`,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'Archivo, sans-serif',
});
