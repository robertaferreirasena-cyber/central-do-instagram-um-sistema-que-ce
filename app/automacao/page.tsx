'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

export default function AutomacaoPage() {
  const [automacoes, setAutomacoes] = useState<any[]>([]);

  useEffect(() => {
    loadAutomacoes();
  }, []);

  const loadAutomacoes = async () => {
    try {
      const res = await fetch('/api/instagram/automacao');
      if (res.ok) {
        const data = await res.json();
        setAutomacoes(data.data ? (Array.isArray(data.data) ? data.data : []) : []);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <>
      <PageHeader
        tag="FLUXOS"
        title="Automação"
        subtitle="Crie e gerencie fluxos automáticos de atendimento"
        actions={
          <button style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
            + Nova automação
          </button>
        }
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {automacoes.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ color: '#7A8B84', margin: 0 }}>Nenhuma automação configurada</p>
            </div>
          ) : (
            automacoes.map((auto) => (
              <div key={auto.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                    {auto.nome}
                  </h3>
                  <span style={{ backgroundColor: auto.ativo ? '#D6F24B' : '#E2E2DE', color: auto.ativo ? '#0E2A2E' : '#7A8B84', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0 }}>
                    {auto.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#7A8B84' }}>
                  Disparos: {auto.disparos || 0} | Leads: {auto.leads_criados || 0}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
