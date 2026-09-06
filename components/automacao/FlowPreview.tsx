'use client';

import { useState, useEffect, useRef } from 'react';
import { AutomacaoFlow, BLOCK_ICONS, BlockType } from '@/lib/automacao/types';
import { automacaoToFlow } from '@/lib/automacao/flowMap';

interface Props {
  flow: AutomacaoFlow | null;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  blockType?: string;
  buttons?: any[];
  blockIdx?: number;
}

// Interpola os merge fields no preview: {{first_name}} → Você; {{x|fallback}} → fallback.
function interp(t: string): string {
  return (t || '')
    .replace(/\{\{\s*first_name[^}]*\}\}/gi, 'Você')
    .replace(/\{\{\s*[^|}]+\|([^}]*)\}\}/g, '$1')
    .replace(/\{\{\s*[^}]+\}\}/g, '');
}

export function FlowPreview({ flow, onClose }: Props) {
  const [history, setHistory] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [waitingForInput, setWaitingForInput] = useState<{ field: string; nextIdx: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Anti-duplicação: startedKeyRef guarda a identidade do funil que JÁ foi iniciado.
  // O remount duplo do React StrictMode (dev) reexecuta os effects na MESMA instância
  // (refs persistem), então a 2ª passada vê a mesma chave e não dispara de novo — cada
  // mensagem entra 1× só. processedRef é a 2ª trava: barra reprocessar o mesmo bloco.
  const startedKeyRef = useRef<string | null>(null);
  const processedRef = useRef<Set<number>>(new Set());

  if (!flow) return null;

  const flowData = automacaoToFlow(flow);
  const blocks = flow.blocks;

  const reset = () => {
    processedRef.current = new Set();
    setHistory([]);
    setIsTyping(false);
    setUserInput('');
    setWaitingForInput(null);
    if (blocks.length > 0) processNextBlock(0);
  };

  // Auto-start ÚNICO por funil: só reinicia + dispara o 1º bloco quando a identidade do
  // funil muda de verdade. Como startedKeyRef persiste no remount do StrictMode, a 2ª
  // passada do effect cai no early-return e NÃO duplica as mensagens.
  useEffect(() => {
    const key = String(flow?.id ?? flow?.nome ?? '');
    if (startedKeyRef.current === key) return;
    startedKeyRef.current = key;
    processedRef.current = new Set();
    setHistory([]);
    setIsTyping(false);
    setUserInput('');
    setWaitingForInput(null);
    if (blocks.length > 0) processNextBlock(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow?.id, flow?.nome, blocks.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  const processNextBlock = async (index: number) => {
    if (index < 0 || index >= blocks.length) return;
    // Dedupe por índice: se este bloco já foi processado nesta sessão de teste, ignora
    // (barra a segunda chamada concorrente do StrictMode antes mesmo do setTimeout).
    if (processedRef.current.has(index)) return;
    processedRef.current.add(index);

    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600));
    setIsTyping(false);

    const block = blocks[index];
    const delay = block.wait_seconds || (block.wait_minutes ? block.wait_minutes * 60 : 0);

    if (delay > 0) {
      setHistory(prev => [...prev, {
        id: Math.random().toString(36),
        type: 'bot',
        content: `⏳ Aguardando ${block.wait_seconds || block.wait_minutes} seg...`,
        blockType: 'wait',
      }]);
      await new Promise(r => setTimeout(r, Math.min(delay * 1000, 2000)));
    }

    if (['condition', 'tag', 'notify_admin', 'end_flow'].includes(block.type)) {
      const icon = BLOCK_ICONS[block.type as BlockType] || '•';
      setHistory(prev => [...prev, {
        id: Math.random().toString(36),
        type: 'bot',
        content: `${icon} ${interp(block.content || '') || block.type}`,
        blockType: block.type,
      }]);
      if (block.type === 'end_flow') return;
      findAndProcessNext(index);
    } else {
      const msg: Message = {
        id: Math.random().toString(36),
        type: 'bot',
        content: interp(block.content || ''),
        blockType: block.type,
        buttons: block.buttons,
        blockIdx: index, // guarda o índice do bloco de origem (o id do balão é aleatório)
      };
      setHistory(prev => [...prev, msg]);

      if (block.type === 'quick_replies' && block.buttons?.length) {
        return;
      } else if (block.type === 'collect_data') {
        setWaitingForInput({ field: block.field_name || 'valor', nextIdx: index + 1 });
      } else {
        findAndProcessNext(index);
      }
    }
  };

  const findAndProcessNext = (currentIdx: number) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < blocks.length) {
      processNextBlock(nextIdx);
    }
  };

  const handleButtonClick = (btn: any, currentIdx: number) => {
    setHistory(prev => [...prev, {
      id: Math.random().toString(36),
      type: 'user',
      content: btn.label || btn.title || 'Clicado',
    }]);

    if (btn.action_type === 'url' || btn.action_type === 'whatsapp') {
      setHistory(prev => [...prev, {
        id: Math.random().toString(36),
        type: 'bot',
        content: `🔗 ${btn.url || 'Link aberto'}`,
      }]);
      return;
    }

    if (btn.action_type === 'end') {
      setHistory(prev => [...prev, {
        id: Math.random().toString(36),
        type: 'bot',
        content: '🏁 Fluxo encerrado',
      }]);
      return;
    }

    if (btn.next) {
      const nextIdx = blocks.findIndex(b => b.id === btn.next);
      if (nextIdx !== -1) {
        processNextBlock(nextIdx);
        return;
      }
    }

    findAndProcessNext(currentIdx);
  };

  const handleUserInput = () => {
    if (!userInput.trim() || !waitingForInput) return;

    const val = userInput;
    setUserInput('');
    setHistory(prev => [...prev, {
      id: Math.random().toString(36),
      type: 'user',
      content: val,
    }]);

    setWaitingForInput(null);
    findAndProcessNext(waitingForInput.nextIdx - 1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '360px',
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #D6F24B',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 500,
        boxShadow: '-2px 0 12px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ padding: '1rem', borderBottom: '1px solid #E2E2DE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
          📱 Teste do fluxo
        </h3>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: '#7A8B84',
          }}
        >
          ✕
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {blocks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#7A8B84', fontSize: '0.875rem' }}>
            Adicione blocos para testar
          </div>
        )}

        {history.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '0.5rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                backgroundColor: m.type === 'user' ? '#D6F24B' : '#FAFAF8',
                color: m.type === 'user' ? '#0E2A2E' : '#0E2A2E',
                border: m.type === 'user' ? 'none' : '1px solid #E2E2DE',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {history.length > 0 && history[history.length - 1].blockType === 'quick_replies' && history[history.length - 1].buttons && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {history[history.length - 1].buttons!.slice(0, 3).map((btn: any, i: number) => (
              <button
                key={i}
                onClick={() => handleButtonClick(btn, history[history.length - 1].blockIdx ?? 0)}
                style={{
                  backgroundColor: '#D6F24B',
                  color: '#0E2A2E',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {btn.label || btn.title}
              </button>
            ))}
          </div>
        )}

        {isTyping && (
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <div style={{ width: '6px', height: '6px', backgroundColor: '#D6F24B', borderRadius: '50%', animation: 'bounce 1.4s infinite' }} />
            <div style={{ width: '6px', height: '6px', backgroundColor: '#D6F24B', borderRadius: '50%', animation: 'bounce 1.4s infinite 0.2s' }} />
            <div style={{ width: '6px', height: '6px', backgroundColor: '#D6F24B', borderRadius: '50%', animation: 'bounce 1.4s infinite 0.4s' }} />
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid #E2E2DE', display: 'flex', gap: '0.5rem' }}>
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUserInput()}
          placeholder={waitingForInput ? 'Responder...' : 'Teste aqui...'}
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #E2E2DE',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: '#FAFAF8',
            color: '#0E2A2E',
            opacity: waitingForInput || history.length === 0 ? 1 : 0.5,
          }}
          disabled={!waitingForInput && history.length > 0}
        />
        <button
          onClick={() => { reset(); }}
          style={{
            backgroundColor: '#D6F24B',
            color: '#0E2A2E',
            border: 'none',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          ↻
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
