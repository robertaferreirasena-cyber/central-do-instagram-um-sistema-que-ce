'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/instagram/conversa-atendimento?account_id=default-account');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <>
      <PageHeader
        tag="ATENDIMENTO"
        title="Inbox"
        subtitle="Gerencie conversas com seus clientes"
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Lista de conversas */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', height: 'fit-content', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#7A8B84' }}>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma conversa</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderBottom: '1px solid #E2E2DE',
                  backgroundColor: selectedId === conv.id ? '#F0F0F0' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== conv.id) {
                    e.currentTarget.style.backgroundColor = '#F8F8F8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== conv.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#D6F24B', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.lead_name || 'Contato'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#7A8B84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message || 'Sem mensagens'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detalhes da conversa */}
        {selectedId ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
              Conversa selecionada
            </h3>
            <p style={{ color: '#7A8B84', margin: 0, fontSize: '0.875rem' }}>
              Detalhes carregados do Supabase
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#7A8B84', margin: 0 }}>Selecione uma conversa para começar</p>
          </div>
        )}
      </main>
    </>
  );
}
