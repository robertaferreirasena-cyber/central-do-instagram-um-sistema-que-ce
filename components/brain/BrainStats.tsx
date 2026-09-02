'use client';

import { Brain, computeScore } from '@/lib/brain';

interface BrainStatsProps {
  brain: Brain;
}

export default function BrainStats({ brain }: BrainStatsProps) {
  // Usar o score real salvo no brain, não recomputar
  const score = brain.score || computeScore(brain);
  const percentage = Math.round((score / 100) * 100);

  const getStatus = () => {
    if (percentage < 25) return { label: 'Vazio', color: 'text-red-400' };
    if (percentage < 50) return { label: 'Incompleto', color: 'text-yellow-400' };
    if (percentage < 75) return { label: 'Em progresso', color: 'text-blue-400' };
    return { label: 'Completo', color: 'text-[#3ddc84]' };
  };

  const status = getStatus();

  const usedBy = [
    { label: 'Agente de conteúdo', icon: '📝', active: true },
    { label: 'Assistente de Direct', icon: '💬', active: false },
    { label: 'Funis de automação', icon: '⚙️', active: false },
  ];

  // Gerar lista de campos faltantes dinamicamente (seções vazias ou sem conteúdo)
  const missingFields: string[] = [];
  const sec = brain.secoes;

  // Verificar cada seção de forma agnóstica (string ou objeto)
  Object.entries(sec || {}).forEach(([key, value]: [string, any]) => {
    if (!value) {
      missingFields.push(key.replace(/_/g, ' '));
    } else if (typeof value === 'string' && !value.trim()) {
      missingFields.push(key.replace(/_/g, ' '));
    } else if (typeof value === 'object' && Object.values(value).every(v => !v)) {
      missingFields.push(key.replace(/_/g, ' '));
    }
  });

  return (
    <div className="w-72 flex-shrink-0 space-y-4">
      {/* SCORE */}
      <div className="bg-[#0E2A2E] rounded border border-[#1a3f45] p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#3ddc84] mb-3">
          Revisão necessária
        </h3>

        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#dce9f7] font-semibold">Completude</span>
              <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
            </div>
            <div className="w-full bg-[#1a3f45] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#29b6ff] to-[#3ddc84] h-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-[#a0b0c7] mt-1">{percentage}% completo</p>
          </div>

          {/* Score number */}
          <div className="text-center py-3 bg-[#1a3f45] rounded">
            <div className="text-3xl font-bold text-[#3ddc84]">{score}</div>
            <div className="text-xs text-[#a0b0c7]">pontos</div>
          </div>

          {/* Missing fields */}
          {missingFields.length > 0 && (
            <div className="pt-3 border-t border-[#1a3f45]">
              <p className="text-xs text-[#a0b0c7] mb-2">Falta preencher:</p>
              <ul className="space-y-1">
                {missingFields.map((field, idx) => (
                  <li key={idx} className="text-xs text-red-400 flex items-center gap-2">
                    <span>○</span> {field}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* USADO POR */}
      <div className="bg-[#0E2A2E] rounded border border-[#1a3f45] p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#3ddc84] mb-3">
          Usado por
        </h3>

        <div className="space-y-2">
          {usedBy.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                item.active ? 'bg-[#3ddc84]/10' : 'bg-[#1a3f45]/50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.active ? 'text-[#3ddc84]' : 'text-[#a0b0c7]'}`}>
                  {item.label}
                </p>
              </div>
              {item.active && (
                <div className="w-2 h-2 bg-[#3ddc84] rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STATUS */}
      <div className="bg-[#0E2A2E] rounded border border-[#1a3f45] p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#3ddc84] mb-3">
          Status
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#a0b0c7]">Estado</span>
            <span className="font-semibold capitalize text-[#dce9f7]">
              {brain.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#a0b0c7]">Atualizado em</span>
            <span className="font-mono text-[#29b6ff] text-xs">
              {new Date(brain.atualizado_em).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
