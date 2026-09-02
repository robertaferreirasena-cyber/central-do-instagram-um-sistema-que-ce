'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';

interface Template {
  id: number;
  nome: string;
  descricao: string;
  formato: string;
  proporcao: string;
  objetivo: string;
  marca: string;
  campos: Array<{ nome: string; descricao: string; tipo: string }>;
  preview_url?: string;
  criado_em: string;
}

export default function ModelosPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatoFilter, setFormatoFilter] = useState('');
  const [objetivoFilter, setObjetivoFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [formatoFilter, objetivoFilter, marcaFilter]);

  const loadTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (formatoFilter) params.append('formato', formatoFilter);
      if (objetivoFilter) params.append('objetivo', objetivoFilter);
      if (marcaFilter) params.append('marca', marcaFilter);

      const res = await fetch(`/api/content/templates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.data || []);
        if (!selectedTemplate && data.data?.length > 0) {
          setSelectedTemplate(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatoOptions = [...new Set(templates.map((t) => t.formato))];
  const objetivoOptions = [...new Set(templates.map((t) => t.objetivo))];
  const marcaOptions = [...new Set(templates.map((t) => t.marca))];

  const handleUseTemplate = (template: Template) => {
    // TODO: Abrir no estúdio de conteúdo com o modelo carregado
    console.log('Usar modelo:', template.nome);
  };

  return (
    <>
      <PageHeader
        tag="BIBLIOTECA"
        title="Biblioteca de modelos"
        subtitle=""
        actions={
          <button
            style={{
              backgroundColor: '#0E2A2E',
              color: '#FAFAF8',
              padding: '0.5rem 1rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            + Criar modelo
          </button>
        }
      />

      <main style={{ padding: '2rem', flex: 1, overflow: 'auto', width: '100%' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar um modelo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E2E2DE',
                borderRadius: 0,
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                color: '#0E2A2E',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={formatoFilter}
            onChange={(e) => setFormatoFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #E2E2DE',
              borderRadius: 0,
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
              color: '#0E2A2E',
              cursor: 'pointer',
            }}
          >
            <option value="">Formato</option>
            {formatoOptions.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>

          <select
            value={objetivoFilter}
            onChange={(e) => setObjetivoFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #E2E2DE',
              borderRadius: 0,
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
              color: '#0E2A2E',
              cursor: 'pointer',
            }}
          >
            <option value="">Objetivo</option>
            {objetivoOptions.map((obj) => (
              <option key={obj} value={obj}>
                {obj}
              </option>
            ))}
          </select>

          <select
            value={marcaFilter}
            onChange={(e) => setMarcaFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #E2E2DE',
              borderRadius: 0,
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
              color: '#0E2A2E',
              cursor: 'pointer',
            }}
          >
            <option value="">Marca</option>
            {marcaOptions.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </select>
        </div>

        {/* Layout 2 colunas: Galeria + Detalhe */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
          {/* GALERIA - Grid 3 colunas */}
          <div>
            {filteredTemplates.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E2DE',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#7A8B84',
                }}
              >
                Nenhum modelo encontrado
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border:
                        selectedTemplate?.id === template.id ? '2px solid #D6F24B' : '1px solid #E2E2DE',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      position: 'relative',
                    }}
                  >
                    {/* Badge proporção */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        backgroundColor: '#0E2A2E',
                        color: '#FAFAF8',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        zIndex: 2,
                      }}
                    >
                      {template.proporcao}
                    </div>

                    {/* Thumbnail */}
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: template.proporcao === '9:16' ? '9/16' : template.proporcao === '1:1' ? '1' : '4/5',
                        backgroundColor: '#E2E2DE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: '#7A8B84',
                      }}
                    >
                      {template.nome}
                    </div>

                    {/* Nome e descrição */}
                    <div style={{ padding: '1rem' }}>
                      <h4
                        style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#0E2A2E',
                        }}
                      >
                        {template.nome}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: '#7A8B84',
                          lineHeight: '1.4',
                        }}
                      >
                        {template.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAINEL DETALHE - Direita */}
          {selectedTemplate && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E2DE',
                padding: '1.5rem',
                height: 'fit-content',
                position: 'sticky',
                top: '2rem',
              }}
            >
              <h2
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0E2A2E',
                  fontFamily: 'Archivo, sans-serif',
                }}
              >
                {selectedTemplate.nome}
              </h2>

              <p
                style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#0E2A2E',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {selectedTemplate.proporcao} · {selectedTemplate.formato.toUpperCase()}
              </p>

              <p
                style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '0.875rem',
                  color: '#7A8B84',
                  lineHeight: '1.5',
                }}
              >
                {selectedTemplate.descricao}
              </p>

              <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #E2E2DE', paddingTop: '1rem' }}>
                <h4
                  style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0E2A2E',
                    textTransform: 'uppercase',
                  }}
                >
                  Campos editáveis
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedTemplate.campos.map((campo, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #E2E2DE',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: '0 0 0.25rem 0',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#0E2A2E',
                          }}
                        >
                          {campo.nome}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: '#7A8B84',
                          }}
                        >
                          {campo.descricao}
                        </p>
                      </div>
                      <span
                        style={{
                          color: '#7A8B84',
                          fontSize: '1rem',
                          marginLeft: '0.5rem',
                        }}
                      >
                        ›
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                style={{
                  width: '100%',
                  backgroundColor: '#D6F24B',
                  color: '#0E2A2E',
                  padding: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                ✦ Usar modelo
              </button>

              <div
                style={{
                  backgroundColor: '#F9F9F7',
                  border: '1px solid #E2E2DE',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#7A8B84',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <p style={{ margin: '0 0 0.5rem 0' }}>DICA</p>
                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 400, lineHeight: '1.4' }}>
                  Customize os campos editáveis para adaptar o modelo à sua marca e objetivo.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
