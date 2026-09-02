'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

export default function PublicacoesPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await fetch('/api/content/briefs?account_id=default-account');
      if (res.ok) {
        const data = await res.json();
        const approved = Array.isArray(data.data) ? data.data.filter((b: any) => b.status === 'approved' || b.status === 'published') : [];
        setPosts(approved);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <>
      <PageHeader
        tag="PUBLICADAS"
        title="Publicações"
        subtitle="Gerencie posts publicados e agendados"
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {posts.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: '#7A8B84', margin: 0 }}>Nenhuma publicação</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                      {post.theme}
                    </h3>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#0E2A2E' }}>
                      {post.caption}
                    </p>
                  </div>
                  <span style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0, whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
