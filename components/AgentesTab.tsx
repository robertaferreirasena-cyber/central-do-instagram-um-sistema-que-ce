'use client';
import { useState, useEffect } from 'react';

interface Agente {
  id?: number;
  nome: string;
  persona: string;
  funcao: string;
  instrucoes?: string;
  ativo: boolean;
  objetivo?: string;
  status?: string;
  config?: {
    tom_voz?: string;
    fontes?: string[];
    campos_coletar?: string[];
    limite_mensagens?: number;
    handoff?: string;
    horario?: string;
    msg_indisponivel?: string;
    fila_destino?: string;
  };
}

const OBJETIVOS = [
  { v: 'pre_atendimento', l: 'Pré-atendimento' },
  { v: 'qualificacao', l: 'Qualificação' },
  { v: 'suporte', l: 'Suporte' },
  { v: 'comercial', l: 'Comercial' },
  { v: 'encaminhamento', l: 'Encaminhar ao WhatsApp' },
];
const STATUS = [
  { v: 'rascunho', l: 'Rascunho', c: '#868e96' },
  { v: 'em_teste', l: 'Em teste', c: '#f59f00' },
  { v: 'ativo', l: 'Ativo', c: '#2b8a3e' },
  { v: 'pausado', l: 'Pausado', c: '#c92a2a' },
];
const FONTES = ['brain', 'catalogo', 'faq', 'politicas', 'estoque', 'pedidos'];

const vazio = (): Agente => ({
  nome: '', persona: '', funcao: 'atendimento', instrucoes: '', ativo: true,
  objetivo: 'pre_atendimento', status: 'rascunho',
  config: { tom_voz: '', fontes: ['brain', 'faq'], campos_coletar: [], limite_mensagens: 5, handoff: '', horario: '', msg_indisponivel: '', fila_destino: '' },
});

export function AgentesTab() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Agente | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/instagram/agentes').then((r) => r.json()).then((j) => setAgentes(j.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const salvar = async () => {
    if (!edit || !edit.nome.trim()) { alert('Dê um nome ao agente.'); return; }
    setSaving(true);
    try {
      const method = edit.id ? 'PUT' : 'POST';
      const res = await fetch('/api/instagram/agentes', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit),
      });
      const j = await res.json();
      if (!res.ok || !j.success) { alert('Erro: ' + (j.error || 'falha ao salvar')); return; }
      setEdit(null);
      load();
    } finally { setSaving(false); }
  };

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e9ecef', borderRadius: 10, padding: 16 };
  const field: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 12, color: '#495057', fontWeight: 600, marginBottom: 4, display: 'block' };

  if (loading) return <div style={{ padding: 24, color: '#868e96' }}>Carregando…</div>;

  // FORM (criar/editar)
  if (edit) {
    const cfg = edit.config || {};
    const setCfg = (patch: Partial<NonNullable<Agente['config']>>) => setEdit({ ...edit, config: { ...cfg, ...patch } });
    return (
      <div style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{edit.id ? 'Editar agente' : 'Novo agente'}</h3>
          <button onClick={() => setEdit(null)} style={{ background: 'transparent', border: 'none', color: '#868e96', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Nome *</label><input value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} style={field} /></div>
            <div><label style={lbl}>Objetivo</label><select value={edit.objetivo || 'pre_atendimento'} onChange={(e) => setEdit({ ...edit, objetivo: e.target.value })} style={field}>{OBJETIVOS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Status</label><select value={edit.status || 'rascunho'} onChange={(e) => setEdit({ ...edit, status: e.target.value })} style={field}>{STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
            <div><label style={lbl}>Limite de mensagens seguidas</label><input type="number" value={cfg.limite_mensagens ?? 5} onChange={(e) => setCfg({ limite_mensagens: parseInt(e.target.value) || 0 })} style={field} /></div>
          </div>
          <div><label style={lbl}>Tom de voz</label><input value={cfg.tom_voz || ''} onChange={(e) => setCfg({ tom_voz: e.target.value })} placeholder="ex.: próximo, direto, sem hype" style={field} /></div>
          <div><label style={lbl}>Persona / instruções (o que o agente é e como age)</label><textarea value={edit.persona} onChange={(e) => setEdit({ ...edit, persona: e.target.value })} rows={4} style={{ ...field, resize: 'vertical' }} /></div>
          <div>
            <label style={lbl}>Fontes permitidas</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FONTES.map((f) => {
                const on = (cfg.fontes || []).includes(f);
                return <button key={f} onClick={() => setCfg({ fontes: on ? (cfg.fontes || []).filter((x) => x !== f) : [...(cfg.fontes || []), f] })}
                  style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: '1px solid ' + (on ? '#1971c2' : '#dee2e6'), background: on ? '#e7f5ff' : '#fff', color: on ? '#1971c2' : '#868e96' }}>{f}</button>;
              })}
            </div>
          </div>
          <div><label style={lbl}>Campos que o agente deve coletar (vírgula)</label><input value={(cfg.campos_coletar || []).join(', ')} onChange={(e) => setCfg({ campos_coletar: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="nome, telefone, tipo de negócio" style={field} /></div>
          <div><label style={lbl}>Quando transferir ao humano (handoff)</label><input value={cfg.handoff || ''} onChange={(e) => setCfg({ handoff: e.target.value })} placeholder="ex.: pediu preço fora de política, reclamação, insistência" style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Horário de atendimento</label><input value={cfg.horario || ''} onChange={(e) => setCfg({ horario: e.target.value })} placeholder="ex.: seg-sex 9h-18h" style={field} /></div>
            <div><label style={lbl}>Fila/vendedor de destino</label><input value={cfg.fila_destino || ''} onChange={(e) => setCfg({ fila_destino: e.target.value })} style={field} /></div>
          </div>
          <div><label style={lbl}>Mensagem quando indisponível</label><input value={cfg.msg_indisponivel || ''} onChange={(e) => setCfg({ msg_indisponivel: e.target.value })} style={field} /></div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={salvar} disabled={saving} style={{ padding: '10px 20px', background: '#1971c2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Salvando…' : 'Salvar agente'}</button>
            <button onClick={() => setEdit(null)} style={{ padding: '10px 20px', background: '#f1f3f5', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
          </div>
          <p style={{ fontSize: 12, color: '#adb5bd', margin: 0 }}>Ativar o agente para responder clientes é feito na tela do agente (padrão: OFF até você treinar e aprovar).</p>
        </div>
      </div>
    );
  }

  // LISTA
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Agentes de IA ({agentes.length})</h2>
        <button onClick={() => setEdit(vazio())} style={{ padding: '0.5rem 1rem', background: '#29b6ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Novo agente</button>
      </div>
      {agentes.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#adb5bd' }}>Nenhum agente ainda. Crie o primeiro.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {agentes.map((a) => {
            const st = STATUS.find((s) => s.v === (a.status || 'rascunho')) || STATUS[0];
            const obj = OBJETIVOS.find((o) => o.v === a.objetivo);
            return (
              <div key={a.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>🤖 {a.nome}</div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: st.c + '22', color: st.c }}>{st.l}</span>
                </div>
                <div style={{ fontSize: 12, color: '#868e96', margin: '4px 0 10px' }}>{obj?.l || a.funcao}</div>
                <p style={{ fontSize: 13, color: '#495057', margin: '0 0 12px', lineHeight: 1.4, maxHeight: 54, overflow: 'hidden' }}>{a.persona || 'Sem instruções.'}</p>
                <button onClick={() => setEdit({ ...vazio(), ...a, config: { ...vazio().config, ...(a.config || {}) } })} style={{ padding: '6px 14px', background: '#f1f3f5', border: '1px solid #dee2e6', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Editar</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
