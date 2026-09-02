'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import PlanejadorConteudo from '@/components/planejador-conteudo';
import { TENANT_TEXT } from '@/lib/tenant';
import { Archivo } from 'next/font/google';

const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });

interface Template {
  id: string;
  nome?: string;
  name?: string;
  formato?: string;
}

interface GeneratedContent {
  idea?: string;
  roteiro?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
}

export default function ConteudoPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides] = useState(7);
  const [showPlanejador, setShowPlanejador] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [tema, setTema] = useState('');
  const [iaSuggestion, setIaSuggestion] = useState({
    objetivo: 'Gerar leads',
    tom: 'Direto e humano',
    cta: 'Comente LINK',
    formato: 'Carrossel',
    agendar: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch(`/api/content/templates?account_id=${TENANT_TEXT}`);
      if (res.ok) {
        const data = await res.json();
        const temps = Array.isArray(data.data) ? data.data : [];
        setTemplates(temps);
        if (temps.length > 0) {
          setSelectedTemplate(temps[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!tema.trim()) {
      alert('Digite um tema para gerar conteúdo');
      return;
    }
    if (!selectedTemplate) {
      alert('Selecione um tipo de conteúdo');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedTemplate,
          theme: tema,
          account_id: TENANT_TEXT,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setGenerated(data.data);
        setIaSuggestion((prev) => ({
          ...prev,
          cta: data.data.cta || prev.cta,
        }));
      } else {
        alert('Erro ao gerar conteúdo: ' + (data.error || 'Desconhecido'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!tema.trim() || !generated) {
      alert('Gere conteúdo primeiro');
      return;
    }

    setIsSaving(true);
    try {
      const scheduledAt = iaSuggestion.agendar
        ? new Date(iaSuggestion.agendar).toISOString()
        : new Date().toISOString();

      const res = await fetch('/api/content/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: TENANT_TEXT,
          type: selectedTemplate,
          theme: tema,
          caption: generated.caption || '',
          hashtags: generated.hashtags || [],
          scheduled_at: scheduledAt,
          status: 'draft',
          created_by: 'studio-ia',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Rascunho salvo com sucesso!');
        setTema('');
        setGenerated(null);
        setIaSuggestion((prev) => ({ ...prev, agendar: '' }));
      } else {
        alert('Erro ao salvar: ' + (data.error || 'Desconhecido'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar rascunho');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        tag="ESTÚDIO DE CONTEÚDO"
        title="Estúdio de Conteúdo"
        subtitle="Crie, revise e publique sem sair do fluxo."
        actions={
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || !generated}
              style={{
                backgroundColor: isSaving || !generated ? '#E2E2DE' : 'transparent',
                border: '1px solid #0E2A2E',
                color: '#0E2A2E',
                padding: '0.5rem 1rem',
                cursor: isSaving || !generated ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                opacity: isSaving || !generated ? 0.5 : 1,
              }}
            >
              {isSaving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            <button
              onClick={() => setShowPlanejador(true)}
              style={{
                backgroundColor: '#29b6ff',
                color: '#070d18',
                padding: '0.5rem 1rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              📅 Gerar plano
            </button>
            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              style={{
                backgroundColor: isGenerating ? '#C5E63A' : '#D6F24B',
                color: '#0E2A2E',
                padding: '0.5rem 1rem',
                border: 'none',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                opacity: isGenerating ? 0.8 : 1,
              }}
            >
              {isGenerating ? 'Gerando...' : 'Gerar com IA'}
            </button>
          </div>
        }
      />

      <PlanejadorConteudo
        isOpen={showPlanejador}
        onClose={() => setShowPlanejador(false)}
        accountId="default-account"
      />

      <main style={{ padding: '2rem', flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '2rem', width: '100%' }}>
        {/* Modelos (Esquerda) */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '1rem', margin: 0 }}>
            Modelos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {templates.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: '#7A8B84', margin: 0 }}>Nenhum modelo disponível</p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    backgroundColor: selectedTemplate === template.id ? '#D6F24B' : '#FFFFFF',
                    border: selectedTemplate === template.id ? '2px solid #D6F24B' : '1px solid #E2E2DE',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ width: '100%', height: '80px', backgroundColor: selectedTemplate === template.id ? '#0E2A2E' : '#E2E2DE', marginBottom: '0.75rem', borderRadius: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: selectedTemplate === template.id ? '#0E2A2E' : '#0E2A2E' }}>
                    {template.nome || template.name || 'Modelo'}
                  </p>
                  {selectedTemplate === template.id && (
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '20px', height: '20px', backgroundColor: '#0E2A2E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D6F24B', fontWeight: 700 }}>
                      ✓
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Canvas Central */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #E2E2DE' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#7A8B84' }}>
                  {templates.find((t) => t.id === selectedTemplate)?.nome || templates.find((t) => t.id === selectedTemplate)?.name || 'Modelo selecionado'}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#7A8B84' }}>
                  1080 × 1350
                </p>
              </div>
              <button style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>
                ⛶
              </button>
            </div>

            {/* Preview área */}
            <div style={{ flex: 1, backgroundColor: '#0E2A2E', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '1.5rem', overflowY: 'auto' }}>
              {generated ? (
                <div style={{ textAlign: 'center', color: '#FAFAF8', width: '100%' }}>
                  <p style={{ fontFamily: archivo.style.fontFamily, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 1rem 0' }}>
                    {generated.idea || 'Ideia gerada'}
                  </p>
                  <div style={{ width: '60px', height: '20px', backgroundColor: '#D6F24B', margin: '1rem auto 2rem' }} />
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, margin: '0 auto', maxWidth: '400px' }}>
                    {generated.caption || 'Legenda gerada'}
                  </p>
                  {generated.hashtags && generated.hashtags.length > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#D6F24B', margin: '1rem 0 0 0' }}>
                      {generated.hashtags.join(' ')}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#FAFAF8' }}>
                  <p style={{ fontFamily: archivo.style.fontFamily, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 1rem 0' }}>
                    Seu conteúdo<br />precisa virar<br />conversa.
                  </p>
                  <div style={{ width: '60px', height: '20px', backgroundColor: '#D6F24B', margin: '1rem auto' }} />
                  <p style={{ fontSize: '0.75rem', color: '#A8BDB5', margin: '1.5rem 0 0 0' }}>
                    Clique em "Gerar com IA" para começar
                  </p>
                </div>
              )}
            </div>

            {/* Paginação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #E2E2DE' }}>
              <button style={{ backgroundColor: 'transparent', border: '1px solid #E2E2DE', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                ← Anterior
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#7A8B84' }}>
                {currentSlide} / {totalSlides}
              </span>
              <button style={{ backgroundColor: 'transparent', border: '1px solid #E2E2DE', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Próximo →
              </button>
            </div>
          </div>
        </div>

        {/* IA sugere (Direita) */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '1rem', margin: 0 }}>
            IA sugere
          </h3>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1rem', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Tema/assunto
              </label>
              <input
                type="text"
                placeholder="Digite o tema para o conteúdo..."
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E2DE',
                  borderRadius: 0,
                  fontSize: '0.875rem',
                  backgroundColor: '#FAFAF8',
                  color: '#0E2A2E',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Objetivo
              </label>
              <select
                value={iaSuggestion.objetivo}
                onChange={(e) => setIaSuggestion((prev) => ({ ...prev, objetivo: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E' }}
              >
                <option>Gerar leads</option>
                <option>Aumentar engajamento</option>
                <option>Vender</option>
                <option>Educar</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Tom
              </label>
              <select
                value={iaSuggestion.tom}
                onChange={(e) => setIaSuggestion((prev) => ({ ...prev, tom: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E' }}
              >
                <option>Direto e humano</option>
                <option>Profissional</option>
                <option>Leve e divertido</option>
                <option>Inspirador</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                CTA
              </label>
              <input
                type="text"
                value={iaSuggestion.cta}
                onChange={(e) => setIaSuggestion((prev) => ({ ...prev, cta: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Agendar para
              </label>
              <input
                type="datetime-local"
                value={iaSuggestion.agendar}
                onChange={(e) => setIaSuggestion((prev) => ({ ...prev, agendar: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{
            marginTop: '1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: generated ? '#2D7A1F' : '#7A8B84',
            textAlign: 'center',
            padding: '1rem',
            border: '1px solid #E2E2DE',
            backgroundColor: generated ? '#E6F5D6' : '#FFFFFF',
            borderRadius: 0,
          }}>
            {generated ? '✓ Pronto para salvar' : 'Gere conteúdo para ver status'}
          </div>
        </div>
      </main>
    </>
  );
}
