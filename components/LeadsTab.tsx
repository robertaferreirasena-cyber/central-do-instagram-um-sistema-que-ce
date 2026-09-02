'use client';

import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  instagram: string;
  origem: string;
  interesse: string;
  score: number;
  status: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  resultado: string;
  criado_em: string;
}

interface Seller {
  id: string;
  nome: string;
}

interface LeadsKPI {
  total: number;
  por_origem: Record<string, number>;
  por_status: Record<string, number>;
}

const ORIGEM_OPTIONS = ['direct', 'comentario', 'story_reply', 'mencao', 'automacao'];
const STATUS_OPTIONS = ['novo', 'qualificado', 'pra-whatsapp', 'pedido', 'perdido'];

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [kpis, setKpis] = useState<LeadsKPI>({
    total: 0,
    por_origem: {},
    por_status: {},
  });
  const [loading, setLoading] = useState(false);
  const [filterOrigem, setFilterOrigem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    fetchLeads();
    fetchSellers();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const url = new URL('/api/instagram/leads', window.location.origin);
      if (filterOrigem) url.searchParams.append('origem', filterOrigem);
      if (filterStatus) url.searchParams.append('status', filterStatus);

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        setKpis(data.kpis || { total: 0, por_origem: {}, por_status: {} });
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSellers() {
    try {
      const res = await fetch('/api/instagram/sellers');
      const data = await res.json();
      if (data.success) {
        setSellers(data.sellers || []);
      }
    } catch (err) {
      console.error('Erro ao carregar vendedores:', err);
    }
  }

  async function updateLead() {
    if (!selectedLead) return;
    try {
      const res = await fetch(`/api/instagram/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        alert('Lead atualizado');
        setSelectedLead(null);
        fetchLeads();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao atualizar: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }

  async function assignSeller(leadId: string, sellerId: string) {
    try {
      const res = await fetch(`/api/instagram/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendedor_id: sellerId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }

  const filteredLeads = leads.filter((lead) => {
    if (filterOrigem && lead.origem !== filterOrigem) return false;
    if (filterStatus && lead.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>CRM de Leads</h2>
        <button
          onClick={() => fetchLeads()}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: loading ? '#ccc' : '#29b6ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
        </button>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#29b6ff' }}>{kpis.total}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Leads Totais</div>
        </div>
        {Object.entries(kpis.por_status).map(([status, count]) => (
          <div key={status} style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3ddc84' }}>{count}</div>
            <div style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>{status}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Origem</label>
          <select
            value={filterOrigem}
            onChange={(e) => {
              setFilterOrigem(e.target.value);
              fetchLeads();
            }}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="">Todas</option>
            {ORIGEM_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchLeads();
            }}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Leads */}
      {filteredLeads.length > 0 ? (
        <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Instagram</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Telefone</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Origem</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Score</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Vendedor</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{lead.nome}</strong>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {lead.instagram ? (
                      <a href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noreferrer" style={{ color: '#29b6ff' }}>
                        @{lead.instagram}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {lead.telefone ? (
                      <a href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25d366' }}>
                        {lead.telefone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{lead.origem}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#fff3cd', borderRadius: '4px' }}>
                      {lead.score}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{lead.status}</td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      defaultValue={lead.vendedor_id || ''}
                      onChange={(e) => assignSeller(lead.id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <option value="">Sem vendedor</option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setEditForm(lead);
                      }}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#29b6ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd', borderRadius: '8px' }}>
          Nenhum lead encontrado. Os funis e automações criarão leads aqui.
        </div>
      )}

      {/* Modal de Edição */}
      {selectedLead && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Editar Lead</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Interesse</label>
              <textarea
                value={editForm.interesse || ''}
                onChange={(e) => setEditForm({ ...editForm, interesse: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Score</label>
              <input
                type="number"
                value={editForm.score || 0}
                onChange={(e) => setEditForm({ ...editForm, score: parseInt(e.target.value) || 0 })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
              <select
                value={editForm.status || 'novo'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Resultado</label>
              <input
                type="text"
                value={editForm.resultado || ''}
                onChange={(e) => setEditForm({ ...editForm, resultado: e.target.value })}
                placeholder="pedido, adiado, perdido, etc"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={updateLead}
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
                Salvar
              </button>
              <button
                onClick={() => setSelectedLead(null)}
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
        </div>
      )}
    </div>
  );
}
