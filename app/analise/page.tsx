'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

export default function AnalisePage() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/instagram/analytics?account_id=default-account');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <>
      <PageHeader
        tag="DESEMPENHO"
        title="Análise"
        subtitle="Acompanhe métricas e atribuição de leads"
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Posts publicados', value: '0', icon: '📱' },
            { label: 'Followers', value: '0', icon: '👥' },
            { label: 'Leads gerados', value: '0', icon: '🎯' },
            { label: 'Taxa de conversão', value: '0%', icon: '📈' },
          ].map((metric, idx) => (
            <div key={idx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
                    {metric.label}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 900, color: '#0E2A2E' }}>
                    {metric.value}
                  </p>
                </div>
                <span style={{ fontSize: '1.5rem' }}>{metric.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico placeholder */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
            Desempenho mensal
          </h3>
          <div style={{ height: '300px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8B84' }}>
            <p style={{ margin: 0 }}>Dados de desempenho do Supabase</p>
          </div>
        </div>
      </main>
    </>
  );
}
