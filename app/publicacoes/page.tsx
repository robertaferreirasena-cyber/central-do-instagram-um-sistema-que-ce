'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TENANT_TEXT } from '@/lib/tenant';

export default function PublicacoesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
    loadConnections();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await fetch(`/api/content/briefs?account_id=${TENANT_TEXT}`);
      if (res.ok) {
        const data = await res.json();
        const all = Array.isArray(data.data) ? data.data : [];
        setPosts(all);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/publora/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'carrossel':
        return { bg: '#E6F5D6', text: '#2D7A1F' };
      case 'reel':
        return { bg: '#F0E6F5', text: '#6B2D7A' };
      case 'post':
        return { bg: '#E6EDF5', text: '#2D4D7A' };
      case 'story':
        return { bg: '#F5EDE6', text: '#7A5B2D' };
      default:
        return { bg: '#F0F0F0', text: '#7A8B84' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return { bg: '#E6F5D6', text: '#2D7A1F', label: 'Publicada' };
      case 'scheduled':
        return { bg: '#E6EDF5', text: '#2D4D7A', label: 'Agendada' };
      case 'revision':
        return { bg: '#FFF4E6', text: '#7A5B2D', label: 'Em revisão' };
      case 'draft':
        return { bg: '#F0F0F0', text: '#7A8B84', label: 'Rascunho' };
      default:
        return { bg: '#F0F0F0', text: '#7A8B84', label: status };
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'published') return p.status === 'published';
    if (filter === 'scheduled') return p.status === 'scheduled';
    if (filter === 'draft') return p.status === 'draft' || p.status === 'revision';
    return true;
  });

  return (
    <>
      <PageHeader
        tag="BIBLIOTECA"
        title="Publicações"
        subtitle="Gerencie posts publicados, agendados e em rascunho"
      />

      <main style={{ padding: '2rem', flex: 1, overflow: 'auto', width: '100%' }}>
        {/* Contas Conectadas */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
            Contas conectadas
          </h3>
          {connections.length === 0 ? (
            <p style={{ color: '#7A8B84', fontSize: '0.875rem', margin: 0 }}>Nenhuma conta conectada na Publora</p>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {connections.map((conn) => (
                <div key={conn.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F8F8F8', padding: '0.75rem 1rem', borderRadius: '0' }}>
                  <span style={{ fontSize: '1rem' }}>
                    {conn.platform === 'instagram' ? '📷' : conn.platform === 'tiktok' ? '🎵' : conn.platform === 'youtube' ? '▶️' : '📱'}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>@{conn.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {(['all', 'published', 'scheduled', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filter === f ? '#0E2A2E' : '#FFFFFF',
                color: filter === f ? '#FAFAF8' : '#0E2A2E',
                border: '1px solid #E2E2DE',
                borderRadius: '0',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.backgroundColor = '#F8F8F8';
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }
              }}
            >
              {f === 'all' ? 'Todas' : f === 'published' ? 'Publicadas' : f === 'scheduled' ? 'Agendadas' : 'Rascunhos'}
            </button>
          ))}
        </div>

        {/* Lista de Publicações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPosts.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#7A8B84', margin: 0, fontSize: '0.875rem' }}>Nenhuma publicação encontrada</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const typeColors = getTypeColor(post.type);
              const statusInfo = getStatusColor(post.status);

              return (
                <div key={post.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  {/* Thumbnail placeholder */}
                  <div style={{ width: '100px', height: '100px', backgroundColor: '#E8E8E4', borderRadius: '0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#7A8B84', fontWeight: 600 }}>
                    Thumb
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                        {post.theme}
                      </h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ ...statusInfo, backgroundColor: statusInfo.bg, color: statusInfo.text, padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {statusInfo.label}
                        </span>
                        <span style={{ ...typeColors, backgroundColor: typeColors.bg, color: typeColors.text, padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {post.type}
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#0E2A2E', lineHeight: 1.5 }}>
                      {post.caption || 'Sem descrição'}
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#7A8B84' }}>
                      {post.scheduled_at && (
                        <div>
                          <span style={{ fontWeight: 600 }}>Agendado para:</span> {new Date(post.scheduled_at).toLocaleString('pt-BR')}
                        </div>
                      )}
                      {post.published_at && (
                        <div>
                          <span style={{ fontWeight: 600 }}>Publicado em:</span> {new Date(post.published_at).toLocaleString('pt-BR')}
                        </div>
                      )}
                      {post.publora_url && (
                        <a
                          href={post.publora_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#D6F24B',
                            textDecoration: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          Ver na Publora →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Menu */}
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#7A8B84',
                      padding: '0',
                      transition: 'color 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#0E2A2E'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#7A8B84'; }}
                  >
                    ⋮
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </>
  );
}
