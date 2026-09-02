'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, X, Edit2 } from 'lucide-react';

interface Sugestao {
  id: string;
  conversa_id: string;
  agente_id: number;
  sugestao: string;
  status: string;
  final_message?: string;
  motivo_rejeicao?: string;
  lead_ref?: string;
  created_at: string;
}

export default function FilaAprovacao() {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendente');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    carregarSugestoes();
    const interval = setInterval(carregarSugestoes, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  async function carregarSugestoes() {
    try {
      const res = await fetch(`/api/agente/sugestoes?status=${filter}`);
      const data = await res.json();
      setSugestoes(data.sugestoes || []);
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
    } finally {
      setLoading(false);
    }
  }

  async function aprovar(sugestaoId: string) {
    try {
      const res = await fetch('/api/agente/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sugestaoId,
          acao: 'aprovar',
        }),
      });

      if (res.ok) {
        setSugestoes(s => s.filter(x => x.id !== sugestaoId));
      }
    } catch (err) {
      console.error('Erro ao aprovar:', err);
    }
  }

  async function editar(sugestaoId: string) {
    if (!editText.trim()) return;

    try {
      const res = await fetch('/api/agente/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sugestaoId,
          acao: 'editar',
          finalMessage: editText,
        }),
      });

      if (res.ok) {
        setSugestoes(s => s.filter(x => x.id !== sugestaoId));
        setEditingId(null);
        setEditText('');
      }
    } catch (err) {
      console.error('Erro ao editar:', err);
    }
  }

  async function rejeitar(sugestaoId: string) {
    if (!rejectReason.trim()) return;

    try {
      const res = await fetch('/api/agente/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sugestaoId,
          acao: 'rejeitar',
          motivoRejeicao: rejectReason,
        }),
      });

      if (res.ok) {
        setSugestoes(s => s.filter(x => x.id !== sugestaoId));
        setRejectReason('');
      }
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-50 border-yellow-200';
      case 'aprovada':
        return 'bg-green-50 border-green-200';
      case 'editada':
        return 'bg-blue-50 border-blue-200';
      case 'rejeitada':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pendente</span>;
      case 'aprovada':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Aprovada</span>;
      case 'editada':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Editada</span>;
      case 'rejeitada':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Rejeitada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Fila de Aprovação</h1>
        <div className="flex gap-2">
          {['pendente', 'aprovada', 'editada', 'rejeitada'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                filter === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : sugestoes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhuma sugestão neste status</div>
      ) : (
        <div className="space-y-4">
          {sugestoes.map(sug => (
            <div
              key={sug.id}
              className={`border-l-4 rounded p-4 ${getStatusColor(sug.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    {getStatusBadge(sug.status)}
                    <span className="text-xs text-gray-600">{sug.conversa_id}</span>
                  </div>
                  {sug.lead_ref && (
                    <p className="text-xs text-gray-600">Lead: {sug.lead_ref}</p>
                  )}
                </div>
                <time className="text-xs text-gray-500">
                  {new Date(sug.created_at).toLocaleString('pt-BR')}
                </time>
              </div>

              <div className="bg-white rounded p-3 mb-3 border border-gray-200">
                <p className="text-sm text-gray-700">{sug.sugestao}</p>
              </div>

              {sug.status === 'pendente' && (
                <div className="space-y-2">
                  {editingId === sug.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        placeholder="Edite o texto aqui..."
                        className="w-full p-2 border rounded text-sm"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => editar(sug.id)}
                          className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Salvar Edição
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditText('');
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => aprovar(sug.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        <Check size={14} /> Aprovar
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(sug.id);
                          setEditText(sug.sugestao);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Motivo da rejeição:');
                          if (reason) {
                            setRejectReason(reason);
                            rejeitar(sug.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        <X size={14} /> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {sug.status === 'rejeitada' && sug.motivo_rejeicao && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-700 flex gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{sug.motivo_rejeicao}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
