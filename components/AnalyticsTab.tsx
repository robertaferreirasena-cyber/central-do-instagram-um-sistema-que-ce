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

interface MediaPost {
  id: number;
  external_media_id: string;
  tipo: string;
  permalink: string;
  caption: string;
  thumbnail_url: string;
  media_url: string;
  publicado_em: string;
  alcance: number;
  curtidas: number;
  comentarios: number;
  salvos: number;
  ig_produto: string;
  origem_dados: string;
}

type TabType = 'overview' | 'conteudo';

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
  const [mediaPosts, setMediaPosts] = useState<MediaPost[]>([]);
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [syncingContent, setSyncingContent] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Nunca');

  useEffect(() => {
    fetchAnalytics();
    fetchMediaPosts();
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

  async function fetchMediaPosts() {
    try {
      const res = await fetch('/api/instagram/content?limit=50');
      const data = await res.json();
      if (data.success && data.data) {
        setMediaPosts(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar posts de mídia:', err);
    }
  }

  async function handleSyncContent() {
    setSyncingContent(true);
    try {
      const res = await fetch('/api/zernio/sync-content', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Re-fetch analytics e posts após sync
        await fetchAnalytics();
        await fetchMediaPosts();
        setLastSync(new Date().toLocaleString('pt-BR'));
      } else {
        alert(`Erro na sincronização: ${data.error}`);
      }
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      alert('Erro ao sincronizar conteúdo');
    } finally {
      setSyncingContent(false);
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
            {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar dados'}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
        <button
          onClick={() => setCurrentTab('overview')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            fontWeight: currentTab === 'overview' ? 'bold' : 'normal',
            color: currentTab === 'overview' ? '#29b6ff' : '#999',
            cursor: 'pointer',
            paddingBottom: '0.5rem',
            borderBottom: currentTab === 'overview' ? '2px solid #29b6ff' : 'none',
          }}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setCurrentTab('conteudo')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            fontWeight: currentTab === 'conteudo' ? 'bold' : 'normal',
            color: currentTab === 'conteudo' ? '#29b6ff' : '#999',
            cursor: 'pointer',
            paddingBottom: '0.5rem',
            borderBottom: currentTab === 'conteudo' ? '2px solid #29b6ff' : 'none',
          }}
        >
          Conteúdos publicados
        </button>
      </div>

      {currentTab === 'overview' && (
        <>
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
        </>
      )}

      {currentTab === 'conteudo' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0 }}>📸 Conteúdos publicados</h3>
            <button
              onClick={handleSyncContent}
              disabled={syncingContent}
              style={{
                padding: '0.5rem 1rem',
                background: syncingContent ? '#ccc' : '#3ddc84',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: syncingContent ? 'not-allowed' : 'pointer',
              }}
            >
              {syncingContent ? '⏳ Sincronizando...' : '🔄 Sincronizar conteúdo'}
            </button>
          </div>

          {mediaPosts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {mediaPosts.map((post) => (
                <div
                  key={post.external_media_id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  {post.thumbnail_url && (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || 'Post'}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>
                      {post.ig_produto} • {post.tipo}
                    </div>
                    <div style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#333', lineHeight: '1.4' }}>
                      {post.caption ? post.caption.slice(0, 100) + (post.caption.length > 100 ? '...' : '') : 'Sem legenda'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div>📊 Alcance: {post.alcance.toLocaleString('pt-BR')}</div>
                      <div>❤️ Curtidas: {post.curtidas.toLocaleString('pt-BR')}</div>
                      <div>💬 Comentários: {post.comentarios.toLocaleString('pt-BR')}</div>
                      <div>🔖 Salvos: {post.salvos.toLocaleString('pt-BR')}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.75rem' }}>
                      {new Date(post.publicado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#999', border: '1px solid #ddd', borderRadius: '8px' }}>
              <div style={{ fontSize: '1rem', marginBottom: '1rem' }}>📭 Nenhum conteúdo encontrado</div>
              <div style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Clique no botão acima para sincronizar seus posts, reels e stories do Instagram.</div>
              <button
                onClick={handleSyncContent}
                disabled={syncingContent}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: syncingContent ? '#ccc' : '#3ddc84',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: syncingContent ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {syncingContent ? '⏳ Sincronizando...' : '🔄 Sincronizar conteúdo'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
