'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import FilaAprovacao from '@/components/fila-aprovacao';

export default function InteligenciaPage() {
  const [activeTab, setActiveTab] = useState<'fila' | 'brain' | 'settings'>('fila');

  return (
    <div className="w-full">
      <PageHeader
        title="Inteligência"
        subtitle="Fila de aprovação, Brain e configurações de agente"
      />

      <div className="flex gap-4 px-6 py-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('fila')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            activeTab === 'fila'
              ? 'bg-blue-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          📋 Fila de Aprovação
        </button>
        <button
          onClick={() => setActiveTab('brain')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            activeTab === 'brain'
              ? 'bg-blue-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          🧠 Brain
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            activeTab === 'settings'
              ? 'bg-blue-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          ⚙️ Configurações
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'fila' && <FilaAprovacao />}
        {activeTab === 'brain' && (
          <div className="text-center py-12 text-slate-500">
            Brain (em desenvolvimento)
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="text-center py-12 text-slate-500">
            Configurações (em desenvolvimento)
          </div>
        )}
      </div>
    </div>
  );
}
