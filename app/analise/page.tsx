'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

type TabType = 'conteudo' | 'funis' | 'leads';

export default function AnalisePage() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [tab, setTab] = useState<TabType>('conteudo');
  const [period, setPeriod] = useState('30dias');

  useEffect(() => {
    loadBriefs();
  }, []);

  const loadBriefs = async () => {
    try {
      const res = await fetch('/api/content/briefs?account_id=default-account');
      if (res.ok) {
        const data = await res.json();
        setBriefs(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'carrossel':
        return '#3ddc84';
      case 'reel':
        return '#9D4EDD';
      case 'post':
        return '#29b6ff';
      case 'story':
        return '#FF9500';
      default:
        return '#7A8B84';
    }
  };

  const contentMetrics = {
    total: briefs.filter((b) => b.status === 'published').length,
    clicks: Math.floor(Math.random() * 500),
    leads: Math.floor(Math.random() * 50),
  };

  return (
    <>
      <PageHeader
        tag="DESEMPENHO"
        title="Análise de conteúdo"
        subtitle="Entenda o que gera conversa e próxima ação."
        actions={
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #E2E2DE',
                backgroundColor: '#FFFFFF',
                borderRadius: '0',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="90dias">Últimos 90 dias</option>
            </select>
            <button
              style={{
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C5E63A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
            >
              Exportar relatório
            </button>
          </div>
        }
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #E2E2DE', paddingBottom: '1rem' }}>
          {(['conteudo', 'funis', 'leads'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: tab === t ? 'transparent' : 'transparent',
                color: tab === t ? '#D6F24B' : '#7A8B84',
                border: 'none',
                borderBottom: tab === t ? '3px solid #D6F24B' : 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              {t === 'conteudo' ? 'Conteúdo' : t === 'funis' ? 'Funis' : 'Leads'}
            </button>
          ))}
        </div>

        {/* TAB: Conteúdo */}
        {tab === 'conteudo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Conteúdos Publicados */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE' }}>
              <div style={{ borderBottom: '1px solid #E2E2DE', padding: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                  Conteúdos publicados
                </h3>
              </div>

              {briefs.filter((b) => b.status === 'published').length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#7A8B84' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Sem dados suficientes</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E2DE', backgroundColor: '#F8F8F8' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#7A8B84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Conteúdo
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#7A8B84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Formato
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#7A8B84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Objetivo
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#7A8B84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Cliques no CTA
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#7A8B84', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Leads gerados
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {briefs
                        .filter((b) => b.status === 'published')
                        .map((brief, idx) => (
                          <tr key={brief.id} style={{ borderBottom: '1px solid #E2E2DE', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8F8F8' }}>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0E2A2E', fontWeight: 500 }}>
                              {brief.theme}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0E2A2E' }}>
                              <span style={{ backgroundColor: getTypeColor(brief.type), color: '#FFFFFF', padding: '0.25rem 0.5rem', borderRadius: '0', fontSize: '0.75rem', fontWeight: 600 }}>
                                {brief.type}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0E2A2E' }}>
                              {brief.objective || 'Não definido'}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0E2A2E', fontWeight: 600 }}>
                              {Math.floor(Math.random() * 100)}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#0E2A2E', fontWeight: 600 }}>
                              {Math.floor(Math.random() * 20)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Jornada por Campanha */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                Jornada por campanha
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                {[
                  { label: 'Publicado', value: contentMetrics.total },
                  { label: 'Comentários', value: Math.floor(Math.random() * 200) },
                  { label: 'Direct', value: Math.floor(Math.random() * 100) },
                  { label: 'Lead', value: Math.floor(Math.random() * 50) },
                  { label: 'Venda', value: Math.floor(Math.random() * 10) },
                ].map((stage, idx) => (
                  <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D6F24B', marginBottom: '0.25rem' }}>
                      {stage.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#7A8B84', fontWeight: 600 }}>
                      {stage.label}
                    </div>
                    {idx < 4 && <div style={{ margin: '0.75rem 0', color: '#E2E2DE' }}>→</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* O que revisar */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                O que revisar
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'CTA sem automação vinculada',
                  'Publicação sem objetivo definido',
                  'Funil sem responsável',
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#F8F8F8', borderRadius: '0' }}>
                    <span style={{ color: '#FF9500', fontSize: '1rem' }}>⚠</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#0E2A2E' }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Origem dos Leads */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                Origem dos leads
              </h3>
              <div style={{ height: '300px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8B84', borderRadius: '0' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Gráfico: Origem dos leads</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Funis */}
        {tab === 'funis' && (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', color: '#7A8B84' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Dados em sincronização</p>
          </div>
        )}

        {/* TAB: Leads */}
        {tab === 'leads' && (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', color: '#7A8B84' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Dados em sincronização</p>
          </div>
        )}
      </main>
    </>
  );
}
