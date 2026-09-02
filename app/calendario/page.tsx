'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

export default function CalendarioPage() {
  const [briefs, setBriefs] = useState<any[]>([]);

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

  const scheduledBriefs = briefs
    .filter((b: any) => b.scheduled_at && b.status !== 'draft')
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <>
      <PageHeader
        tag="PLANEJAMENTO"
        title="Calendário de Conteúdo"
        subtitle="Visualize e gerencie suas publicações agendadas"
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {scheduledBriefs.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: '#7A8B84', margin: 0 }}>Nenhum conteúdo agendado</p>
            </div>
          ) : (
            scheduledBriefs.map((brief) => (
              <div key={brief.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                      {brief.theme}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#7A8B84' }}>
                      {new Date(brief.scheduled_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0 }}>
                    {brief.type}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0E2A2E', lineHeight: 1.5 }}>
                  {brief.caption}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
