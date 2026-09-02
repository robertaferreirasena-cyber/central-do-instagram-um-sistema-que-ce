'use client';

import { useState, useEffect } from 'react';

const ONDE_OPTIONS = [
  { value: 'comentario', label: 'Comentário' },
  { value: 'story_reply', label: 'Resposta ao Story' },
  { value: 'dm', label: 'Direct Message' },
];

const MATCH_TIPO_OPTIONS = [
  { value: 'contem', label: 'Contém' },
  { value: 'exata', label: 'Exata' },
  { value: 'comeca', label: 'Começa com' },
];

const DESTINO_OPTIONS = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'agente', label: 'Agente' },
];

interface IgAutomacao {
  id: number;
  nome: string;
  formato: string;
  onde: string;
  gatilho: string;
  resposta_comentario: string;
  resposta_dm: string;
  media_id?: string;
  match_tipo: string;
  ativo: boolean;
  disparos: number;
  leads_criados: number;
  destino: string;
  tags: string;
  delay_seg: number;
  dm_media_url?: string;
  testado: boolean;
  botoes?: Array<{ id?: number; label: string; resposta: string; url?: string; tipo: string }>;
}

export default function InstagramPage() {
  const [tab, setTab] = useState('automacao');
  const [automacoes, setAutomacoes] = useState<IgAutomacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nome: '',
    formato: 'qualquer',
    onde: 'comentario',
    gatilho: '',
    resposta_comentario: '',
    resposta_dm: '',
    media_id: '',
    match_tipo: 'contem',
    ativo: false,
    destino: 'nenhum',
    tags: '',
    delay_seg: 0,
    dm_media_url: '',
    testado: false,
    botoes: [
      { label: '', resposta: '', url: undefined, tipo: 'quick' },
      { label: '', resposta: '', url: undefined, tipo: 'quick' },
    ] as Array<{ label: string; resposta: string; url?: string; tipo: string }>,
  });

  // Carregar automações
  useEffect(() => {
    fetchAutomacoes();
  }, []);

  async function fetchAutomacoes() {
    setLoading(true);
    try {
      const res = await fetch('/api/instagram/automacao');
      const data = await res.json();
      if (data.success) {
        setAutomacoes(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar automações:', err);
    } finally {
      setLoading(false);
    }
  }

  async function salvarAutomacao() {
    if (!form.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/instagram/automacao?id=${editingId}`
        : '/api/instagram/automacao';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          delay_seg: parseInt(String(form.delay_seg)) || 0,
          botoes: form.botoes.filter((b) => b.label.trim()),
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(editingId ? 'Automação atualizada' : 'Automação criada');
        resetForm();
        fetchAutomacoes();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }

  function resetForm() {
    setForm({
      nome: '',
      formato: 'qualquer',
      onde: 'comentario',
      gatilho: '',
      resposta_comentario: '',
      resposta_dm: '',
      media_id: '',
      match_tipo: 'contem',
      ativo: false,
      destino: 'nenhum',
      tags: '',
      delay_seg: 0,
      dm_media_url: '',
      testado: false,
      botoes: [
        { label: '', resposta: '', url: undefined, tipo: 'quick' },
        { label: '', resposta: '', url: undefined, tipo: 'quick' },
      ] as Array<{ label: string; resposta: string; url?: string; tipo: string }>,
    });
    setEditingId(null);
  }

  function editarAutomacao(auto: IgAutomacao) {
    setForm({
      nome: auto.nome,
      formato: auto.formato,
      onde: auto.onde,
      gatilho: auto.gatilho,
      resposta_comentario: auto.resposta_comentario,
      resposta_dm: auto.resposta_dm,
      media_id: auto.media_id || '',
      match_tipo: auto.match_tipo,
      ativo: auto.ativo,
      destino: auto.destino,
      tags: auto.tags,
      delay_seg: auto.delay_seg,
      dm_media_url: auto.dm_media_url || '',
      testado: auto.testado,
      botoes: auto.botoes || [
        { label: '', resposta: '', url: '', tipo: 'quick' },
        { label: '', resposta: '', url: '', tipo: 'quick' },
      ],
    });
    setEditingId(auto.id);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Central do Instagram — Automações</h1>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
        {[
          { id: 'automacao', label: 'Automação' },
          { id: 'conteudo', label: 'Conteúdo' },
          { id: 'conversas', label: 'Conversas' },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setTab(aba.id)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: tab === aba.id ? '#29b6ff' : 'transparent',
              color: tab === aba.id ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Aba Automação */}
      {tab === 'automacao' && (
        <div>
          {/* Lista de automações */}
          <div style={{ marginBottom: '3rem' }}>
            <h2>Automações ({automacoes.length})</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : automacoes.length === 0 ? (
              <p style={{ color: '#999' }}>Nenhuma automação criada</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {automacoes.map((auto) => (
                  <div
                    key={auto.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{auto.nome}</h3>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: auto.ativo ? '#3ddc84' : '#ccc',
                          color: '#fff',
                        }}
                      >
                        {auto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Onde:</strong> {ONDE_OPTIONS.find((o) => o.value === auto.onde)?.label}
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Gatilho:</strong> {auto.gatilho || 'Qualquer'}
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Disparos:</strong> {auto.disparos} · <strong>Leads:</strong> {auto.leads_criados}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => editarAutomacao(auto)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          background: '#29b6ff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          background: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Testar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Criador/Editor */}
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '2rem', backgroundColor: '#fff' }}>
            <h2>{editingId ? 'Editar' : 'Nova'} Automação</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Lado esquerdo - Formulário */}
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Formato</label>
                  <select
                    value={form.formato}
                    onChange={(e) => setForm({ ...form, formato: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="qualquer">Qualquer publicação</option>
                    <option value="post">Post (feed)</option>
                    <option value="reels">Reels</option>
                    <option value="stories">Stories</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Onde dispara *</label>
                  <select
                    value={form.onde}
                    onChange={(e) => setForm({ ...form, onde: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {ONDE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correspondência</label>
                  <select
                    value={form.match_tipo}
                    onChange={(e) => setForm({ ...form, match_tipo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {MATCH_TIPO_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Palavra-chave (separe por vírgula)</label>
                  <input
                    type="text"
                    value={form.gatilho}
                    onChange={(e) => setForm({ ...form, gatilho: e.target.value })}
                    placeholder="oi, olá, preciso de help"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>Vazio = responde a qualquer interação</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Resposta Pública (comentário)</label>
                  <textarea
                    value={form.resposta_comentario}
                    onChange={(e) => setForm({ ...form, resposta_comentario: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      minHeight: '80px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Resposta no Direct</label>
                  <textarea
                    value={form.resposta_dm}
                    onChange={(e) => setForm({ ...form, resposta_dm: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      minHeight: '80px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Botões (até 2)</label>
                  {form.botoes.slice(0, 2).map((botao, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid #eee', borderRadius: '4px' }}>
                      <input
                        type="text"
                        placeholder="Label"
                        value={botao.label}
                        onChange={(e) => {
                          const novos = [...form.botoes];
                          novos[idx].label = e.target.value;
                          setForm({ ...form, botoes: novos });
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="URL (deixar vazio = quick reply)"
                        value={botao.url || ''}
                        onChange={(e) => {
                          const novos = [...form.botoes];
                          novos[idx].url = e.target.value;
                          novos[idx].tipo = e.target.value ? 'link' : 'quick';
                          setForm({ ...form, botoes: novos });
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Destino</label>
                  <select
                    value={form.destino}
                    onChange={(e) => setForm({ ...form, destino: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {DESTINO_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Delay (segundos)</label>
                  <input
                    type="number"
                    value={form.delay_seg}
                    onChange={(e) => setForm({ ...form, delay_seg: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="tag1, tag2"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    />
                    <span>Ativo</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={salvarAutomacao}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#29b6ff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {editingId ? '✏️ Atualizar' : '✅ Publicar'}
                  </button>
                  <button
                    onClick={() => {
                      resetForm();
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Lado direito - Preview */}
              <div style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>Preview de Celular</h3>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    background: '#fff',
                    borderRadius: '16px',
                    border: '8px solid #000',
                    overflow: 'hidden',
                    margin: '0 auto',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '9/16',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1rem',
                      fontSize: '0.75rem',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: 0, color: '#666', fontSize: '0.7rem' }}>Automação: {form.nome || '(sem nome)'}</p>
                    </div>

                    {form.onde === 'comentario' && (
                      <>
                        <div
                          style={{
                            background: '#f0f0f0',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginBottom: '0.5rem',
                            wordWrap: 'break-word',
                          }}
                        >
                          <strong>Gatilho:</strong> {form.gatilho || 'qualquer'}
                        </div>
                        <div
                          style={{
                            background: '#e3f2fd',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginBottom: '0.5rem',
                            wordWrap: 'break-word',
                          }}
                        >
                          <strong>Resposta pública:</strong> {form.resposta_comentario || '(vazia)'}
                        </div>
                      </>
                    )}

                    {(form.onde === 'comentario' || form.onde === 'story_reply') && (
                      <>
                        <div
                          style={{
                            background: '#f3e5f5',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginBottom: '0.5rem',
                            wordWrap: 'break-word',
                          }}
                        >
                          <strong>DM:</strong> {form.resposta_dm || '(vazia)'}
                        </div>
                        {form.botoes.filter((b) => b.label).map((botao, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: botao.url ? '#c8e6c9' : '#fff9c4',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              marginBottom: '0.25rem',
                              border: '1px solid #ccc',
                              wordWrap: 'break-word',
                            }}
                          >
                            👉 {botao.label}
                            {botao.url && `: ${botao.url}`}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outras abas (placeholder) */}
      {tab !== 'automacao' && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          Aba "{tab}" em desenvolvimento...
        </div>
      )}
    </div>
  );
}
