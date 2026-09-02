'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [agenteAtivo, setAgenteAtivo] = useState(false);
  const [aba, setAba] = useState<'apis' | 'agentes'>('apis');
  const [loading, setLoading] = useState(false);

  const handleToggleAgente = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agente/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAgenteAtivo(data.agenteAtivo);
      }
    } catch (error) {
      console.error('Erro ao toggle agente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedIaClub = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agente/seed-iaclub', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Erro ao semear IA Club:', error);
      alert('Erro ao semear IA Club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 mt-1">Configure suas integrações de API e agentes</p>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setAba('apis')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            aba === 'apis'
              ? 'text-white border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          APIs
        </button>
        <button
          onClick={() => setAba('agentes')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            aba === 'agentes'
              ? 'text-white border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Agentes
        </button>
      </div>

      {aba === 'agentes' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">🤖 Agente IA Club</h2>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    agenteAtivo
                      ? 'bg-green-900/50 text-green-300 border border-green-700'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                  }`}>
                    {agenteAtivo ? '✓ ATIVO' : '✗ DESLIGADO'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  {agenteAtivo
                    ? 'Agente respondendo automaticamente a clientes (modo agente ativo)'
                    : 'Agente desligado — ative quando quiser. Em modo treino, sugestões são salvas como rascunho.'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button
                onClick={handleToggleAgente}
                disabled={loading}
                className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                  agenteAtivo
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? '...' : agenteAtivo ? 'Desligar Agente' : 'Ligar Agente'}
              </button>

              <button
                onClick={handleSeedIaClub}
                disabled={loading}
                className="w-full py-2 px-4 rounded font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : 'Semear Base IA Club (7 FAQ)'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-700 text-sm text-slate-300">
              <p className="font-semibold text-slate-200 mb-2">Regras:</p>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>Agente default OFF — você ativa manualmente quando quiser</li>
                <li>Quando OFF, sugestões são salvas como rascunho (modo treino)</li>
                <li>Base de conhecimento contém 7 perguntas frequentes da IA Club</li>
                <li>Nenhuma resposta é enviada até você ligar o agente</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {aba === 'apis' && (
        <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🔑 Publora</h2>
          <p className="text-slate-400 text-sm mb-4">
            Publora publica seus posts no Instagram. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              PUBLORA_API_KEY=pk_...
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              PUBLORA_BASE_URL=https://api.publora.com
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">💬 Zernio</h2>
          <p className="text-slate-400 text-sm mb-4">
            Zernio gerencia inbox e automação de atendimento. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              ZERNIO_API_KEY=sk_...
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              ZERNIO_BASE_URL=https://zernio.com/api/v1
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
          <p className="text-slate-400 text-xs mt-3">
            Webhook URL para Zernio: <code className="bg-black/30 px-2 py-1 rounded">https://seu-dominio.com/api/webhook/zernio</code>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🤖 Claude API</h2>
          <p className="text-slate-400 text-sm mb-4">
            Claude gera conteúdo e respostas automáticas. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
            CLAUDE_API_KEY=sk-ant-...
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">📱 CRM</h2>
          <p className="text-slate-400 text-sm mb-4">
            Integração com seu CRM para capturar leads. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              CRM_API_URL=http://localhost:3001
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              CRM_API_KEY=your-key-here
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">💌 Telegram</h2>
          <p className="text-slate-400 text-sm mb-4">
            Notificações de escalonamento e alertas. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              TELEGRAM_BOT_TOKEN=123456789:ABCdef...
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              TELEGRAM_CHAT_ID=your-chat-id
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-6">
          <h3 className="text-white font-bold mb-2">📝 Próximos passos</h3>
          <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
            <li>Copie as chaves de API de cada plataforma</li>
            <li>Abra o arquivo <code className="bg-black/30 px-2 py-1 rounded text-xs">.env.local</code> na raiz do projeto</li>
            <li>Preencha as variáveis conforme o .env.example</li>
            <li>Reinicie o servidor <code className="bg-black/30 px-2 py-1 rounded text-xs">npm run dev</code></li>
            <li>Configure o webhook de Zernio em seu dashboard</li>
          </ol>
        </div>
      </div>
      )}
    </div>
  );
}
