'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  followers?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  engagement?: number;
  posts?: Array<{
    id: string;
    reach: number;
    likes: number;
    comments: number;
  }>;
}

interface KPILeads {
  total: number;
  qualified: number;
  para_whatsapp: number;
  pedidos: number;
}

export function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    followers: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    engagement: 0,
    posts: [],
  });
  const [kpis, setKpis] = useState<KPILeads>({
    total: 0,
    qualified: 0,
    para_whatsapp: 0,
    pedidos: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Nunca');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch('/api/instagram/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics || {});
        setKpis(data.kpis || { total: 0, qualified: 0, para_whatsapp: 0, pedidos: 0 });
        setLastSync(new Date().toLocaleString('pt-BR'));
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  function KPICard({ label, value }: { label: string; value: number }) {
    return (
      <div
        style={{
          background: '#f5f5f5',
          padding: '1.5rem',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#29b6ff', marginBottom: '0.5rem' }}>
          {value.toLocaleString('pt-BR')}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>{label}</div>
      </div>
    );
  }

  const engagementRate = analytics.reach ? ((analytics.engagement || 0) / analytics.reach * 100).toFixed(2) : '0';

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Analytics do Instagram</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#999' }}>Última sincronização: {lastSync}</span>
          <button
            onClick={fetchAnalytics}
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
            {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
          </button>
        </div>
      </div>

      {/* Seção de Metrics de Conteúdo */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📊 Métricas de Conteúdo</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <KPICard label="Seguidores" value={analytics.followers || 0} />
          <KPICard label="Alcance" value={analytics.reach || 0} />
          <KPICard label="Curtidas" value={analytics.likes || 0} />
          <KPICard label="Comentários" value={analytics.comments || 0} />
          <KPICard label="Salvos" value={analytics.saves || 0} />
          <div
            style={{
              background: '#f5f5f5',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3ddc84', marginBottom: '0.5rem' }}>
              {engagementRate}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Taxa de Engajamento</div>
          </div>
        </div>
      </div>

      {/* Seção de KPIs de Leads */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📈 KPIs de Leads & Conversão</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <KPICard label="Leads Totais" value={kpis.total} />
          <KPICard label="Leads Qualificados" value={kpis.qualified} />
          <KPICard label="Para WhatsApp" value={kpis.para_whatsapp} />
          <KPICard label="Pedidos" value={kpis.pedidos} />
        </div>
      </div>

      {/* Seção de Top Posts */}
      <div>
        <h3 style={{ marginBottom: '1rem' }}>🔝 Top Posts por Alcance</h3>
        {analytics.posts && analytics.posts.length > 0 ? (
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Post ID</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Alcance</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Curtidas</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Comentários</th>
                </tr>
              </thead>
              <tbody>
                {analytics.posts.slice(0, 10).map((post, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>{post.id.slice(0, 15)}...</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{post.reach.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{post.likes.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{post.comments.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd', borderRadius: '8px' }}>
            Nenhum dado de posts. Sincronize os dados do Zernio.
          </div>
        )}
      </div>
    </div>
  );
}
