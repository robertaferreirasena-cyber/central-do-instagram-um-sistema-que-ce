'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TENANT_TEXT } from '@/lib/tenant';
import { CURRENT_ACCOUNT_ID } from '@/lib/currentAccount';
import { Composer, SendPayload, ReplyTarget } from '@/components/inbox/Composer';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'needs_human'>('all');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isMessageInputFocused, setIsMessageInputFocused] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // Lead REAL vinculado à conversa aberta (perfil rico no painel direito)
  const [leadAtual, setLeadAtual] = useState<any | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [archiving, setArchiving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const focusRef = useRef(false);
  const typingAtRef = useRef(0);

  // Ao abrir uma conversa, busca o LEAD real daquela pessoa (perfil rico no painel).
  useEffect(() => {
    const conv = conversations.find((c) => c.id === selectedId);
    const uname = conv?.participant_username;
    if (!uname) { setLeadAtual(null); return; }
    const url = new URL('/api/instagram/leads', window.location.origin);
    url.searchParams.set('accountId', CURRENT_ACCOUNT_ID);
    url.searchParams.set('instagram', uname);
    fetch(url).then((r) => r.json()).then((d) => setLeadAtual((d.leads || [])[0] || null)).catch(() => setLeadAtual(null));
  }, [selectedId, conversations]);

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
        const server = Array.isArray(data.data) ? data.data : [];
        // Preserva balões locais que FALHARAM (não estão no banco) pra não sumirem no refresh.
        setMessages((prev) => {
          const falhados = prev.filter((m) => typeof m.id === 'string' && m.id.startsWith('tmp_') && m.failed);
          return [...server, ...falhados];
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Sincronizar ao selecionar conversa (não bloqueia a UI)
  useEffect(() => {
    if (selectedId) {
      setReplyingTo(null); // limpa "respondendo a…" ao trocar de conversa
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

  // Compõe o texto igual ao que o IG entrega: mensagem + linhas de botões/respostas rápidas.
  const composeText = (text: string, buttons: SendPayload['buttons'], quick: string[]) => {
    let t = text || '';
    if (buttons.length) t += (t ? '\n' : '') + buttons.map((b) => `👉 ${b.title}: ${b.url}`).join('\n');
    if (quick.length) t += (t ? '\n' : '') + quick.map((q) => `▪️ ${q}`).join('\n');
    return t;
  };

  const handleSendMessage = async (p: SendPayload) => {
    const { text, buttons, quickReplies, attachmentUrl, attachmentType, replyTo } = p;
    if (!selectedId || (!text.trim() && buttons.length === 0 && !attachmentUrl)) return;
    const convId = selectedId;
    setReplyingTo(null);
    // Envio OTIMISTA: mostra o balão na hora (como no Instagram), depois reconcilia.
    const tempId = 'tmp_' + Date.now();
    const optimisticText = composeText(text, buttons, quickReplies);
    setMessages((prev) => [
      ...prev,
      { id: tempId, text: optimisticText, is_outgoing: true, autor: 'Você', created_at: new Date().toISOString(), sending: true, media_url: attachmentUrl, media_tipo: attachmentType },
    ]);
    try {
      const res = await fetch('/api/instagram/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId, text, buttons, quickReplies, attachmentUrl, attachmentType, replyTo }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        // Não perde o texto: marca o balão como "não enviado" com o motivo real.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, sending: false, failed: true, erro: json.error || 'Não saiu no Instagram.' } : m
          )
        );
        return;
      }
      // Sucesso: remove o otimista e recarrega do banco (traz a mensagem persistida).
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      await loadMessages(convId);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, sending: false, failed: true, erro: 'Erro de rede ao enviar.' } : m))
      );
    }
  };

  // Mostra "digitando…" pro cliente (throttle 4s pra não martelar a API).
  const handleTyping = () => {
    if (!selectedId) return;
    const now = Date.now();
    if (now - typingAtRef.current < 4000) return;
    typingAtRef.current = now;
    fetch('/api/instagram/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedId }),
    }).catch(() => {});
  };

  // Arquivar / reativar a conversa no Zernio (recurso do Direct oficial).
  const handleArchive = async () => {
    if (!selectedId || archiving) return;
    const arquivando = selectedConversation?.estado !== 'arquivado';
    if (arquivando && !confirm('Arquivar esta conversa? Ela sai da caixa de entrada ativa.')) return;
    setArchiving(true);
    try {
      const res = await fetch('/api/instagram/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedId, status: arquivando ? 'archived' : 'active' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert('Não consegui arquivar: ' + (json.error || 'erro no Zernio'));
        return;
      }
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, estado: arquivando ? 'arquivado' : 'novo' } : c)));
    } catch {
      alert('Erro de rede ao arquivar.');
    } finally {
      setArchiving(false);
    }
  };

  // Assumir conversa: marca a conversa selecionada como atendida por humano.
  const [assuming, setAssuming] = useState(false);
  const handleAssumir = async () => {
    if (!selectedId || assuming) return;
    setAssuming(true);
    try {
      const res = await fetch('/api/instagram/assumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: selectedId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert('Não consegui assumir a conversa: ' + (json.error || 'erro'));
        return;
      }
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, estado: 'em_atendimento', modo: 'humano' } : c)));
    } catch {
      alert('Erro de rede ao assumir a conversa.');
    } finally {
      setAssuming(false);
    }
  };

  // Atualiza o status do lead atual via PUT /api/instagram/leads/:id (id é inteiro).
  const [updatingLead, setUpdatingLead] = useState(false);
  const setLeadStatus = async (status: string) => {
    if (!leadAtual?.id || updatingLead) return;
    setUpdatingLead(true);
    try {
      const res = await fetch(`/api/instagram/leads/${leadAtual.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert('Não consegui atualizar o lead: ' + (json.error || 'erro'));
        return;
      }
      setLeadAtual((prev: any) => (prev ? { ...prev, status } : prev));
    } catch {
      alert('Erro de rede ao atualizar o lead.');
    } finally {
      setUpdatingLead(false);
    }
  };

  const handleQualificar = () => {
    if (!leadAtual) { alert('Sincronize as conversas para gerar o lead deste contato antes de qualificar.'); return; }
    setLeadStatus('qualificado');
  };

  const handleMoverCrm = () => {
    if (!leadAtual) { alert('Sincronize as conversas para gerar o lead deste contato antes de mover no CRM.'); return; }
    const opcoes = ['novo', 'qualificado', 'quente', 'ganho', 'perdido'];
    const escolha = prompt(`Mover lead para qual status?\n${opcoes.join(' | ')}`, leadAtual.status || 'novo');
    if (!escolha) return;
    const status = escolha.trim().toLowerCase();
    if (!opcoes.includes(status)) { alert('Status inválido. Use: ' + opcoes.join(', ')); return; }
    setLeadStatus(status);
  };

  return (
    <>
      <PageHeader
        tag="ATENDIMENTO"
        title="Inbox e leads"
        subtitle="Converse, qualifique e encaminhe no mesmo lugar."
        actions={
          <button
            onClick={handleAssumir}
            disabled={!selectedId || assuming}
            style={{
              backgroundColor: '#D6F24B',
              color: '#0E2A2E',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: (!selectedId || assuming) ? 'not-allowed' : 'pointer',
              opacity: (!selectedId || assuming) ? 0.6 : 1,
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => { if (selectedId && !assuming) e.currentTarget.style.backgroundColor = '#C5E63A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
          >
            {assuming ? 'Assumindo...' : 'Assumir conversa'}
          </button>
        }
      />

      <main style={{ padding: '1.25rem 1.5rem', height: 'calc(100vh - 88px)', minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '300px minmax(0,1fr) 300px', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
        {/* COLUNA ESQUERDA: Filtros e Lista de Conversas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, height: '100%' }}>
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
                  onClick={() => {
                    setSelectedId(conv.id);
                    // Marca como lida localmente ao abrir (o Zernio não expõe mark-read).
                    if (conv.unread_count > 0) {
                      setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)));
                    }
                  }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ margin: 0, flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.participant_name || conv.participant_username || 'Contato'}
                        </p>
                        {conv.unread_count > 0 && (
                          <span style={{ flexShrink: 0, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: '#0E2A2E', color: '#D6F24B', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: conv.unread_count > 0 ? '#0E2A2E' : '#7A8B84', fontWeight: conv.unread_count > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '1.2em' }}>
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
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', minHeight: 0 }}>
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
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: archiving ? 'not-allowed' : 'pointer',
                    color: '#7A8B84',
                    fontWeight: 600,
                    padding: '0.25rem 0.5rem',
                    opacity: archiving ? 0.6 : 1,
                  }}
                  title={selectedConversation.estado === 'arquivado' ? 'Reativar conversa' : 'Arquivar conversa'}
                >
                  {selectedConversation.estado === 'arquivado' ? 'Reativar' : 'Arquivar'}
                </button>
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
            </div>

            {/* Messages */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7A8B84' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma mensagem ainda</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const time = msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const nome = msg.is_outgoing
                      ? (msg.autor || 'Você')
                      : (msg.autor || selectedConversation.participant_username || 'Cliente');
                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.is_outgoing ? 'flex-end' : 'flex-start',
                          gap: '0.2rem',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '72%',
                            backgroundColor: msg.failed ? '#FBEAE7' : msg.is_outgoing ? '#D6F24B' : '#E8E8E4',
                            color: '#0E2A2E',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '0',
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            border: msg.failed ? '1px solid #C0442E' : 'none',
                            opacity: msg.sending ? 0.7 : 1,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {/* Mídia inline */}
                          {msg.media_url && msg.media_tipo === 'image' && (
                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', cursor: 'pointer' }}>
                              <img src={msg.media_url} alt="Imagem" loading="lazy" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block' }} />
                            </a>
                          )}
                          {msg.media_url && msg.media_tipo === 'video' && (
                            <video src={msg.media_url} controls preload="metadata" style={{ maxWidth: '100%', maxHeight: '300px', display: 'block' }} />
                          )}
                          {msg.text && <span>{msg.text}</span>}
                        </div>
                        {/* Metadados: quem falou · horário · status · responder */}
                        <div style={{ fontSize: '0.65rem', color: msg.failed ? '#C0442E' : '#9AA7A1', padding: '0 0.15rem', display: 'flex', gap: '0.3rem', alignItems: 'center', maxWidth: '72%' }}>
                          <span style={{ fontWeight: 600 }}>{nome}</span>
                          {time && <span>· {time}</span>}
                          {msg.is_outgoing && msg.sending && <span>· enviando…</span>}
                          {msg.is_outgoing && !msg.sending && !msg.failed && <span>· ✓✓</span>}
                          {msg.failed && <span>· não enviado</span>}
                          {msg.id_externo && !msg.sending && !msg.failed && (
                            <button
                              onClick={() => setReplyingTo({ id_externo: msg.id_externo, text: (msg.text || '📷 Imagem').slice(0, 80), autor: nome })}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#46655C', fontWeight: 600, padding: 0, fontSize: '0.65rem' }}
                            >
                              · Responder
                            </button>
                          )}
                        </div>
                        {msg.failed && msg.erro && (
                          <div style={{ fontSize: '0.68rem', color: '#C0442E', maxWidth: '72%', textAlign: 'right', padding: '0 0.15rem', lineHeight: 1.4 }}>
                            {msg.erro}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  onClick={handleQualificar}
                  disabled={updatingLead}
                  style={{
                    width: '100%',
                    backgroundColor: '#D6F24B',
                    color: '#0E2A2E',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: updatingLead ? 'not-allowed' : 'pointer',
                    opacity: updatingLead ? 0.6 : 1,
                    transition: 'background-color 200ms ease',
                  }}
                  onMouseEnter={(e) => { if (!updatingLead) e.currentTarget.style.backgroundColor = '#C5E63A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
                >
                  {leadAtual?.status === 'qualificado' ? 'Lead qualificado ✓' : 'Qualificar lead'}
                </button>
              </div>

              {/* Campo de Envio — Composer estilo Direct (texto, imagem, respostas rápidas, botões, citar) */}
              <Composer
                onSend={handleSendMessage}
                onFocusChange={setIsMessageInputFocused}
                onTyping={handleTyping}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <p style={{ color: '#7A8B84', margin: 0, fontSize: '0.875rem' }}>Selecione uma conversa para começar</p>
          </div>
        )}

        {/* COLUNA DIREITA: Perfil do Lead */}
        {selectedConversation ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'auto', height: '100%', minHeight: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
              Perfil do lead
            </h3>

            {/* Cabeçalho do lead (avatar + @ + SLA) */}
            {(() => {
              const perfil = leadAtual?.perfil || {};
              const estCor: Record<string, string> = { quente: '#e8590c', qualificado: '#2b8a3e', novo: '#1971c2', frio: '#868e96' };
              const vencido = selectedConversation.estado === 'aguardando_humano' && (selectedConversation.unread_count || 0) > 0;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', flex: 'none', background: '#dee2e6', backgroundImage: leadAtual?.avatar_url ? `url(${leadAtual.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#868e96' }}>
                      {!leadAtual?.avatar_url && (selectedConversation.participant_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0E2A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedConversation.participant_name || selectedConversation.participant_username}</div>
                      {selectedConversation.participant_username && <div style={{ fontSize: 12, color: '#7A8B84' }}>@{selectedConversation.participant_username}</div>}
                    </div>
                  </div>

                  {/* SLA */}
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>SLA</p>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: vencido ? '#ffe3e3' : '#d3f9d8', color: vencido ? '#c92a2a' : '#2b8a3e' }}>
                      {vencido ? '⏰ Aguardando resposta' : '✓ Em dia'}
                    </span>
                  </div>

                  {!leadAtual ? (
                    <div style={{ fontSize: 12, color: '#adb5bd' }}>Sincronize as conversas para gerar o lead deste contato.</div>
                  ) : (
                    <>
                      {/* Estágio / score / origem */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ padding: '3px 10px', background: estCor[perfil.estagio] || '#495057', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{perfil.estagio || leadAtual.status}</span>
                        <span style={{ padding: '3px 10px', background: '#fff3bf', color: '#5c3c00', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>Score {leadAtual.score}</span>
                        <span style={{ padding: '3px 10px', background: '#e7f5ff', color: '#1971c2', borderRadius: 999, fontSize: 12, textTransform: 'capitalize' }}>{leadAtual.origem}</span>
                      </div>

                      {/* Resumo captado pelo agente */}
                      {perfil.resumo && (
                        <div>
                          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>🧠 Perfil (Direct)</p>
                          <p style={{ margin: 0, fontSize: 13, color: '#343a40', lineHeight: 1.5 }}>{perfil.resumo}</p>
                        </div>
                      )}
                      {!!perfil.interesses?.length && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {perfil.interesses.map((t: string) => <span key={t} style={{ padding: '2px 8px', background: '#e7f5ff', color: '#1971c2', borderRadius: 999, fontSize: 11 }}>{t}</span>)}
                        </div>
                      )}

                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' }}>Status · Responsável</p>
                        <p style={{ margin: 0, fontSize: 13, color: '#0E2A2E', textTransform: 'capitalize' }}>{leadAtual.status} · {leadAtual.vendedor_nome || 'Sem vendedor'}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

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
                onClick={handleMoverCrm}
                disabled={updatingLead}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#0E2A2E',
                  border: '1px solid #E2E2DE',
                  padding: '0.75rem 1rem',
                  borderRadius: '0',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: updatingLead ? 'not-allowed' : 'pointer',
                  opacity: updatingLead ? 0.6 : 1,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => { if (!updatingLead) e.currentTarget.style.backgroundColor = '#F8F8F8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
              >
                Mover no CRM
              </button>
            </div>

            {/* Resumo real da atividade (do lead) */}
            {leadAtual && (
              <div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
                  Atividade
                </p>
                <div style={{ fontSize: 13, color: '#495057', display: 'grid', gap: 4 }}>
                  <div>Mensagens: <b>{leadAtual.total_mensagens ?? 0}</b></div>
                  <div>Primeiro contato: {leadAtual.primeiro_contato ? new Date(leadAtual.primeiro_contato).toLocaleString('pt-BR') : '—'}</div>
                  <div>Último contato: {leadAtual.ultimo_contato ? new Date(leadAtual.ultimo_contato).toLocaleString('pt-BR') : '—'}</div>
                </div>
              </div>
            )}
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
