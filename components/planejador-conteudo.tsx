'use client';

import { useState } from 'react';
import { X, Calendar, Loader } from 'lucide-react';

interface Post {
  formato: string;
  visual_brief: string;
  copy_text: string;
  hashtags: string[];
  horario_sugerido: string;
  conecta_com: string;
}

interface Dia {
  dia: number;
  data: string;
  funnel_stage: string;
  papel: string;
  posts: Post[];
}

interface PlanejadorProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export default function PlanejadorConteudo({
  isOpen,
  onClose,
  accountId,
}: PlanejadorProps) {
  const [horizon, setHorizon] = useState<1 | 7 | 15 | 30>(7);
  const [plano, setPlano] = useState<Dia[]>([]);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);

  async function gerarPlano() {
    setLoading(true);
    try {
      const res = await fetch('/api/content/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, horizon }),
      });

      const data = await res.json();

      if (data.output) {
        setPlano(data.output);
        if (data.fallback) {
          setFallback(true);
        }
      }
    } catch (err) {
      console.error('Erro ao gerar plano:', err);
    } finally {
      setLoading(false);
    }
  }

  const getFunnelBadge = (stage: string) => {
    switch (stage) {
      case 'atracao':
        return 'bg-blue-100 text-blue-800';
      case 'consideracao':
        return 'bg-purple-100 text-purple-800';
      case 'decisao':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPapelBadge = (papel: string) => {
    switch (papel) {
      case 'atrair':
        return 'bg-yellow-100 text-yellow-800';
      case 'nutrir':
        return 'bg-orange-100 text-orange-800';
      case 'prova':
        return 'bg-cyan-100 text-cyan-800';
      case 'oferta':
        return 'bg-pink-100 text-pink-800';
      case 'fechamento':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Planejador de Conteúdo</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {plano.length === 0 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Horizonte de planejamento:
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 7, 15, 30].map(h => (
                    <button
                      key={h}
                      onClick={() => setHorizon(h as any)}
                      className={`px-4 py-3 rounded font-medium transition ${
                        horizon === h
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {h} dia{h !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">📋 O que você receberá:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Plano narrativo estruturado por dias</li>
                  <li>Funil de vendas (atração, consideração, decisão)</li>
                  <li>Papel de cada post (atrair, nutrir, prova, oferta, fechamento)</li>
                  <li>Visual brief (o que fotografar/mostrar)</li>
                  <li>Copy text pronto para usar</li>
                  <li>Hashtags e horários sugeridos</li>
                </ul>
              </div>

              <button
                onClick={gerarPlano}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-500 text-white font-medium rounded hover:bg-green-600 disabled:bg-gray-400 inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Gerando plano...' : 'Gerar Plano'}
              </button>

              {fallback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
                  <p>ℹ️ Usando plano fallback (IA indisponível)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {fallback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
                  <p>⚠️ Este é um plano fallback. Edite os posts conforme necessário.</p>
                </div>
              )}

              {plano.map(dia => (
                <div key={dia.dia} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar size={18} className="text-slate-600" />
                      <span className="font-medium text-slate-900">
                        Dia {dia.dia} • {new Date(dia.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getFunnelBadge(
                          dia.funnel_stage
                        )}`}
                      >
                        {dia.funnel_stage}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getPapelBadge(
                          dia.papel
                        )}`}
                      >
                        {dia.papel}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {dia.posts.map((post, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded mb-2">
                              {post.formato.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">{post.horario_sugerido}</span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Visual Brief:</p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                            {post.visual_brief}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Legenda:</p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded italic">
                            {post.copy_text}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500 italic">
                          → {post.conecta_com}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setPlano([]);
                    setFallback(false);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded hover:bg-slate-300"
                >
                  Gerar Outro Plano
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600"
                >
                  Concluído
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
