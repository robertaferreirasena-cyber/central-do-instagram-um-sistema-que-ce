'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import PlanejadorConteudo from '@/components/planejador-conteudo';
import { Archivo } from 'next/font/google';

const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });

const templates = [
  { id: 'carousel', name: 'Carrossel educativo', selected: true },
  { id: 'direct-offer', name: 'Oferta direta' },
  { id: 'story-poll', name: 'Story de enquete' },
  { id: 'reel-cover', name: 'Capa de Reel' },
];

export default function ConteudoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('carousel');
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides] = useState(7);
  const [showPlanejador, setShowPlanejador] = useState(false);
  const [iaSuggestion, setIaSuggestion] = useState({
    objetivo: 'Gerar leads',
    tom: 'Direto e humano',
    cta: 'Comente LINK',
    formato: 'Carrossel',
    agendar: '05 set · 10:30',
  });

  return (
    <>
      <PageHeader
        tag="ESTÚDIO DE CONTEÚDO"
        title="Estúdio de Conteúdo"
        subtitle="Crie, revise e publique sem sair do fluxo."
        actions={
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ backgroundColor: 'transparent', border: '1px solid #0E2A2E', color: '#0E2A2E', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              Salvar rascunho
            </button>
            <button
              onClick={() => setShowPlanejador(true)}
              style={{ backgroundColor: '#29b6ff', color: '#070d18', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
            >
              📅 Gerar plano
            </button>
            <button style={{ backgroundColor: '#D6F24B', color: '#0E2A2E', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              Gerar com IA
            </button>
          </div>
        }
      />

      <PlanejadorConteudo
        isOpen={showPlanejador}
        onClose={() => setShowPlanejador(false)}
        accountId="default-account"
      />

      <main style={{ paddingLeft: '280px', padding: '2rem', flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '2rem' }}>
        {/* Modelos (Esquerda) */}
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '1rem', margin: 0 }}>
            Modelos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {templates.map((template) => (
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
                  {template.name}
                </p>
                {selectedTemplate === template.id && (
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '20px', height: '20px', backgroundColor: '#0E2A2E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D6F24B', fontWeight: 700 }}>
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Central */}
        <div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #E2E2DE' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#7A8B84' }}>
                  {templates.find((t) => t.id === selectedTemplate)?.name}
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
            <div style={{ flex: 1, backgroundColor: '#0E2A2E', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <div style={{ textAlign: 'center', color: '#FAFAF8' }}>
                <p style={{ fontFamily: archivo.style.fontFamily, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 1rem 0' }}>
                  Seu conteúdo<br />precisa virar<br />conversa.
                </p>
                <div style={{ width: '60px', height: '20px', backgroundColor: '#D6F24B', margin: '1rem auto' }} />
              </div>
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
                Objetivo
              </label>
              <select style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E' }}>
                <option>{iaSuggestion.objetivo}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Tom
              </label>
              <select style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E' }}>
                <option>{iaSuggestion.tom}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                CTA
              </label>
              <input
                type="text"
                defaultValue={iaSuggestion.cta}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Formato
              </label>
              <select style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E' }}>
                <option>{iaSuggestion.formato}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', marginBottom: '0.5rem' }}>
                Agendar
              </label>
              <input
                type="text"
                defaultValue={iaSuggestion.agendar}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: 0, fontSize: '0.875rem', backgroundColor: '#FAFAF8', color: '#0E2A2E', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7A8B84', textAlign: 'center', padding: '1rem', border: '1px solid #E2E2DE', backgroundColor: '#FFFFFF', borderRadius: 0 }}>
            Pronto para revisão
          </div>
        </div>
      </main>
    </>
  );
}
