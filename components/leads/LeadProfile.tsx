'use client';
import { useState } from 'react';

// Perfil rico do lead — enriquecido pelo agente a partir das conversas do Direct.
export interface LeadPerfil {
  resumo?: string;
  interesses?: string[];
  intencao?: string;
  estagio?: string;
  sinais?: string[];
  atualizado_em?: string;
}
export interface LeadFull {
  id: string;
  nome: string;
  instagram: string;
  telefone: string;
  origem: string;
  interesse: string;
  score: number;
  status: string;
  vendedor_id?: string;
  resultado: string;
  avatar_url?: string | null;
  primeiro_contato?: string | null;
  ultimo_contato?: string | null;
  total_mensagens?: number;
  zernio_conversa_id?: number | null;
  perfil?: LeadPerfil | null;
}

const STATUS_OPTIONS = ['novo', 'qualificado', 'pra-whatsapp', 'pedido', 'perdido'];
const ESTAGIO_COR: Record<string, string> = { quente: '#e8590c', qualificado: '#2b8a3e', novo: '#1971c2', frio: '#868e96' };

function fmt(d?: string | null) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
}

export default function LeadProfile({
  lead, sellers, onClose, onRefetch,
}: {
  lead: LeadFull;
  sellers: { id: string; nome: string }[];
  onClose: () => void;
  onRefetch: () => void;
}) {
  const [form, setForm] = useState({
    status: lead.status || 'novo', score: lead.score || 0,
    interesse: lead.interesse || '', resultado: lead.resultado || '', vendedor_id: lead.vendedor_id || '',
  });
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const p = lead.perfil || {};
  const estCor = ESTAGIO_COR[p.estagio || ''] || '#495057';

  const salvar = async () => {
    setSaving(true);
    try {
      await fetch(`/api/instagram/leads/${lead.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      onRefetch();
      onClose();
    } finally { setSaving(false); }
  };

  const atualizarPerfil = async () => {
    if (!lead.zernio_conversa_id) { alert('Este lead ainda não tem conversa vinculada para analisar.'); return; }
    setEnriching(true);
    try {
      await fetch('/api/crm/enrich-leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, conversaId: lead.zernio_conversa_id }),
      });
      onRefetch();
      alert('Perfil atualizado pelo agente a partir da conversa.');
    } finally { setEnriching(false); }
  };

  const chip = (t: string, bg: string, fg: string) => (
    <span key={t} style={{ display: 'inline-block', padding: '3px 10px', background: bg, color: fg, borderRadius: 999, fontSize: 12, marginRight: 6, marginBottom: 6 }}>{t}</span>
  );
  const lbl: React.CSSProperties = { fontSize: 12, color: '#868e96', marginBottom: 4 };
  const field: React.CSSProperties = { width: '100%', padding: '8px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px, 94vw)', height: '100%', background: '#fff', overflowY: 'auto', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)' }}>
        {/* Cabeçalho */}
        <div style={{ padding: 20, borderBottom: '1px solid #eee', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', flex: 'none', background: '#dee2e6', backgroundImage: lead.avatar_url ? `url(${lead.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#868e96' }}>
            {!lead.avatar_url && (lead.nome?.[0] || '?').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#212529', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.nome}</div>
            {lead.instagram && <a href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1971c2' }}>@{lead.instagram}</a>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: '#868e96' }}>×</button>
        </div>

        {/* Badges */}
        <div style={{ padding: '14px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #f1f3f5' }}>
          <span style={{ padding: '4px 12px', background: estCor, color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{p.estagio || lead.status}</span>
          <span style={{ padding: '4px 12px', background: '#fff3bf', color: '#5c3c00', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Score {lead.score}</span>
          <span style={{ padding: '4px 12px', background: '#e7f5ff', color: '#1971c2', borderRadius: 999, fontSize: 12, textTransform: 'capitalize' }}>{lead.origem}</span>
          {p.intencao && <span style={{ padding: '4px 12px', background: '#f3f0ff', color: '#6741d9', borderRadius: 999, fontSize: 12 }}>{p.intencao.replace(/_/g, ' ')}</span>}
        </div>

        {/* Perfil captado pelo agente */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#212529' }}>🧠 Perfil (captado no Direct)</div>
            <button onClick={atualizarPerfil} disabled={enriching} style={{ fontSize: 12, padding: '5px 10px', background: '#f3f0ff', color: '#6741d9', border: '1px solid #d0bfff', borderRadius: 6, cursor: 'pointer' }}>
              {enriching ? 'Analisando…' : '↻ Atualizar perfil'}
            </button>
          </div>
          {p.resumo ? <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5, color: '#343a40' }}>{p.resumo}</p>
            : <p style={{ margin: '0 0 12px', fontSize: 13, color: '#adb5bd' }}>Sem perfil ainda — clique em “Atualizar perfil” para o agente analisar a conversa.</p>}

          {!!p.interesses?.length && (<div style={{ marginBottom: 12 }}><div style={lbl}>Interesses</div>{p.interesses.map((t) => chip(t, '#e7f5ff', '#1971c2'))}</div>)}
          {!!p.sinais?.length && (
            <div style={{ marginBottom: 12 }}>
              <div style={lbl}>Sinais captados</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#495057', lineHeight: 1.6 }}>{p.sinais.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            <div><div style={lbl}>Total de mensagens</div><div style={{ fontSize: 14, fontWeight: 600 }}>{lead.total_mensagens ?? 0}</div></div>
            <div><div style={lbl}>Telefone</div><div style={{ fontSize: 14 }}>{lead.telefone || '—'}</div></div>
            <div><div style={lbl}>Primeiro contato</div><div style={{ fontSize: 13 }}>{fmt(lead.primeiro_contato)}</div></div>
            <div><div style={lbl}>Último contato</div><div style={{ fontSize: 13 }}>{fmt(lead.ultimo_contato)}</div></div>
          </div>
        </div>

        {/* Gestão do lead */}
        <div style={{ padding: 20, borderTop: '1px solid #f1f3f5' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#212529' }}>Gestão</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><div style={lbl}>Status</div>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={field}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><div style={lbl}>Vendedor</div>
              <select value={form.vendedor_id} onChange={(e) => setForm({ ...form, vendedor_id: e.target.value })} style={field}>
                <option value="">Sem vendedor</option>
                {sellers.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select></div>
            <div><div style={lbl}>Score</div>
              <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 0 })} style={field} /></div>
            <div><div style={lbl}>Resultado</div>
              <input value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} placeholder="pedido, adiado, perdido…" style={field} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {lead.telefone && <a href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: 10, background: '#25d366', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>}
            <button onClick={salvar} disabled={saving} style={{ flex: 2, padding: 10, background: '#1971c2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
