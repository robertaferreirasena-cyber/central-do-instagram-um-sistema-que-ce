'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import StudioThumbnail from '@/components/studio/StudioThumbnail';
import type { StudioTemplate } from '@/lib/studio/types';

const C = {
  gelo: '#FAFAF8',
  petroleo: '#0E2A2E',
  citrico: '#D6F24B',
  eucalipto: '#46655C',
  petroleoEscuro: '#0a1315',
  borda: '#1c3b3f',
};

export default function ModelosPage() {
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/templates');
      const json = await res.json();
      setTemplates(json.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  // Usar modelo → cria um projeto a partir dele e abre no Estúdio
  const usarModelo = async (tpl: StudioTemplate) => {
    const res = await fetch('/api/studio/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: tpl.name, format: tpl.format, template_id: tpl.id }),
    });
    const json = await res.json();
    if (json?.data?.id) window.location.href = `/content?project=${json.data.id}`;
  };

  // Criar modelo → cria um projeto em branco e abre o Estúdio p/ desenhar (lá tem "Salvar como modelo")
  const criarModelo = async () => {
    setCriando(true);
    try {
      const res = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Novo modelo', format: '3:4' }),
      });
      const json = await res.json();
      if (json?.data?.id) window.location.href = `/content?project=${json.data.id}&novoModelo=1`;
    } finally {
      setCriando(false);
    }
  };

  const excluirModelo = async (tpl: StudioTemplate) => {
    if (!confirm(`Excluir o modelo "${tpl.name}"?`)) return;
    await fetch(`/api/studio/templates?id=${tpl.id}`, { method: 'DELETE' });
    setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
  };

  const categorias = Array.from(new Set(templates.map((t) => t.category)));
  const filtrados = templates.filter(
    (t) => t.name.toLowerCase().includes(busca.toLowerCase()) && (!cat || t.category === cat),
  );

  return (
    <>
      <PageHeader
        tag="BIBLIOTECA"
        title="Biblioteca de modelos"
        subtitle="Os modelos reais da plataforma. Use um como base ou crie o seu."
        actions={
          <button
            onClick={criarModelo}
            disabled={criando}
            style={{
              backgroundColor: C.citrico,
              color: C.petroleo,
              padding: '0.6rem 1.1rem',
              border: 'none',
              cursor: criando ? 'wait' : 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            {criando ? 'Abrindo…' : '+ Criar modelo'}
          </button>
        }
      />

      <main style={{ padding: '1.5rem', flex: 1, overflow: 'auto', width: '100%', background: '#070d18' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar modelo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: '0.6rem 0.75rem',
              border: `1px solid ${C.eucalipto}`,
              background: C.petroleoEscuro,
              color: C.gelo,
              fontSize: '0.875rem',
            }}
          />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            style={{
              padding: '0.6rem',
              border: `1px solid ${C.eucalipto}`,
              background: C.petroleoEscuro,
              color: C.gelo,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.eucalipto }}>Carregando modelos…</div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.eucalipto }}>
            Nenhum modelo encontrado. Clique em “+ Criar modelo”.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {filtrados.map((tpl) => (
              <div
                key={tpl.id}
                style={{ background: C.petroleo, border: `1px solid ${C.borda}`, overflow: 'hidden' }}
              >
                <div style={{ width: '100%', aspectRatio: '3 / 4', overflow: 'hidden', background: '#000' }}>
                  <StudioThumbnail template={tpl.template_json} width={200} />
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: C.gelo, fontFamily: 'Archivo, sans-serif' }}>
                      {tpl.name}
                    </h4>
                    {!tpl.is_system && (
                      <span style={{ fontSize: 9, color: C.citrico, fontFamily: 'JetBrains Mono, monospace' }}>SEU</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: C.eucalipto, margin: '2px 0 10px' }}>{tpl.category}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => usarModelo(tpl)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: C.citrico,
                        color: C.petroleo,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      Usar modelo
                    </button>
                    {!tpl.is_system && (
                      <button
                        onClick={() => excluirModelo(tpl)}
                        title="Excluir modelo"
                        style={{
                          padding: '0.5rem 0.6rem',
                          background: 'transparent',
                          color: '#c77',
                          border: '1px solid #5c2b2b',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
