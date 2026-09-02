'use client';

import { useState, useEffect } from 'react';

interface AttributionEvent {
  id: string;
  lead_id: string;
  lead_nome: string;
  content_brief_id?: string;
  campaign_id?: string;
  campaign_nome?: string;
  automation_id?: number;
  automation_nome?: string;
  funnel_id?: string;
  funnel_nome?: string;
  order_id: string;
  hora: string;
}

interface AttributionSummary {
  total_events: number;
  por_fonte: Record<string, number>;
  por_resultado: Record<string, number>;
}

export function AttributionTab() {
  const [events, setEvents] = useState<AttributionEvent[]>([]);
  const [summary, setSummary] = useState<AttributionSummary>({
    total_events: 0,
    por_fonte: {},
    por_resultado: {},
  });
  const [loading, setLoading] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchAttributionEvents();
  }, []);

  async function fetchAttributionEvents() {
    setLoading(true);
    try {
      const url = new URL('/api/instagram/attribution', window.location.origin);
      if (filterSource) url.searchParams.append('source', filterSource);
      if (dateRange.from) url.searchParams.append('from', dateRange.from);
      if (dateRange.to) url.searchParams.append('to', dateRange.to);

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
        setSummary(data.summary || { total_events: 0, por_fonte: {}, por_resultado: {} });
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setDateRange({ ...dateRange, [field]: value });
  };

  const FONTE_OPTIONS = ['campanha', 'automacao', 'funil', 'direto', 'comentario', 'story_reply'];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Attribution & Rastreamento de Conversão</h2>
        <button
          onClick={fetchAttributionEvents}
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

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#29b6ff' }}>{summary.total_events}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Eventos Totais</div>
        </div>

        {Object.entries(summary.por_fonte).map(([fonte, count]) => (
          <div key={fonte} style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3ddc84' }}>{count}</div>
            <div style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
              {fonte === 'campanha' ? '📢' : fonte === 'automacao' ? '🤖' : fonte === 'funil' ? '🔗' : '📌'} {fonte}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Fonte</label>
          <select
            value={filterSource}
            onChange={(e) => {
              setFilterSource(e.target.value);
            }}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="">Todas</option>
            {FONTE_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Data Início</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => handleDateChange('from', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Data Fim</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => handleDateChange('to', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={fetchAttributionEvents}
            style={{
              padding: '0.5rem 1rem',
              background: '#3ddc84',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            🔍 Filtrar
          </button>
        </div>
      </div>

      {/* Tabela de Eventos */}
      {events.length > 0 ? (
        <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Lead</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Campanha</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Automação</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Funil</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Pedido</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong>{event.lead_nome}</strong>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {event.campaign_nome ? (
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#e8f5e9', borderRadius: '4px', fontSize: '0.75rem' }}>
                        📢 {event.campaign_nome}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {event.automation_nome ? (
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#f3e5f5', borderRadius: '4px', fontSize: '0.75rem' }}>
                        🤖 {event.automation_nome}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {event.funnel_nome ? (
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#e3f2fd', borderRadius: '4px', fontSize: '0.75rem' }}>
                        🔗 {event.funnel_nome}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {event.order_id ? (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#fff3cd', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        #{event.order_id}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#666' }}>
                    {new Date(event.hora).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd', borderRadius: '8px' }}>
          Nenhum evento de atribuição. Os leads progredirão por funis e geradores de conversão registrarão eventos aqui.
        </div>
      )}

      {/* Nota de Documentação */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#ecf0f1', borderRadius: '8px', fontSize: '0.875rem', color: '#555' }}>
        <strong>📊 Como funciona:</strong>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
          <li>Cada evento rastreia como um lead avançou por campanhas, automações e funis</li>
          <li>Attribution visual mostra a jornada completa de um lead até a conversão</li>
          <li>Use para otimizar canais de maior ROI e estudar padrões de conversão</li>
        </ul>
      </div>
    </div>
  );
}
