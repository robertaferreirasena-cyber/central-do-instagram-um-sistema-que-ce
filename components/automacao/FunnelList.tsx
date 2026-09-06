'use client';

import { useState } from 'react';
import { AutomacaoFlow } from '@/lib/automacao/types';
import { listTemplates } from '@/lib/automacao/templates';

interface Props {
  flows: AutomacaoFlow[];
  selected: AutomacaoFlow | null;
  onSelect: (flow: AutomacaoFlow) => void;
  onNewFlow: () => void;
  onNewFromTemplate: (templateKey: string) => void;
  onGenerateWithAI?: (flow: AutomacaoFlow) => void;
}

export function FunnelList({ flows, selected, onSelect, onNewFlow, onNewFromTemplate, onGenerateWithAI }: Props) {
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiForm, setAIForm] = useState({
    objetivo: 'captar_lead' as const,
    keyword: '',
    postCaption: '',
  });
  const [generating, setGenerating] = useState(false);
  const templates = listTemplates();

  const handleGenerateWithAI = async () => {
    if (!aiForm.objetivo) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/automacao/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objetivo: aiForm.objetivo,
          keyword: aiForm.keyword || undefined,
          postCaption: aiForm.postCaption || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.flow) {
          onGenerateWithAI?.(data.flow);
          setShowAIForm(false);
          setAIForm({ objetivo: 'captar_lead', keyword: '', postCaption: '' });
          alert(data.aviso || '✨ Fluxo gerado! Revise antes de ativar.');
        }
      }
    } catch (e) {
      console.error('Erro ao gerar:', e);
      alert('Erro ao gerar fluxo');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        width: '250px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E2DE',
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', textTransform: 'uppercase' }}>
        Meus funis
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={onNewFlow}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#D6F24B',
            color: '#0E2A2E',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '4px',
          }}
        >
          + Novo funil
        </button>

        <button
          onClick={() => setShowAIForm(!showAIForm)}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#FAFAF8',
            color: '#0E2A2E',
            border: '1px solid #E2E2DE',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '4px',
          }}
        >
          ✨ Gerar com IA
        </button>

        {showAIForm && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D6F24B',
            borderRadius: '4px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E2A2E' }}>
              Objetivo
              <select
                value={aiForm.objetivo}
                onChange={(e) => setAIForm({ ...aiForm, objetivo: e.target.value as any })}
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#FAFAF8',
                  border: '1px solid #E2E2DE',
                  borderRadius: '4px',
                }}
              >
                <option value="captar_lead">Captar lead</option>
                <option value="agendar">Agendar reunião</option>
                <option value="vender">Vender direto</option>
                <option value="tirar_duvida">Tirar dúvida</option>
              </select>
            </label>

            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E2A2E' }}>
              Palavra-chave (opcional)
              <input
                value={aiForm.keyword}
                onChange={(e) => setAIForm({ ...aiForm, keyword: e.target.value })}
                placeholder="Ex: QUERO"
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#FAFAF8',
                  border: '1px solid #E2E2DE',
                  borderRadius: '4px',
                }}
              />
            </label>

            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E2A2E' }}>
              Legenda do post (opcional)
              <textarea
                value={aiForm.postCaption}
                onChange={(e) => setAIForm({ ...aiForm, postCaption: e.target.value })}
                placeholder="Cole a legenda do post..."
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  backgroundColor: '#FAFAF8',
                  border: '1px solid #E2E2DE',
                  borderRadius: '4px',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </label>

            <button
              onClick={handleGenerateWithAI}
              disabled={generating}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: '4px',
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? '⏳ Gerando...' : 'Gerar'}
            </button>
          </div>
        )}

        <details
          style={{
            backgroundColor: '#FAFAF8',
            border: '1px solid #E2E2DE',
            borderRadius: '4px',
            padding: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <summary style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', listStyle: 'none' }}>
            📦 Usar modelo
          </summary>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => onNewFromTemplate(t.key)}
                style={{
                  textAlign: 'left',
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#7A8B84',
                }}
              >
                {t.nome}
              </button>
            ))}
          </div>
        </details>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
        {flows.map((flow) => (
          <div
            key={flow.id}
            onClick={() => onSelect(flow)}
            style={{
              padding: '0.75rem',
              backgroundColor: selected?.id === flow.id ? '#FAFAF8' : '#FAFAF8',
              border: selected?.id === flow.id ? '2px solid #D6F24B' : '1px solid #E2E2DE',
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
              {flow.nome}
            </p>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: flow.enabled ? '#D6F24B' : '#E2E2DE',
                color: flow.enabled ? '#0E2A2E' : '#7A8B84',
                padding: '0.25rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                borderRadius: '2px',
              }}
            >
              {flow.enabled ? 'Ativo' : 'Rascunho'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
