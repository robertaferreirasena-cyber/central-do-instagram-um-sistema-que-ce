'use client';

import { useEffect, useState } from 'react';
import { Brain, computeScore } from '@/lib/brain';
import BrainSidebar from '@/components/brain/BrainSidebar';
import BrainEditor from '@/components/brain/BrainEditor';
import BrainStats from '@/components/brain/BrainStats';
import { useAuth } from '@/hooks/useAuth';

type SectionKey =
  | 'empresa'
  | 'produtos_ofertas'
  | 'publico'
  | 'tom_de_voz'
  | 'perguntas_frequentes'
  | 'politicas'
  | 'conteudos_aprovados'
  | 'diferenciais';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'produtos_ofertas', label: 'Produtos e ofertas' },
  { key: 'publico', label: 'Público' },
  { key: 'tom_de_voz', label: 'Tom de voz' },
  { key: 'perguntas_frequentes', label: 'Perguntas frequentes' },
  { key: 'politicas', label: 'Políticas' },
  { key: 'conteudos_aprovados', label: 'Conteúdos aprovados' },
  { key: 'diferenciais', label: 'Diferenciais' },
];

export default function BrainPage() {
  const { accountId } = useAuth();
  const [brain, setBrain] = useState<Brain | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBrainData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/brain?account_id=${accountId || 'iaclub-default'}`);
        if (res.ok) {
          const { data } = await res.json();
          setBrain(data);
        } else {
          setBrain(null);
        }
      } catch (err) {
        console.error('Erro ao carregar brain:', err);
        setBrain(null);
      } finally {
        setLoading(false);
      }
    }

    loadBrainData();
  }, [accountId]);

  const handleSectionChange = async (sectionKey: SectionKey, updates: any) => {
    if (!brain) return;

    setSaving(true);
    try {
      const res = await fetch('/api/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId || 'iaclub-default',
          secoes: { [sectionKey]: updates },
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setBrain(data);
      }
    } catch (err) {
      console.error('Erro ao atualizar brain:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedIaClub = async () => {
    if (!accountId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/brain/seed-iaclub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (res.ok) {
        const brainRes = await fetch(`/api/brain?account_id=${accountId || 'iaclub-default'}`);
        if (brainRes.ok) {
          const { data } = await brainRes.json();
          setBrain(data);
        }
        alert('Brain seedado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao seedar:', err);
      alert('Erro ao seedar brain');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Carregando Brain System...</p>
      </div>
    );
  }

  if (!brain) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Brain não encontrado</p>
      </div>
    );
  }

  const currentSection = activeSection;

  return (
    <div className="flex gap-6 bg-gradient-to-b from-[#070d18] to-[#0a1125] min-h-screen p-6">
      {/* SIDEBAR */}
      <BrainSidebar
        sections={SECTIONS}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />

      {/* EDITOR */}
      <div className="flex-1">
        <div className="mb-6">
          <div className="mb-2 inline-block">
            <span className="text-xs font-mono uppercase tracking-widest text-[#3ddc84]">
              BASE DE CONHECIMENTO
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[#dce9f7] mb-2">Brain System</h1>
          <p className="text-[#a0b0c7] mb-4">
            O que a IA pode usar para criar e responder com segurança.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={handleSeedIaClub}
              disabled={saving}
              className="px-4 py-2 bg-[#3ddc84] text-[#070d18] font-semibold rounded hover:bg-[#2fc870] disabled:opacity-50"
            >
              {saving ? 'Carregando...' : 'Seedar IA Club'}
            </button>
            <button className="px-4 py-2 border border-[#3ddc84] text-[#3ddc84] font-semibold rounded hover:bg-[#3ddc84]/10">
              Importar material
            </button>
            <button className="px-4 py-2 border border-[#3ddc84] text-[#3ddc84] font-semibold rounded hover:bg-[#3ddc84]/10">
              Nova informação
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* CENTER - EDITOR */}
          <div className="flex-1">
            <BrainEditor
              section={activeSection}
              data={brain.secoes[activeSection]}
              onUpdate={(updates) => handleSectionChange(activeSection, updates)}
              saving={saving}
            />
          </div>

          {/* RIGHT - STATS */}
          <BrainStats brain={brain} />
        </div>
      </div>
    </div>
  );
}
