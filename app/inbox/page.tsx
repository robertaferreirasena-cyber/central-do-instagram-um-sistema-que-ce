'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TENANT_TEXT } from '@/lib/tenant';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'needs_human'>('all');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isMessageInputFocused, setIsMessageInputFocused] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const focusRef = useRef(false);

  // Auto-scroll para o fim quando novas mensagens chegam
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar conversas
  const loadConversations = async () => {
    try {
      const res = await fetch(`/api/instagram/conversa-atendimento?account_id=${TENANT_TEXT}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Sincronizar conversa com Zernio (throttle no servidor)
  const syncConversation = async (conversationId: string, force = false) => {
    if (!conversationId || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/zernio/sync-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, force }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Sync result:', data.data);
      }
    } catch (error) {
      console.error('Erro ao sincronizar conversa:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/instagram/messages?conversation_id=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    }
  };

  // Sincronizar ao selecionar conversa (não bloqueia a UI)
  useEffect(() => {
    if (selectedId) {
      // Carrega mensagens locais imediatamente
      loadMessages(selectedId);
      // Sincroniza com Zernio em background
      syncConversation(selectedId);
    }
  }, [selectedId]);

  // Mantém refs atualizadas pro interval ler sem recriar o timer
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { focusRef.current = isMessageInputFocused; }, [isMessageInputFocused]);

  // Auto-refresh a cada 15s (pausa se campo em foco) — criado UMA vez
  useEffect(() => {
    loadConversations(); // Carrega uma vez ao montar

    autoRefreshIntervalRef.current = setInterval(async () => {
      if (focusRef.current) return; // pausa enquanto está digitando
      await loadConversations();
      const sid = selectedIdRef.current;
      if (sid) {
        await syncConversation(sid);
        await loadMessages(sid);
      }
    }, 15000); // 15 segundos

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredConversations = conversations.filter((conv) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'mine' && (conv.is_assigned || conv.agente_id)) ||
      (filter === 'needs_human' && conv.estado === 'aguardando_humano');
    const nome = (conv.participant_name || conv.participant_username || '').toLowerCase();
    const matchesSearch = !search || nome.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleSendMessage = async (text: string) => {
    if (!selectedId || !text.trim()) return;
    try {
      await fetch('/api/instagram/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedId,
          text,
          is_outgoing: true,
        }),
      });
      await loadMessages(selectedId);
    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  };

  return (
    <>
      <PageHeader
        tag="ATENDIMENTO"
        title="Inbox e leads"
        subtitle="Converse, qualifique e encaminhe no mesmo lugar."
        actions={
          <button
            style={{
              backgroundColor: '#D6F24B',
              color: '#0E2A2E',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C5E63A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
          >
            Assumir conversa
          </button>
        }
      />

      <main style={{ padding: '2rem', flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '320px 1fr 300px', gap: '2rem', width: '100%' }}>
        {/* COLUNA ESQUERDA: Filtros e Lista de Conversas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content', maxHeight: 'calc(100vh - 200px)' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'mine', 'needs_human'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  backgroundColor: filter === f ? '#0E2A2E' : '#FFFFFF',
                  color: filter === f ? '#FAFAF8' : '#0E2A2E',
                  border: '1px solid #E2E2DE',
                  borderRadius: '0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                {f === 'all' ? 'Todas' : f === 'mine' ? 'Minha fila' : 'Precisa de humano'}
              </button>
            ))}
          </div>

          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #E2E2DE',
              backgroundColor: '#FFFFFF',
              borderRadius: '0',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />

          {/* Lista de Conversas */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E2DE',
            overflow: 'auto',
            flex: 1,
          }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#7A8B84' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma conversa</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
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
                    <div style={{ width: '36px', height: '36px', borderRadius: '9999px', backgroundColor: '#D6F24B', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.participant_name || conv.participant_username || 'Contato'}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#7A8B84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '1.2em' }}>
                        {conv.last_message || 'Sem mensagens'}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.65rem' }}>
                        <span style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.125rem 0.375rem', fontWeight: 600 }}>
                          {conv.origem === 'comment' ? 'Comentário' : 'Direct'}
                        </span>
                        <span style={{ color: '#7A8B84' }}>
                          {conv.updated_time ? new Date(conv.updated_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Rodapé: Contagem */}
          <div style={{ fontSize: '0.75rem', color: '#7A8B84', textAlign: 'center', paddingTop: '0.5rem' }}>
            {filteredConversations.length} conversa{filteredConversations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* COLUNA CENTRAL: Thread de Mensagens */}
        {selectedConversation ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #E2E2DE', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9999px', backgroundColor: '#D6F24B' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                    {selectedConversation.participant_name || selectedConversation.participant_username || 'Contato'}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#7A8B84' }}>
                    {selectedConversation.origem === 'comment' ? 'Comentário' : 'Direct'}{selectedConversation.updated_time ? ' • ' + new Date(selectedConversation.updated_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => selectedId && syncConversation(selectedId, true)}
                disabled={isSyncing}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  color: isSyncing ? '#A8BDB5' : '#7A8B84',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  opacity: isSyncing ? 0.6 : 1,
                  transition: 'all 200ms ease',
                }}
                title={isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7A8B84' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: msg.is_outgoing ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          backgroundColor: msg.is_outgoing ? '#D6F24B' : '#E8E8E4',
                          color: msg.is_outgoing ? '#0E2A2E' : '#0E2A2E',
                          padding: '0.75rem 1rem',
                          borderRadius: '0',
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        {/* Mídia inline */}
                        {msg.media_url && msg.media_tipo === 'image' && (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              cursor: 'pointer',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <img
                              src={msg.media_url}
                              alt="Mensagem com imagem"
                              loading="lazy"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '300px',
                                borderRadius: '0',
                                display: 'block',
                              }}
                            />
                          </a>
                        )}
                        {msg.media_url && msg.media_tipo === 'video' && (
                          <video
                            src={msg.media_url}
                            controls
                            preload="metadata"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '300px',
                              borderRadius: '0',
                              display: 'block',
                            }}
                          />
                        )}
                        {/* Texto da mensagem */}
                        {msg.text && (
                          <>
                            {msg.text}
                            {msg.is_outgoing && <span style={{ marginLeft: '0.5rem' }}>✓✓</span>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Qualificar Lead Card */}
            <div style={{ borderTop: '1px solid #E2E2DE', padding: '1rem', backgroundColor: '#F8F8F8' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                  Qualificar lead
                </p>
                <button
                  style={{
                    width: '100%',
                    backgroundColor: '#D6F24B',
                    color: '#0E2A2E',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'background-color 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C5E63A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
                >
                  Qualificar lead
                </button>
              </div>

              {/* Campo de Envio */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                  if (input) {
                    handleSendMessage(input.value);
                    input.value = '';
                  }
                }}
                style={{ display: 'flex', gap: '0.5rem' }}
              >
                <input
                  name="message"
                  type="text"
                  placeholder="Digite uma mensagem…"
                  onFocus={() => setIsMessageInputFocused(true)}
                  onBlur={() => setIsMessageInputFocused(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #E2E2DE',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#0E2A2E',
                    color: '#FAFAF8',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '0',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1A3A40'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0E2A2E'; }}
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <p style={{ color: '#7A8B84', margin: 0, fontSize: '0.875rem' }}>Selecione uma conversa para começar</p>
          </div>
        )}

        {/* COLUNA DIREITA: Perfil do Lead */}
        {selectedConversation ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
              Perfil do lead
            </h3>

            {/* Informações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>
                  Fonte
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0E2A2E' }}>
                  {selectedConversation.source === 'direct' ? 'Direct' : 'Reel'}
                </p>
              </div>

              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>
                  Interesse principal
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0E2A2E' }}>
                  {selectedConversation.main_interest || 'Não informado'}
                </p>
              </div>

              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>
                  Status
                </p>
                <span style={{ backgroundColor: '#F0F0F0', color: '#0E2A2E', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  Em qualificação
                </span>
              </div>

              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>
                  Responsável
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0E2A2E' }}>
                  {selectedConversation.assigned_to || 'Não atribuído'}
                </p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  if (!selectedConversation) return;
                  const name = selectedConversation.participant_name || selectedConversation.participant_username || 'Contato';
                  const message = `Lead: ${name}\nÚltima mensagem: ${selectedConversation.last_message || 'Nenhuma'}\nInteresse: ${selectedConversation.main_interest || 'Não informado'}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#D6F24B',
                  color: '#0E2A2E',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '0',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background-color 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C5E63A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
              >
                Encaminhar para WhatsApp
              </button>
              <button
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#0E2A2E',
                  border: '1px solid #E2E2DE',
                  padding: '0.75rem 1rem',
                  borderRadius: '0',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8F8F8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                Mover no CRM
              </button>
            </div>

            {/* Timeline de Atividades */}
            <div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
                Atividades
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                {[
                  { action: 'Comentou LINK', time: '2 min' },
                  { action: 'Clicou no material', time: '5 min' },
                  { action: 'Respondeu no Direct', time: '8 min' },
                ].map((activity, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', color: '#7A8B84' }}>
                    <span style={{ color: '#D6F24B', fontWeight: 600 }}>•</span>
                    <div>
                      <p style={{ margin: 0 }}>{activity.action}</p>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#A8BDB5' }}>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#7A8B84', margin: 0, fontSize: '0.875rem' }}>Selecione uma conversa para ver o perfil</p>
          </div>
        )}
      </main>
    </>
  );
}
