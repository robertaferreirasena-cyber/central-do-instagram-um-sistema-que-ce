'use client';
import type { StudioProject } from '@/lib/studio/types';
import type { SaveStatus } from '@/modules/studio/hooks/useAutosave';
import { C, btn } from './editorTheme';

// Cabeçalho do editor: título editável, status de autosave e ações.
export default function EditorTopbar(props: {
  project: StudioProject;
  saveStatus: SaveStatus;
  generating: boolean;
  isExporting: boolean;
  onBack?: () => void;
  onTitleChange: (title: string) => void;
  onSaveTemplate: () => void;
  onGenerate: () => void;
  onExportCurrent: () => void;
  onExportHD: () => void;
  onExportZip: () => void;
}) {
  const { project, saveStatus, generating, isExporting } = props;
  return (
    <div style={{ height: 60, background: C.petroleo, borderBottom: `1px solid ${C.borda}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16 }}>
      {props.onBack && (
        <button onClick={props.onBack} style={btn('transparent', C.gelo)}>← Projetos</button>
      )}
      <input
        value={project.title}
        onChange={(e) => props.onTitleChange(e.target.value)}
        style={{ background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: '8px 12px', fontSize: 14, fontWeight: 700, minWidth: 220, fontFamily: 'Archivo, sans-serif' }}
      />
      <span style={{ fontSize: 12, color: saveStatus === 'saved' ? C.citrico : C.eucalipto, marginLeft: 4 }}>
        {saveStatus === 'saving' ? 'Salvando…' : saveStatus === 'saved' ? '✓ Salvo' : 'Salvo automaticamente'}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
        <button onClick={props.onSaveTemplate} style={btn('transparent', C.gelo)}>💾 Salvar modelo</button>
        <button onClick={props.onGenerate} disabled={generating} style={btn(C.citrico, C.petroleo)}>
          {generating ? 'Gerando…' : '✦ Gerar com IA'}
        </button>
        <button onClick={props.onExportCurrent} disabled={isExporting} style={btn('transparent', C.gelo)}>↓ PNG</button>
        <button onClick={props.onExportHD} disabled={isExporting} style={btn(C.citrico, C.petroleo)}>
          {isExporting ? '…' : '🔶 Exportar HD'}
        </button>
        <button onClick={props.onExportZip} disabled={isExporting} style={btn(C.eucalipto, C.gelo)}>
          {isExporting ? '…' : '⤓ Baixar ZIP'}
        </button>
      </div>
    </div>
  );
}
