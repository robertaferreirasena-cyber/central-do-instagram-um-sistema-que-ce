'use client';
import type { Estilo } from '@/modules/studio/services/carouselBuilder';

type Objetivo = 'salvar' | 'compartilhar' | 'seguir' | 'vender';

// Painel "Criar carrossel com IA" (metodologia editorial). Só apresenta;
// a geração fica no page (que orquestra roteiro → templates → projeto).
export default function CriarComIaPanel(props: {
  tema: string; setTema: (v: string) => void;
  objetivo: Objetivo; setObjetivo: (v: Objetivo) => void;
  estilo: Estilo; setEstilo: (v: Estilo) => void;
  num: number; setNum: (v: number) => void;
  loading: boolean; aviso: string | null;
  onGerar: () => void;
}) {
  const { tema, setTema, objetivo, setObjetivo, estilo, setEstilo, num, setNum, loading, aviso, onGerar } = props;
  const sel: React.CSSProperties = { padding: '10px', background: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', fontSize: 13, cursor: 'pointer' };
  return (
    <div style={{ marginBottom: 28, background: '#0E2A2E', border: '1px solid #46655C', padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#D6F24B', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
        ✦ CRIAR CARROSSEL COM IA
      </div>
      <div style={{ fontSize: 12, color: '#7A8B84', marginBottom: 14 }}>
        A IA age como editora: arquétipo, densidade e humanização no tom IA Club. Você edita e publica.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Tema do carrossel (ex.: como usar IA sem gastar nada)"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !loading) onGerar(); }}
          style={{ flex: 1, minWidth: 280, padding: '10px 12px', background: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', fontSize: 13 }}
        />
        <select value={objetivo} onChange={(e) => setObjetivo(e.target.value as Objetivo)} style={sel}>
          <option value="seguir">Objetivo: Seguir</option>
          <option value="salvar">Objetivo: Salvar</option>
          <option value="compartilhar">Objetivo: Compartilhar</option>
          <option value="vender">Objetivo: Vender</option>
        </select>
        <select value={estilo} onChange={(e) => setEstilo(e.target.value as Estilo)} style={sel}>
          <option value="escuro">Estilo: Escuro</option>
          <option value="claro">Estilo: Claro</option>
          <option value="tweet">Estilo: Twitter/X</option>
        </select>
        <select value={num} onChange={(e) => setNum(parseInt(e.target.value))} style={sel}>
          {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} slides</option>)}
        </select>
        <button onClick={onGerar} disabled={loading || !tema.trim()}
          style={{ padding: '10px 18px', background: '#D6F24B', color: '#0E2A2E', border: 'none', cursor: loading ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13 }}>
          {loading ? 'Gerando roteiro…' : '✦ Gerar carrossel'}
        </button>
      </div>
      {aviso && <div style={{ marginTop: 10, fontSize: 12, color: '#e0c060' }}>{aviso}</div>}
    </div>
  );
}
