'use client';

import React from 'react';

interface TemplatePreviewProps {
  nome: string;
  proporcao: string;
  combinacao?: 'editorial' | 'card' | 'ruptura' | 'cta' | 'rodape' | 'imagem';
  campos?: Record<string, string>;
  miniatura?: boolean;
}

const CORES = {
  gelo: '#FAFAF8',
  petroleo: '#0E2A2E',
  citrico: '#D6F24B',
  eucalipto: '#46655C',
  petroleoProfundo: '#14383D',
  ardosia: '#7A8B84',
  linha: '#E2E2DE',
  alerta: '#C0442E',
};

export default function TemplatePreview({
  nome,
  proporcao,
  combinacao = 'editorial',
  campos = {},
  miniatura = false,
}: TemplatePreviewProps) {
  const combinacoes: Record<
    string,
    {
      bgFundo?: string;
      txtPrincipal?: string;
      txtSecundario?: string;
      border?: string;
    }
  > = {
    editorial: {
      bgFundo: CORES.gelo,
      txtPrincipal: CORES.petroleo,
      txtSecundario: CORES.eucalipto,
    },
    card: {
      bgFundo: '#FFFFFF',
      border: CORES.linha,
      txtPrincipal: CORES.petroleo,
    },
    ruptura: {
      bgFundo: CORES.petroleo,
      txtPrincipal: CORES.gelo,
      txtSecundario: CORES.gelo,
    },
    cta: {
      bgFundo: CORES.citrico,
      txtPrincipal: CORES.petroleo,
      border: 'none',
    },
    rodape: {
      bgFundo: CORES.petroleoProfundo,
      txtPrincipal: CORES.gelo,
      txtSecundario: CORES.gelo,
    },
    imagem: {
      bgFundo: 'rgba(14,42,46,0.72)',
      txtPrincipal: CORES.gelo,
    },
  };

  const cores = combinacoes[combinacao] || combinacoes.editorial;

  const getAspectRatio = (prop: string) => {
    const ratios: Record<string, string> = {
      '4:5': '80%',
      '9:16': '56.25%',
      '1:1': '100%',
    };
    return ratios[prop] || '80%';
  };

  const renderTemplateContent = () => {
    switch (nome) {
      case 'Carrossel educativo':
        return (
          <div style={{ padding: miniatura ? '0.75rem' : '1.5rem', textAlign: 'center' }}>
            <div
              style={{
                fontSize: miniatura ? '0.875rem' : '1.5rem',
                fontWeight: 900,
                fontFamily: 'Archivo, sans-serif',
                color: cores.txtPrincipal,
                marginBottom: '0.5rem',
                lineHeight: 1.1,
              }}
            >
              {campos.titulo || 'Aprenda IA aplicando'}
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.625rem' : '0.875rem',
                fontFamily: 'Instrument Sans, sans-serif',
                color: (cores.txtSecundario as string) || (cores.txtPrincipal as string),
                marginBottom: '0.75rem',
              }}
            >
              {campos.gancho || 'No seu negócio'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {['Slide 1', 'Slide 2', 'Slide 3'].map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: miniatura ? '1.5rem' : '2rem',
                    height: miniatura ? '1.5rem' : '2rem',
                    backgroundColor: CORES.citrico,
                    borderRadius: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: miniatura ? '0.5rem' : '0.75rem',
                    fontWeight: 600,
                    color: CORES.petroleo,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: '1rem',
                padding: miniatura ? '0.5rem' : '0.75rem',
                backgroundColor: CORES.citrico,
                color: CORES.petroleo,
                fontWeight: 600,
                fontSize: miniatura ? '0.625rem' : '0.75rem',
                fontFamily: 'Instrument Sans, sans-serif',
                borderRadius: 0,
              }}
            >
              {campos.cta || '✦ Comente LINK'}
            </div>
          </div>
        );

      case 'Capa de Reels':
        return (
          <div
            style={{
              padding: miniatura ? '1rem' : '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              backgroundImage:
                combinacao === 'ruptura'
                  ? 'linear-gradient(135deg, #0E2A2E 0%, #14383D 100%)'
                  : 'none',
            }}
          >
            <div
              style={{
                fontSize: miniatura ? '1rem' : '2rem',
                fontWeight: 900,
                fontFamily: 'Archivo, sans-serif',
                color: cores.txtPrincipal,
                marginBottom: '0.75rem',
                lineHeight: 1.1,
                maxWidth: '90%',
              }}
            >
              {campos.titulo || 'O que muda em 90 dias'}
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.5rem' : '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: CORES.citrico,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
              }}
            >
              // FERRAMENTA DA SEMANA
            </div>
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: miniatura ? '0.5rem' : '0.75rem',
                color: (cores.txtSecundario as string) || (cores.txtPrincipal as string),
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            >
              ✦ IA CLUB
            </div>
          </div>
        );

      case 'Sequência de Stories':
        return (
          <div style={{ padding: miniatura ? '0.75rem' : '1.5rem' }}>
            {['1', '2', '3'].map((n, i) => (
              <div
                key={i}
                style={{
                  marginBottom: miniatura ? '0.5rem' : '1rem',
                  paddingBottom: miniatura ? '0.5rem' : '1rem',
                  borderBottom:
                    i < 2 ? `1px solid ${CORES.linha}` : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: miniatura ? '0.625rem' : '0.875rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: CORES.eucalipto,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}
                >
                  Story {n}
                </div>
                <div
                  style={{
                    fontSize: miniatura ? '0.65rem' : '0.875rem',
                    fontFamily: 'Instrument Sans, sans-serif',
                    color: cores.txtPrincipal,
                    lineHeight: 1.4,
                  }}
                >
                  {campos[`msg${n}`] || `Mensagem story ${n}`}
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: miniatura ? '0.5rem' : '1rem',
                padding: miniatura ? '0.4rem' : '0.75rem',
                backgroundColor: CORES.citrico,
                color: CORES.petroleo,
                fontWeight: 600,
                fontSize: miniatura ? '0.6rem' : '0.75rem',
                fontFamily: 'Instrument Sans, sans-serif',
                borderRadius: 0,
                textAlign: 'center',
              }}
            >
              {campos.cta || '✦ Clique aqui'}
            </div>
          </div>
        );

      case 'Post de frase':
        return (
          <div
            style={{
              padding: miniatura ? '1rem' : '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: miniatura ? '1rem' : '1.75rem',
                fontWeight: 800,
                fontFamily: 'Archivo, sans-serif',
                color: cores.txtPrincipal,
                marginBottom: '1rem',
                lineHeight: 1.3,
                fontStyle: 'italic',
              }}
            >
              "{campos.frase || 'Você não precisa de mais um curso.'}"
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.625rem' : '0.875rem',
                fontFamily: 'Instrument Sans, sans-serif',
                color: (cores.txtSecundario as string) || (cores.txtPrincipal as string),
                marginBottom: '1.5rem',
              }}
            >
              — {campos.autor || 'IA Club'}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                justifyContent: 'center',
              }}
            >
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: miniatura ? '1rem' : '1.5rem',
                    height: miniatura ? '1rem' : '1.5rem',
                    backgroundColor: CORES.citrico,
                    borderRadius: 0,
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'Post de lançamento':
        return (
          <div
            style={{
              padding: miniatura ? '1rem' : '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
              backgroundImage:
                'linear-gradient(135deg, rgba(14,42,46,0.8) 0%, rgba(214,242,75,0.1) 100%)',
            }}
          >
            <div
              style={{
                fontSize: miniatura ? '0.75rem' : '1.5rem',
                fontWeight: 900,
                fontFamily: 'Archivo, sans-serif',
                color: CORES.citrico,
                marginBottom: '0.5rem',
              }}
            >
              {campos.titulo || '🚀 Lançamento'}
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.625rem' : '0.875rem',
                fontFamily: 'Instrument Sans, sans-serif',
                color: CORES.gelo,
                marginBottom: '1rem',
                lineHeight: 1.4,
              }}
            >
              {campos.beneficio || 'Maior benefício aqui'}
            </div>
            <div
              style={{
                padding: miniatura ? '0.4rem 0.75rem' : '0.75rem 1.5rem',
                backgroundColor: CORES.citrico,
                color: CORES.petroleo,
                fontWeight: 700,
                fontSize: miniatura ? '0.6rem' : '0.875rem',
                fontFamily: 'Archivo, sans-serif',
                borderRadius: 0,
              }}
            >
              {campos.oferta || '✦ Compre agora'}
            </div>
          </div>
        );

      case 'Post checklist':
        return (
          <div style={{ padding: miniatura ? '1rem' : '1.5rem' }}>
            <div
              style={{
                fontSize: miniatura ? '0.75rem' : '1.25rem',
                fontWeight: 800,
                fontFamily: 'Archivo, sans-serif',
                color: cores.txtPrincipal,
                marginBottom: '1rem',
              }}
            >
              {campos.titulo || 'Seu checklist'}
            </div>
            {['Item 1', 'Item 2', 'Item 3', 'Item 4'].map((_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: miniatura ? '0.4rem' : '0.75rem',
                  alignItems: 'flex-start',
                  marginBottom: miniatura ? '0.5rem' : '0.75rem',
                }}
              >
                <div
                  style={{
                    width: miniatura ? '0.9rem' : '1.25rem',
                    height: miniatura ? '0.9rem' : '1.25rem',
                    backgroundColor: CORES.citrico,
                    borderRadius: 0,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: miniatura ? '0.5rem' : '0.75rem',
                    fontWeight: 700,
                    color: CORES.petroleo,
                  }}
                >
                  ✓
                </div>
                <div
                  style={{
                    fontSize: miniatura ? '0.65rem' : '0.875rem',
                    fontFamily: 'Instrument Sans, sans-serif',
                    color: cores.txtPrincipal,
                  }}
                >
                  {campos[`item${i + 1}`] || `Item ${i + 1}`}
                </div>
              </div>
            ))}
          </div>
        );

      case 'Ferramenta da semana':
        return (
          <div
            style={{
              padding: miniatura ? '1rem' : '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                marginBottom: miniatura ? '0.5rem' : '1rem',
                padding: miniatura ? '0.3rem 0.6rem' : '0.5rem 1rem',
                backgroundColor: cores.txtPrincipal,
                color: cores.bgFundo,
                fontWeight: 600,
                fontSize: miniatura ? '0.5rem' : '0.65rem',
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                borderRadius: 0,
              }}
            >
              // FERRAMENTA
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.9rem' : '1.5rem',
                fontWeight: 900,
                fontFamily: 'Archivo, sans-serif',
                color: cores.txtPrincipal,
                marginBottom: '0.5rem',
                lineHeight: 1.1,
              }}
            >
              {campos.titulo || 'Nova ferramenta'}
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.625rem' : '0.875rem',
                fontFamily: 'Instrument Sans, sans-serif',
                color: CORES.citrico,
              }}
            >
              ✦ IA CLUB
            </div>
          </div>
        );

      case 'Newsletter Café com AI':
        return (
          <div
            style={{
              padding: miniatura ? '0.75rem' : '1.5rem',
              backgroundColor: CORES.citrico,
              color: CORES.petroleo,
            }}
          >
            <div
              style={{
                fontSize: miniatura ? '0.6rem' : '0.75rem',
                fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                marginBottom: miniatura ? '0.25rem' : '0.5rem',
                letterSpacing: '0.1em',
              }}
            >
              ☕ Café com AI
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.75rem' : '1.125rem',
                fontWeight: 800,
                fontFamily: 'Archivo, sans-serif',
                marginBottom: miniatura ? '0.4rem' : '0.75rem',
                lineHeight: 1.2,
              }}
            >
              {campos.titulo || 'As bombas da semana em 5 min'}
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.6rem' : '0.875rem',
                fontFamily: 'Instrument Sans, sans-serif',
                lineHeight: 1.4,
                opacity: 0.85,
              }}
            >
              {campos.descricao || 'Tudo que você precisa saber sobre IA aplicada.'}
            </div>
          </div>
        );

      case 'Chamada de ação':
        return (
          <div
            style={{
              padding: miniatura ? '1rem' : '2rem',
              backgroundColor: CORES.citrico,
              color: CORES.petroleo,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: miniatura ? '0.75rem' : '1.5rem',
                fontWeight: 900,
                fontFamily: 'Archivo, sans-serif',
                marginBottom: '0.75rem',
                lineHeight: 1.1,
              }}
            >
              {campos.titulo || 'Aprenda IA aplicando'}
            </div>
            <div
              style={{
                fontSize: miniatura ? '0.625rem' : '0.875rem',
                fontFamily: 'Instrument Sans, sans-serif',
                marginBottom: miniatura ? '0.5rem' : '1rem',
                lineHeight: 1.4,
              }}
            >
              {campos.descricao || 'Sem teoria. Sem enrolação. Comunidade viva.'}
            </div>
            <div
              style={{
                padding: miniatura ? '0.4rem 0.75rem' : '0.75rem 1.5rem',
                backgroundColor: CORES.petroleo,
                color: CORES.citrico,
                fontWeight: 700,
                fontSize: miniatura ? '0.6rem' : '0.875rem',
                fontFamily: 'Archivo, sans-serif',
                borderRadius: 0,
              }}
            >
              {campos.cta || '✦ Começar agora'}
            </div>
          </div>
        );

      default:
        return (
          <div
            style={{
              padding: miniatura ? '1rem' : '2rem',
              textAlign: 'center',
              color: cores.txtPrincipal,
            }}
          >
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700 }}>
              {nome}
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Preview personalizado
            </div>
          </div>
        );
    }
  };

  if (miniatura) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio:
            proporcao === '9:16'
              ? '9/16'
              : proporcao === '1:1'
                ? '1'
                : '4/5',
          backgroundColor: cores.bgFundo || CORES.gelo,
          border: (cores.border as string | undefined) ? `1px solid ${cores.border}` : 'none',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {renderTemplateContent()}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          aspectRatio:
            proporcao === '9:16'
              ? '9/16'
              : proporcao === '1:1'
                ? '1'
                : '4/5',
          backgroundColor: cores.bgFundo || CORES.gelo,
          border: (cores.border as string | undefined) ? `1px solid ${cores.border}` : 'none',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {renderTemplateContent()}
      </div>
    </div>
  );
}
