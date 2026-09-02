'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';

interface UpcomingPost {
  id: string;
  theme: string;
  type: string;
  scheduled_at: string;
  status: string;
}

interface Conversation {
  id: string;
  lead_name: string;
  last_message: string;
  updated_at: string;
}

interface Funnel {
  id: string;
  name: string;
  status: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [pendingReview, setPendingReview] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load upcoming posts
      const briefsRes = await fetch('/api/content/briefs?account_id=default-account');
      if (briefsRes.ok) {
        const data = await briefsRes.json();
        const briefs = Array.isArray(data.data) ? data.data : [];
        const scheduled = briefs
          .filter((b: any) => b.scheduled_at && b.status !== 'draft')
          .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 5);
        setUpcomingPosts(scheduled);

        const pending = briefs.filter((b: any) => b.status === 'pending_approval' || b.status === 'pending_review').slice(0, 3);
        setPendingReview(pending);
      }

      // Load conversations
      const convRes = await fetch('/api/instagram/conversa-atendimento?account_id=default-account');
      if (convRes.ok) {
        const data = await convRes.json();
        const convs = Array.isArray(data.data) ? data.data : [];
        setConversationCount(convs.length);
        setConversations(convs.slice(0, 3));
      }

      // Load funnels
      const funnelsRes = await fetch('/api/instagram/funnels?account_id=default-account');
      if (funnelsRes.ok) {
        const data = await funnelsRes.json();
        const funns = Array.isArray(data.data) ? data.data : [];
        setFunnels(funns.slice(0, 4));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyCalendar = () => {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][d.getDay() === 0 ? 6 : d.getDay() - 1];
      const count = upcomingPosts.filter(
        (p) => new Date(p.scheduled_at).toDateString() === d.toDateString()
      ).length;
      days.push({ day: dayName, date: d.getDate(), count });
    }
    return days;
  };

  const weeklyCalendar = getWeeklyCalendar();

  return (
    <>
      <PageHeader
        tag="CENTRAL DE MARKETING"
        title="O que precisa da sua atenção hoje"
        actions={
          <Link href="/conteudo" style={{ textDecoration: 'none' }}>
            <button style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              + Criar publicação
            </button>
          </Link>
        }
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Próximas publicações */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', borderRadius: 0, padding: '1.5rem', gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>📅 Próximas publicações</h3>
              <Link href="/calendario" style={{ fontSize: '0.75rem', color: '#D6F24B', textDecoration: 'none', fontWeight: 600 }}>
                Ver calendário
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingPosts.length === 0 ? (
                <p style={{ color: '#7A8B84', fontSize: '0.875rem', margin: 0 }}>Nenhuma publicação agendada</p>
              ) : (
                upcomingPosts.map((post) => (
                  <div key={post.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#E2E2DE', borderRadius: 0, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#0E2A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.theme}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                        <span style={{ backgroundColor: '#0E2A2E', color: '#FAFAF8', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0 }}>
                          {post.type}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#7A8B84' }}>
                          {new Date(post.scheduled_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <span style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Agendada
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Revisão pendente */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', borderRadius: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>👁️ Revisão pendente</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingReview.length === 0 ? (
                <p style={{ color: '#7A8B84', fontSize: '0.875rem', margin: 0 }}>Nenhuma revisão pendente</p>
              ) : (
                pendingReview.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9999px', backgroundColor: '#D6F24B', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#0E2A2E' }}>
                        {item.created_by || 'Usuário'}
                      </p>
                    </div>
                    <span style={{ backgroundColor: '#FFE6CC', color: '#8B6B2D', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0 }}>
                      Aguardando
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversas aguardando resposta */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', borderRadius: 0, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>
                💬 Conversas {conversationCount > 0 && <span style={{ fontSize: '0.875rem', color: '#D6F24B', marginLeft: '0.5rem', backgroundColor: '#0E2A2E', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>({conversationCount})</span>}
              </h3>
              <Link href="/inbox" style={{ fontSize: '0.75rem', color: '#D6F24B', textDecoration: 'none', fontWeight: 600 }}>
                Ver todas
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {conversationCount === 0 ? (
                <p style={{ color: '#7A8B84', fontSize: '0.875rem', margin: 0 }}>Nenhuma conversa</p>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9999px', backgroundColor: '#E2E2DE', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#0E2A2E' }}>
                        {conv.lead_name || 'Contato'}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#7A8B84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_message || 'Sem mensagens'}
                      </p>
                    </div>
                    <span style={{ backgroundColor: '#E8F0FF', color: '#0E2A2E', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Direct
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Funis ativos */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', borderRadius: 0, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>🎯 Funis ativos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {funnels.length === 0 ? (
                <p style={{ color: '#7A8B84', fontSize: '0.875rem', margin: 0 }}>Nenhum funil configurado</p>
              ) : (
                funnels.map((funnel) => (
                  <div key={funnel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#0E2A2E' }}>
                      {funnel.name}
                    </p>
                    <span style={{ backgroundColor: funnel.status === 'active' || funnel.status === 'Ativo' ? '#D6F24B' : '#E2E2DE', color: funnel.status === 'active' || funnel.status === 'Ativo' ? '#0E2A2E' : '#7A8B84', padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, borderRadius: 0 }}>
                      {funnel.status === 'active' ? 'Ativo' : 'Em pausa'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calendário semanal */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', borderRadius: 0, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0E2A2E' }}>📊 Calendário</h3>
              <Link href="/calendario" style={{ fontSize: '0.75rem', color: '#D6F24B', textDecoration: 'none', fontWeight: 600 }}>
                Ver completo
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {weeklyCalendar.map((day, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.65rem', fontWeight: 600, color: '#7A8B84', textTransform: 'uppercase' }}>
                    {day.day}
                  </p>
                  <div style={{ backgroundColor: day.count > 0 ? '#D6F24B' : '#E2E2DE', color: day.count > 0 ? '#0E2A2E' : '#7A8B84', padding: '0.75rem 0.5rem', borderRadius: 0, textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                      {day.date}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.65rem', opacity: 0.8 }}>
                      {day.count} item
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
